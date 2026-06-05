-- ============================================
-- MIGRATION 010: BWM Payroll Schema
-- Sistem Kompensasi Variable berbasis BWM
-- ============================================

-- 1. Master Tunjangan per Level Lisensi
CREATE TABLE IF NOT EXISTS tunjangan_lisensi (
  level VARCHAR(10) PRIMARY KEY,
  tunjangan_jabatan DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default values (hanya jika belum ada)
INSERT INTO tunjangan_lisensi (level, tunjangan_jabatan) VALUES
('Level 1', 500000),
('Level 2', 1000000),
('Level 3', 1500000)
ON CONFLICT (level) DO NOTHING;

-- 2. Master Preferensi BWM
CREATE TABLE IF NOT EXISTS preferensi_bwm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(100) NOT NULL,
  best_criteria VARCHAR(5) CHECK (best_criteria IN ('c1','c2','c3','c4','c5')),
  worst_criteria VARCHAR(5) CHECK (worst_criteria IN ('c1','c2','c3','c4','c5')),
  bo_c1 INT CHECK (bo_c1 BETWEEN 1 AND 9) DEFAULT 1,
  bo_c2 INT CHECK (bo_c2 BETWEEN 1 AND 9) DEFAULT 1,
  bo_c3 INT CHECK (bo_c3 BETWEEN 1 AND 9) DEFAULT 1,
  bo_c4 INT CHECK (bo_c4 BETWEEN 1 AND 9) DEFAULT 1,
  bo_c5 INT CHECK (bo_c5 BETWEEN 1 AND 9) DEFAULT 1,
  ow_c1 INT CHECK (ow_c1 BETWEEN 1 AND 9) DEFAULT 1,
  ow_c2 INT CHECK (ow_c2 BETWEEN 1 AND 9) DEFAULT 1,
  ow_c3 INT CHECK (ow_c3 BETWEEN 1 AND 9) DEFAULT 1,
  ow_c4 INT CHECK (ow_c4 BETWEEN 1 AND 9) DEFAULT 1,
  ow_c5 INT CHECK (ow_c5 BETWEEN 1 AND 9) DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profil(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update tabel penugasan (tambah kolom untuk BWM & auto-complete)
ALTER TABLE penugasan 
  ADD COLUMN IF NOT EXISTS tanggal_selesai_actual DATE,
  ADD COLUMN IF NOT EXISTS plafon_bonus DECIMAL(12,2) DEFAULT 1500000,
  ADD COLUMN IF NOT EXISTS bwm_status VARCHAR(20) DEFAULT 'belum_dihitung' 
    CHECK (bwm_status IN ('belum_dihitung','draft','final')),
  ADD COLUMN IF NOT EXISTS auto_complete_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS minimal_persentase_complete INT DEFAULT 100;

-- 4. Tabel Perhitungan BWM (hasil per teknisi per penugasan)
CREATE TABLE IF NOT EXISTS perhitungan_bwm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penugasan_id INT REFERENCES penugasan(id) ON DELETE CASCADE,
  teknisi_id UUID REFERENCES profil(id) ON DELETE CASCADE,
  preferensi_id UUID REFERENCES preferensi_bwm(id) ON DELETE SET NULL,
  -- Nilai mentah kriteria
  c1_kecepatan DECIMAL(5,2),
  c2_kualitas DECIMAL(5,2),
  c3_kepatuhan DECIMAL(5,2),
  c4_proaktivitas INT,
  c5_kompetensi DECIMAL(12,2),
  -- Normalisasi (0-100)
  v1 DECIMAL(6,2), 
  v2 DECIMAL(6,2), 
  v3 DECIMAL(6,2), 
  v4 DECIMAL(6,2), 
  v5 DECIMAL(6,2),
  -- Bobot BWM (dari LP solver)
  w1 DECIMAL(5,4), 
  w2 DECIMAL(5,4), 
  w3 DECIMAL(5,4), 
  w4 DECIMAL(5,4), 
  w5 DECIMAL(5,4),
  -- Konsistensi
  xi_star DECIMAL(10,6),
  cr DECIMAL(5,4),
  -- Hasil akhir
  skor_akhir DECIMAL(6,2),
  tunjangan_didapat DECIMAL(12,2),
  -- Status & approval
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','final')),
  finalisasi_oleh UUID REFERENCES profil(id) ON DELETE SET NULL,
  finalisasi_pada TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Constraint unik: 1 teknisi 1 penugasan = 1 perhitungan
  UNIQUE(penugasan_id, teknisi_id)
);

-- 5. Tabel Gaji Final (per teknisi per project/penugasan)
-- CATATAN: Sistem ini hanya menghitung komponen variable
-- Gaji pokok di-handle sistem terpisah (HR/Finance)
CREATE TABLE IF NOT EXISTS gaji_teknisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teknisi_id UUID REFERENCES profil(id) ON DELETE CASCADE,
  penugasan_id INT REFERENCES penugasan(id) ON DELETE CASCADE,
  -- Periode
  periode_mulai DATE,
  periode_selesai DATE,
  -- Komponen variable pay only
  tunjangan_jabatan DECIMAL(12,2) DEFAULT 0,
  bonus_bwm DECIMAL(12,2) DEFAULT 0,
  bonus_lain DECIMAL(12,2) DEFAULT 0,
  potongan DECIMAL(12,2) DEFAULT 0,
  -- Total kompensasi variable
  total_gaji DECIMAL(12,2) DEFAULT 0,
  -- Status & approval
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','disetujui','dibayar')),
  disetujui_oleh UUID REFERENCES profil(id) ON DELETE SET NULL,
  disetujui_pada TIMESTAMP WITH TIME ZONE,
  dibayar_pada TIMESTAMP WITH TIME ZONE,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Constraint unik: 1 teknisi 1 penugasan = 1 gaji
  UNIQUE(teknisi_id, penugasan_id)
);

-- Indexes untuk performance
CREATE INDEX IF NOT EXISTS idx_perhitungan_bwm_penugasan ON perhitungan_bwm(penugasan_id);
CREATE INDEX IF NOT EXISTS idx_perhitungan_bwm_teknisi ON perhitungan_bwm(teknisi_id);
CREATE INDEX IF NOT EXISTS idx_perhitungan_bwm_status ON perhitungan_bwm(status);
CREATE INDEX IF NOT EXISTS idx_gaji_teknisi_teknisi ON gaji_teknisi(teknisi_id);
CREATE INDEX IF NOT EXISTS idx_gaji_teknisi_penugasan ON gaji_teknisi(penugasan_id);
CREATE INDEX IF NOT EXISTS idx_gaji_teknisi_status ON gaji_teknisi(status);
CREATE INDEX IF NOT EXISTS idx_preferensi_bwm_active ON preferensi_bwm(is_active) WHERE is_active = true;

-- Trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tunjangan_lisensi_updated_at
  BEFORE UPDATE ON tunjangan_lisensi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferensi_bwm_updated_at
  BEFORE UPDATE ON preferensi_bwm
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gaji_teknisi_updated_at
  BEFORE UPDATE ON gaji_teknisi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fungsi untuk menghitung total gaji otomatis
CREATE OR REPLACE FUNCTION calculate_total_gaji()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_gaji = COALESCE(NEW.tunjangan_jabatan, 0) + 
                   COALESCE(NEW.bonus_bwm, 0) + 
                   COALESCE(NEW.bonus_lain, 0) - 
                   COALESCE(NEW.potongan, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_total_gaji
  BEFORE INSERT OR UPDATE ON gaji_teknisi
  FOR EACH ROW EXECUTE FUNCTION calculate_total_gaji();
