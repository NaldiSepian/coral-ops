-- Migration: foto_ambil_url / foto_kembali_url (TEXT) → foto_ambil / foto_kembali (JSONB)
-- Menyimpan riwayat foto pengambilan & pengembalian alat (tidak overwrite)

-- 1. Tambah kolom JSONB baru
ALTER TABLE peminjaman_alat
  ADD COLUMN IF NOT EXISTS foto_ambil JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS foto_kembali JSONB DEFAULT '[]'::jsonb;

-- 2. Migrasi data lama
UPDATE peminjaman_alat
SET
  foto_ambil = CASE
    WHEN foto_ambil_url IS NOT NULL AND foto_ambil_url != ''
    THEN jsonb_build_array(jsonb_build_object(
      'url', foto_ambil_url,
      'uploaded_by', peminjam_id,
      'created_at', COALESCE(to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    ))
    ELSE '[]'::jsonb
  END,
  foto_kembali = CASE
    WHEN foto_kembali_url IS NOT NULL AND foto_kembali_url != ''
    THEN jsonb_build_array(jsonb_build_object(
      'url', foto_kembali_url,
      'uploaded_by', peminjam_id,
      'created_at', COALESCE(to_char(COALESCE(returned_at, created_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    ))
    ELSE '[]'::jsonb
  END;

-- 3. Hapus kolom TEXT lama
ALTER TABLE peminjaman_alat DROP COLUMN IF EXISTS foto_ambil_url;
ALTER TABLE peminjaman_alat DROP COLUMN IF EXISTS foto_kembali_url;
