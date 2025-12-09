-- =========================
-- ENUM TYPES
-- =========================
CREATE TYPE peran_pengguna AS ENUM ('Supervisor', 'Manager', 'Teknisi');
CREATE TYPE status_penugasan AS ENUM ('Aktif', 'Selesai', 'Dibatalkan', 'Menunggu Validasi', 'Ditolak');
CREATE TYPE status_notifikasi AS ENUM ('Belum Dibaca', 'Dibaca');
CREATE TYPE status_perpanjangan AS ENUM ('Menunggu','Disetujui','Ditolak');
CREATE TYPE kategori_penugasan AS ENUM ('Rekonstruksi', 'Instalasi', 'Perawatan');
CREATE TYPE frekuensi_laporan AS ENUM ('Harian', 'Mingguan');
CREATE TYPE dokumen_tipe AS ENUM ('penugasan','laporan','alat','lain');
CREATE TYPE status_kehadiran AS ENUM ('Belum Mulai','Sedang Dikerjakan','Selesai');
CREATE TYPE tipe_kendala_penugasan AS ENUM ('Cuaca','Akses','Teknis','Lain');
CREATE TYPE status_laporan_progres AS ENUM ('Menunggu','Sedang Dikerjakan','Hampir Selesai','Selesai');
CREATE TYPE jenis_bukti_laporan AS ENUM ('Before','After');

