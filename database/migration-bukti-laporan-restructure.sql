-- ============================================
-- MIGRATION: Restructure bukti_laporan table
-- ============================================
-- Mengubah struktur dari 2 rows per pair (before/after terpisah dengan tipe enum)
-- menjadi 1 row per pair (before_foto_url dan after_foto_url dalam satu baris)
-- ============================================

-- 1. Backup data lama (opsional, untuk safety)
CREATE TABLE IF NOT EXISTS bukti_laporan_backup AS 
SELECT * FROM bukti_laporan;

-- 2. Drop tabel lama
DROP TABLE IF EXISTS bukti_laporan;

-- 3. Buat tabel baru dengan struktur yang lebih robust
CREATE TABLE bukti_laporan (
  id SERIAL PRIMARY KEY,
  laporan_id INT NOT NULL REFERENCES laporan_progres(id) ON DELETE CASCADE,
  pair_key UUID NOT NULL DEFAULT gen_random_uuid(),
  judul VARCHAR(150),
  deskripsi TEXT,
  before_foto_url TEXT NOT NULL,
  after_foto_url TEXT NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  taken_by UUID REFERENCES profil(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Index untuk performa query
CREATE INDEX idx_bukti_laporan_laporan_id ON bukti_laporan(laporan_id);
CREATE INDEX idx_bukti_laporan_pair_key ON bukti_laporan(pair_key);

-- 5. Migrate data dari backup (jika ada data lama yang perlu dipindahkan)
-- Uncomment script di bawah jika ingin migrate data lama:
/*
INSERT INTO bukti_laporan (
  laporan_id, 
  pair_key, 
  judul, 
  deskripsi, 
  before_foto_url, 
  after_foto_url,
  taken_at,
  taken_by,
  metadata,
  created_at
)
SELECT 
  b.laporan_id,
  b.pair_key,
  MAX(b.judul) as judul,
  MAX(b.deskripsi) as deskripsi,
  MAX(CASE WHEN b.tipe = 'Before' THEN b.foto_url END) as before_foto_url,
  MAX(CASE WHEN b.tipe = 'After' THEN b.foto_url END) as after_foto_url,
  MAX(b.taken_at) as taken_at,
  MAX(b.taken_by) as taken_by,
  MAX(b.metadata) as metadata,
  MAX(b.created_at) as created_at
FROM bukti_laporan_backup b
GROUP BY b.laporan_id, b.pair_key
HAVING 
  MAX(CASE WHEN b.tipe = 'Before' THEN b.foto_url END) IS NOT NULL 
  AND MAX(CASE WHEN b.tipe = 'After' THEN b.foto_url END) IS NOT NULL;
*/

-- 6. Drop backup table setelah verifikasi (opsional)
-- DROP TABLE IF EXISTS bukti_laporan_backup;

-- 7. Drop enum yang tidak terpakai lagi (opsional)
-- DROP TYPE IF EXISTS jenis_bukti_laporan;

COMMENT ON TABLE bukti_laporan IS 'Dokumentasi before/after dengan 1 row per pair untuk struktur data yang lebih robust';
COMMENT ON COLUMN bukti_laporan.pair_key IS 'UUID unik untuk mengidentifikasi pasangan before/after';
COMMENT ON COLUMN bukti_laporan.before_foto_url IS 'URL foto kondisi sebelum pekerjaan';
COMMENT ON COLUMN bukti_laporan.after_foto_url IS 'URL foto kondisi setelah pekerjaan';