-- =========================
-- EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- TABEL profil (extend auth.users)
-- =========================
CREATE TABLE IF NOT EXISTS profil (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama VARCHAR(100) NOT NULL,
  peran peran_pengguna NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- =========================
-- TABEL alat (master)
-- =========================
CREATE TABLE IF NOT EXISTS alat (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  stok_total INT NOT NULL CHECK (stok_total >= 0),
  stok_tersedia INT NOT NULL CHECK (stok_tersedia >= 0 AND stok_tersedia <= stok_total),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- =========================
-- TABEL penugasan (SPK)
-- =========================
CREATE TABLE IF NOT EXISTS penugasan (
  id SERIAL PRIMARY KEY,
  judul VARCHAR(150) NOT NULL,
  lokasi GEOGRAPHY(POINT, 4326) NOT NULL,
  kategori kategori_penugasan NOT NULL,
  frekuensi_laporan frekuensi_laporan NOT NULL,
  supervisor_id UUID NOT NULL REFERENCES profil(id),
  start_date DATE NOT NULL,
  end_date DATE,
  is_extended BOOLEAN DEFAULT FALSE,
  status status_penugasan DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT chk_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- =========================
-- TABEL penugasan_teknisi (many-to-many)
-- =========================
CREATE TABLE IF NOT EXISTS penugasan_teknisi (
  id SERIAL PRIMARY KEY,
  penugasan_id INT NOT NULL REFERENCES penugasan(id) ON DELETE CASCADE,
  teknisi_id UUID NOT NULL REFERENCES profil(id),
  UNIQUE (penugasan_id, teknisi_id)
);

-- =========================
-- TABEL kehadiran_teknisi (tracking start/finish)
-- =========================
CREATE TABLE IF NOT EXISTS kehadiran_teknisi (
  id SERIAL PRIMARY KEY,
  penugasan_id INT NOT NULL REFERENCES penugasan(id) ON DELETE CASCADE,
  teknisi_id UUID NOT NULL REFERENCES profil(id),
  started_at TIMESTAMP WITH TIME ZONE,
  start_location GEOGRAPHY(POINT, 4326),
  last_checkin_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  finish_location GEOGRAPHY(POINT, 4326),
  status status_kehadiran DEFAULT 'Belum Mulai',
  UNIQUE (penugasan_id, teknisi_id)
);

-- =========================
-- TABEL peminjaman_alat
-- =========================
CREATE TABLE IF NOT EXISTS peminjaman_alat (
  id SERIAL PRIMARY KEY,
  penugasan_id INT NOT NULL REFERENCES penugasan(id) ON DELETE CASCADE,
  alat_id INT NOT NULL REFERENCES alat(id),
  jumlah INT NOT NULL CHECK (jumlah > 0),
  peminjam_id UUID REFERENCES profil(id),
  foto_ambil_url TEXT, -- URL ke Supabase Storage
  foto_kembali_url TEXT, -- URL ke Supabase Storage
  is_returned BOOLEAN DEFAULT FALSE,
  returned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =========================
-- TABEL laporan_progres
-- =========================
CREATE TABLE IF NOT EXISTS laporan_progres (
  id SERIAL PRIMARY KEY,
  penugasan_id INT NOT NULL REFERENCES penugasan(id) ON DELETE CASCADE,
  pelapor_id UUID NOT NULL REFERENCES profil(id),
  tanggal_laporan DATE NOT NULL,
  persentase_progres INT CHECK (persentase_progres BETWEEN 0 AND 100),
  status_progres status_laporan_progres NOT NULL DEFAULT 'Sedang Dikerjakan',
  foto_url TEXT, -- URL ke Supabase Storage
  titik_gps GEOGRAPHY(POINT, 4326),
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Multiple laporan per hari diperbolehkan agar teknisi bisa update berkali-kali
);

-- =========================
-- TABEL bukti_laporan
-- =========================
CREATE TABLE IF NOT EXISTS bukti_laporan (
  id SERIAL PRIMARY KEY,
  laporan_id INT NOT NULL REFERENCES laporan_progres(id) ON DELETE CASCADE,
  pair_key UUID NOT NULL DEFAULT gen_random_uuid(),
  tipe jenis_bukti_laporan NOT NULL,
  judul VARCHAR(150),
  deskripsi TEXT,
  foto_url TEXT NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE,
  taken_by UUID REFERENCES profil(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =========================
-- TABEL file_dokumen
-- Polymorphic relation: relasi_tipe sebagai TEXT agar fleksibel (mis. 'penugasan','laporan','alat')
-- =========================
CREATE TABLE IF NOT EXISTS file_dokumen (
  id SERIAL PRIMARY KEY,
  tipe dokumen_tipe NOT NULL,
  url TEXT NOT NULL, -- URL ke Supabase Storage
  relasi_id INT, -- id entitas terkait (opsional)
  relasi_tipe TEXT, -- gunakan TEXT demi fleksibilitas (mis. 'penugasan','laporan','alat')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Optional: contoh constraint utk mencegah relasi_tipe kosong jika relasi_id ada
ALTER TABLE file_dokumen
  ADD CONSTRAINT chk_file_relasi CHECK (
    (relasi_id IS NULL AND relasi_tipe IS NULL) OR (relasi_id IS NOT NULL AND relasi_tipe IS NOT NULL)
  );

-- =========================
-- TABEL perpanjangan_penugasan
-- =========================
CREATE TABLE IF NOT EXISTS perpanjangan_penugasan (
  id SERIAL PRIMARY KEY,
  penugasan_id INT NOT NULL REFERENCES penugasan(id) ON DELETE CASCADE,
  pemohon_id UUID NOT NULL REFERENCES profil(id),
  tanggal_permintaan TIMESTAMP WITH TIME ZONE DEFAULT now(),
  alasan TEXT,
  foto_url TEXT, -- URL ke Supabase Storage
  durasi_diminta INTERVAL,
  durasi_menit INT CHECK (durasi_menit IS NULL OR durasi_menit > 0),
  tipe_kendala tipe_kendala_penugasan DEFAULT 'Lain',
  deadline_before DATE,
  catatan_spv TEXT,
  ditolak_alasan TEXT,
  disetujui_oleh UUID REFERENCES profil(id),
  disetujui_pada TIMESTAMP WITH TIME ZONE,
  status status_perpanjangan DEFAULT 'Menunggu'
);

-- =========================
-- TABEL notifikasi
-- =========================
CREATE TABLE IF NOT EXISTS notifikasi (
  id SERIAL PRIMARY KEY,
  penerima_id UUID NOT NULL REFERENCES profil(id),
  pesan TEXT NOT NULL,
  status status_notifikasi DEFAULT 'Belum Dibaca',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =========================
-- TABEL log_aktivitas
-- =========================
CREATE TABLE IF NOT EXISTS log_aktivitas (
  id SERIAL PRIMARY KEY,
  pengguna_id UUID NOT NULL REFERENCES profil(id),
  aksi VARCHAR(100) NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =========================
-- INDEXES (PERFORMANCE)
-- =========================
CREATE INDEX IF NOT EXISTS idx_penugasan_status ON penugasan(status);
CREATE INDEX IF NOT EXISTS idx_laporan_progres_tanggal ON laporan_progres(tanggal_laporan);
CREATE INDEX IF NOT EXISTS idx_notifikasi_penerima ON notifikasi(penerima_id);
CREATE INDEX IF NOT EXISTS idx_profil_peran ON profil(peran);
CREATE INDEX IF NOT EXISTS idx_peminjaman_penugasan ON peminjaman_alat(penugasan_id);
CREATE INDEX IF NOT EXISTS idx_laporan_pelapor ON laporan_progres(pelapor_id);
CREATE INDEX IF NOT EXISTS idx_penugasan_kategori ON penugasan(kategori);
CREATE INDEX IF NOT EXISTS idx_log_pengguna_waktu ON log_aktivitas(pengguna_id, created_at);
CREATE INDEX IF NOT EXISTS idx_penugasan_lokasi ON penugasan USING GIST(lokasi);
CREATE INDEX IF NOT EXISTS idx_laporan_titik_gps ON laporan_progres USING GIST(titik_gps);
CREATE INDEX IF NOT EXISTS idx_kehadiran_penugasan_teknisi ON kehadiran_teknisi(penugasan_id, teknisi_id);
CREATE INDEX IF NOT EXISTS idx_perpanjangan_status ON perpanjangan_penugasan(status);
CREATE INDEX IF NOT EXISTS idx_bukti_laporan_laporan_id ON bukti_laporan(laporan_id);
CREATE INDEX IF NOT EXISTS idx_bukti_laporan_pair_key ON bukti_laporan(pair_key);

-- =========================
-- FUNGSI TRANSACTIONAL: pinjam_alat (diperkuat)
-- - Menyimpan peminjam_id
-- - Menangani concurrency dengan SELECT ... FOR UPDATE
-- - EXCEPTION handling
-- - Mengecek jumlah baris yang diupdate
-- =========================
CREATE OR REPLACE FUNCTION pinjam_alat(
  p_alat_id INT,
  p_jumlah INT,
  p_penugasan_id INT,
  p_foto_ambil_url TEXT,
  p_peminjam_id UUID
)
RETURNS TABLE(result boolean, msg text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_stok INT;
  v_updated INT;
BEGIN
  IF p_jumlah IS NULL OR p_jumlah <= 0 THEN
    RETURN QUERY SELECT FALSE, 'Jumlah harus > 0';
    RETURN;
  END IF;

  PERFORM 1 FROM penugasan WHERE id = p_penugasan_id AND is_deleted = FALSE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Penugasan tidak ditemukan atau telah dihapus';
    RETURN;
  END IF;

  SELECT stok_tersedia INTO v_stok FROM alat WHERE id = p_alat_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Alat tidak ditemukan';
    RETURN;
  END IF;

  IF v_stok < p_jumlah THEN
    RETURN QUERY SELECT FALSE, 'Stok tidak cukup';
    RETURN;
  END IF;

  UPDATE alat SET stok_tersedia = stok_tersedia - p_jumlah WHERE id = p_alat_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN QUERY SELECT FALSE, 'Gagal mengupdate stok';
    RETURN;
  END IF;

  INSERT INTO peminjaman_alat(penugasan_id, alat_id, jumlah, peminjam_id, foto_ambil_url, is_returned, created_at)
  VALUES (p_penugasan_id, p_alat_id, p_jumlah, p_peminjam_id, p_foto_ambil_url, FALSE, now());

  RETURN QUERY SELECT TRUE, 'Berhasil meminjam alat';
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE, 'Error: ' || LEFT(SQLERRM, 200);
END;
$$;

-- =========================
-- RECOMMENDED PERMISSIONS (contoh)
-- Jangan jalankan ini otomatis; sesuaikan dengan kebutuhan.
-- =========================
-- Revoke public execute and grant to authenticated only (jika ingin dipanggil oleh user terautentikasi)
REVOKE EXECUTE ON FUNCTION pinjam_alat(INT, INT, INT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION pinjam_alat(INT, INT, INT, TEXT, UUID) TO authenticated;

-- =========================
-- MIGRATION: ADD VALIDATION FIELDS TO laporan_progres
-- Tanggal: 7 Desember 2025
-- Deskripsi: Setiap laporan progres harus divalidasi oleh supervisor
-- =========================

-- 1. Tambah ENUM untuk status validasi laporan
DO $$ BEGIN
  CREATE TYPE status_validasi_laporan AS ENUM ('Menunggu', 'Disetujui', 'Ditolak');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Tambah kolom validasi di tabel laporan_progres
ALTER TABLE laporan_progres 
  ADD COLUMN IF NOT EXISTS status_validasi status_validasi_laporan DEFAULT 'Menunggu',
  ADD COLUMN IF NOT EXISTS divalidasi_oleh UUID REFERENCES profil(id),
  ADD COLUMN IF NOT EXISTS divalidasi_pada TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS catatan_validasi TEXT;

-- 3. Tambah index untuk performa query validasi
CREATE INDEX IF NOT EXISTS idx_laporan_status_validasi ON laporan_progres(status_validasi);
CREATE INDEX IF NOT EXISTS idx_laporan_penugasan_validasi ON laporan_progres(penugasan_id, status_validasi);

-- 4. Update existing records (optional - jika ada data lama, set sebagai disetujui)
-- Uncomment jika ingin auto-approve laporan yang sudah ada:
-- UPDATE laporan_progres SET status_validasi = 'Disetujui' WHERE status_validasi IS NULL;

-- =========================
-- SUPABASE STORAGE POLICIES
-- Untuk bucket: laporan-progres
-- =========================

-- IMPORTANT: Jalankan ini di Supabase SQL Editor dengan hati-hati
-- Pastikan bucket 'laporan-progres' sudah dibuat di Storage

-- Policy 1: Teknisi bisa upload foto laporan mereka sendiri
-- CREATE POLICY "Teknisi dapat upload laporan sendiri"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'laporan-progres' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy 2: Teknisi bisa baca foto laporan mereka sendiri
-- CREATE POLICY "Teknisi dapat baca laporan sendiri"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'laporan-progres' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Policy 3: Supervisor & Manager bisa baca SEMUA foto laporan
-- CREATE POLICY "Supervisor dan Manager dapat baca semua laporan"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'laporan-progres' AND
--   EXISTS (
--     SELECT 1 FROM profil
--     WHERE profil.id = auth.uid()
--     AND profil.peran IN ('Supervisor', 'Manager')
--   )
-- );

-- Policy 4: Supervisor bisa delete foto laporan (jika diperlukan)
-- CREATE POLICY "Supervisor dapat delete foto laporan"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'laporan-progres' AND
--   EXISTS (
--     SELECT 1 FROM profil
--     WHERE profil.id = auth.uid()
--     AND profil.peran = 'Supervisor'
--   )
-- );

-- =========================
-- QUERY HELPER: View untuk laporan yang perlu validasi
-- =========================
CREATE OR REPLACE VIEW v_laporan_perlu_validasi AS
SELECT 
  lp.id,
  lp.penugasan_id,
  lp.tanggal_laporan,
  lp.status_progres,
  lp.foto_url,
  lp.catatan,
  lp.status_validasi,
  lp.created_at,
  p.judul as penugasan_judul,
  p.supervisor_id,
  teknisi.nama as teknisi_nama,
  teknisi.id as teknisi_id
FROM laporan_progres lp
JOIN penugasan p ON lp.penugasan_id = p.id
JOIN profil teknisi ON lp.pelapor_id = teknisi.id
WHERE lp.status_validasi = 'Menunggu'
  AND p.is_deleted = FALSE
ORDER BY lp.created_at ASC;

-- =========================
-- FUNCTION: Validasi Laporan oleh Supervisor
-- =========================
CREATE OR REPLACE FUNCTION validasi_laporan(
  p_laporan_id INT,
  p_supervisor_id UUID,
  p_status_validasi status_validasi_laporan,
  p_catatan_validasi TEXT DEFAULT NULL
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_penugasan_id INT;
  v_supervisor_id UUID;
  v_current_status status_validasi_laporan;
BEGIN
  -- Validasi input
  IF p_status_validasi NOT IN ('Disetujui', 'Ditolak') THEN
    RETURN QUERY SELECT FALSE, 'Status validasi harus Disetujui atau Ditolak';
    RETURN;
  END IF;

  -- Ambil info laporan dan penugasan
  SELECT 
    lp.penugasan_id, 
    lp.status_validasi,
    p.supervisor_id
  INTO 
    v_penugasan_id, 
    v_current_status,
    v_supervisor_id
  FROM laporan_progres lp
  JOIN penugasan p ON lp.penugasan_id = p.id
  WHERE lp.id = p_laporan_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Laporan tidak ditemukan';
    RETURN;
  END IF;

  -- Cek apakah user adalah supervisor dari penugasan ini
  IF v_supervisor_id != p_supervisor_id THEN
    RETURN QUERY SELECT FALSE, 'Anda bukan supervisor dari penugasan ini';
    RETURN;
  END IF;

  -- Cek apakah laporan sudah divalidasi
  IF v_current_status != 'Menunggu' THEN
    RETURN QUERY SELECT FALSE, 'Laporan sudah divalidasi sebelumnya';
    RETURN;
  END IF;

  -- Update status validasi
  UPDATE laporan_progres
  SET 
    status_validasi = p_status_validasi,
    divalidasi_oleh = p_supervisor_id,
    divalidasi_pada = now(),
    catatan_validasi = p_catatan_validasi
  WHERE id = p_laporan_id;

  -- Log aktivitas
  INSERT INTO log_aktivitas(pengguna_id, aksi, deskripsi)
  VALUES (
    p_supervisor_id,
    'Validasi Laporan',
    format('Laporan ID %s untuk penugasan %s - Status: %s', p_laporan_id, v_penugasan_id, p_status_validasi)
  );

  -- Jika ditolak, kirim notifikasi ke teknisi
  IF p_status_validasi = 'Ditolak' THEN
    INSERT INTO notifikasi(penerima_id, pesan)
    SELECT 
      lp.pelapor_id,
      format('Laporan Anda untuk penugasan "%s" ditolak. Alasan: %s', p.judul, COALESCE(p_catatan_validasi, 'Tidak ada catatan'))
    FROM laporan_progres lp
    JOIN penugasan p ON lp.penugasan_id = p.id
    WHERE lp.id = p_laporan_id;
  END IF;

  RETURN QUERY SELECT TRUE, format('Laporan berhasil %s', 
    CASE WHEN p_status_validasi = 'Disetujui' THEN 'disetujui' ELSE 'ditolak' END
  );
END;
$$;

-- Grant permission
REVOKE EXECUTE ON FUNCTION validasi_laporan(INT, UUID, status_validasi_laporan, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION validasi_laporan(INT, UUID, status_validasi_laporan, TEXT) TO authenticated;

-- =========================
-- FUNCTION: Cek apakah penugasan bisa diselesaikan
-- Penugasan baru bisa status "Selesai" jika semua laporan sudah disetujui
-- =========================
CREATE OR REPLACE FUNCTION cek_penugasan_siap_selesai(p_penugasan_id INT)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_laporan INT;
  v_laporan_disetujui INT;
  v_laporan_ditolak INT;
BEGIN
  -- Hitung total laporan
  SELECT COUNT(*) INTO v_total_laporan
  FROM laporan_progres
  WHERE penugasan_id = p_penugasan_id;

  -- Hitung laporan yang disetujui
  SELECT COUNT(*) INTO v_laporan_disetujui
  FROM laporan_progres
  WHERE penugasan_id = p_penugasan_id
    AND status_validasi = 'Disetujui';

  -- Hitung laporan yang ditolak
  SELECT COUNT(*) INTO v_laporan_ditolak
  FROM laporan_progres
  WHERE penugasan_id = p_penugasan_id
    AND status_validasi = 'Ditolak';

  -- Penugasan siap selesai jika:
  -- 1. Ada minimal 1 laporan
  -- 2. Tidak ada laporan yang menunggu validasi
  -- 3. Tidak ada laporan yang ditolak
  RETURN (v_total_laporan > 0) 
    AND (v_total_laporan = v_laporan_disetujui) 
    AND (v_laporan_ditolak = 0);
END;
$$;

GRANT EXECUTE ON FUNCTION cek_penugasan_siap_selesai(INT) TO authenticated;

-- =========================
-- MIGRATION: MANAGER FINAL VALIDATION
-- Tanggal: 7 Desember 2025
-- Deskripsi: Manager melakukan final validation sebelum penugasan dinyatakan selesai
-- =========================

-- 1. Tambah kolom di tabel penugasan untuk track manager approval
ALTER TABLE penugasan
  ADD COLUMN IF NOT EXISTS divalidasi_manager_oleh UUID REFERENCES profil(id),
  ADD COLUMN IF NOT EXISTS divalidasi_manager_pada TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS catatan_manager_validasi TEXT;

-- 2. Create VIEW untuk penugasan yang menunggu validasi manager
CREATE OR REPLACE VIEW v_penugasan_menunggu_manager_validasi AS
SELECT 
  p.id,
  p.judul,
  p.kategori,
  p.supervisor_id,
  p.status,
  p.start_date,
  p.end_date,
  p.is_extended,
  p.created_at,
  spv.nama as supervisor_nama,
  COUNT(DISTINCT pt.teknisi_id) as jumlah_teknisi,
  COUNT(DISTINCT lp.id) as jumlah_laporan,
  COUNT(DISTINCT CASE WHEN lp.status_validasi = 'Disetujui' THEN lp.id END) as laporan_disetujui,
  COUNT(DISTINCT CASE WHEN lp.status_validasi = 'Ditolak' THEN lp.id END) as laporan_ditolak
FROM penugasan p
JOIN profil spv ON p.supervisor_id = spv.id
LEFT JOIN penugasan_teknisi pt ON p.id = pt.penugasan_id
LEFT JOIN laporan_progres lp ON p.id = lp.penugasan_id
WHERE p.status = 'Menunggu Validasi'
  AND p.is_deleted = FALSE
  AND p.divalidasi_manager_oleh IS NULL
GROUP BY p.id, p.judul, p.kategori, p.supervisor_id, p.status, 
         p.start_date, p.end_date, p.is_extended, p.created_at, spv.nama
ORDER BY p.created_at DESC;

-- 3. Create indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_penugasan_manager_validasi ON penugasan(status, divalidasi_manager_oleh);
CREATE INDEX IF NOT EXISTS idx_penugasan_supervisor_manager ON penugasan(supervisor_id, status);

-- 4. Create FUNCTION untuk manager approve/reject penugasan
CREATE OR REPLACE FUNCTION manager_validasi_penugasan(
  p_penugasan_id INT,
  p_manager_id UUID,
  p_status_penugasan status_penugasan,
  p_catatan TEXT DEFAULT NULL
)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_status status_penugasan;
  v_supervisor_id UUID;
  v_judul VARCHAR;
  v_semua_laporan_disetujui BOOLEAN;
BEGIN
  -- Validasi input
  IF p_status_penugasan NOT IN ('Selesai', 'Ditolak') THEN
    RETURN QUERY SELECT FALSE, 'Status harus Selesai atau Ditolak';
    RETURN;
  END IF;

  -- Ambil info penugasan
  SELECT 
    penugasan.status,
    penugasan.supervisor_id,
    penugasan.judul
  INTO 
    v_current_status,
    v_supervisor_id,
    v_judul
  FROM penugasan
  WHERE id = p_penugasan_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Penugasan tidak ditemukan';
    RETURN;
  END IF;

  -- Cek status penugasan
  IF v_current_status != 'Menunggu Validasi' THEN
    RETURN QUERY SELECT FALSE, format('Penugasan sudah dalam status %s, tidak bisa divalidasi lagi', v_current_status);
    RETURN;
  END IF;

  -- Cek apakah manager valid (minimal ada 1 penugasan dari supervisor manapun)
  -- Manager bisa approve penugasan dari siapa saja
  IF NOT EXISTS (SELECT 1 FROM profil WHERE id = p_manager_id AND peran = 'Manager') THEN
    RETURN QUERY SELECT FALSE, 'Hanya manager yang bisa approve penugasan';
    RETURN;
  END IF;

  -- Jika ingin approve (Selesai), cek semua laporan disetujui
  IF p_status_penugasan = 'Selesai' THEN
    SELECT cek_penugasan_siap_selesai(p_penugasan_id) INTO v_semua_laporan_disetujui;
    
    IF NOT v_semua_laporan_disetujui THEN
      RETURN QUERY SELECT FALSE, 'Tidak semua laporan dari penugasan ini telah disetujui supervisor';
      RETURN;
    END IF;
  END IF;

  -- Update penugasan dengan manager validation
  UPDATE penugasan
  SET 
    status = p_status_penugasan,
    divalidasi_manager_oleh = p_manager_id,
    divalidasi_manager_pada = now(),
    catatan_manager_validasi = p_catatan
  WHERE id = p_penugasan_id;

  -- Log aktivitas
  INSERT INTO log_aktivitas(pengguna_id, aksi, deskripsi)
  VALUES (
    p_manager_id,
    'Final Validasi Penugasan',
    format('Penugasan "%s" (ID: %s) - Status: %s', v_judul, p_penugasan_id, p_status_penugasan)
  );

  -- Kirim notifikasi ke supervisor
  INSERT INTO notifikasi(penerima_id, pesan)
  VALUES (
    v_supervisor_id,
    format('Penugasan "%s" telah di-final validate oleh manager - Status: %s', v_judul, p_status_penugasan)
  );

  RETURN QUERY SELECT TRUE, format('Penugasan berhasil %s oleh manager', 
    CASE WHEN p_status_penugasan = 'Selesai' THEN 'diselesaikan' ELSE 'ditolak' END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION manager_validasi_penugasan(INT, UUID, status_penugasan, TEXT) TO authenticated;

-- =========================
-- MIGRATION: ADD PERSENTASE VALIDATION
-- Tanggal: 7 Desember 2025
-- Deskripsi: Validasi persentase berdasarkan status progres
-- =========================

-- Tambah constraint untuk validasi persentase berdasarkan status_progres
ALTER TABLE laporan_progres
  DROP CONSTRAINT IF EXISTS chk_persentase_progres_range;

ALTER TABLE laporan_progres
  ADD CONSTRAINT chk_persentase_progres_range CHECK (
    CASE 
      WHEN status_progres = 'Menunggu' THEN persentase_progres >= 0 AND persentase_progres <= 10
      WHEN status_progres = 'Sedang Dikerjakan' THEN persentase_progres >= 11 AND persentase_progres <= 75
      WHEN status_progres = 'Hampir Selesai' THEN persentase_progres >= 76 AND persentase_progres <= 99
      WHEN status_progres = 'Selesai' THEN persentase_progres = 100
      ELSE TRUE
    END
  );

-- Create helper function untuk validasi persentase
CREATE OR REPLACE FUNCTION validate_persentase_progres(
  p_status_progres status_laporan_progres,
  p_persentase INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE 
    WHEN p_status_progres = 'Menunggu' THEN p_persentase >= 0 AND p_persentase <= 10
    WHEN p_status_progres = 'Sedang Dikerjakan' THEN p_persentase >= 11 AND p_persentase <= 75
    WHEN p_status_progres = 'Hampir Selesai' THEN p_persentase >= 76 AND p_persentase <= 99
    WHEN p_status_progres = 'Selesai' THEN p_persentase = 100
    ELSE FALSE
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION validate_persentase_progres(status_laporan_progres, INT) TO authenticated;

-- ============================================
-- DROP TABLE kehadiran_teknisi
-- ============================================
-- Script untuk menghapus table kehadiran_teknisi
-- dan semua data terkait dari database
-- Dibuat: 8 Desember 2025
-- ============================================

-- Drop index terlebih dahulu
DROP INDEX IF EXISTS idx_kehadiran_penugasan_teknisi;

-- Drop table kehadiran_teknisi
DROP TABLE IF EXISTS kehadiran_teknisi CASCADE;

-- Verifikasi table sudah terhapus
-- Jalankan query ini untuk memastikan:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'kehadiran_teknisi';
-- (Harus return 0 rows)
