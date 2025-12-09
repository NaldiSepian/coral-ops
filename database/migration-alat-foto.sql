-- ============================================
-- MIGRATION: ADD FOTO TO ALAT TABLE
-- ============================================
-- Tanggal: 9 Desember 2025
-- Deskripsi: Tambah kolom foto_url untuk menyimpan gambar alat
-- Tujuan: Membantu teknisi mengidentifikasi alat dengan visual
-- ============================================

-- 1. Tambah kolom foto_url ke tabel alat
ALTER TABLE alat
  ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2. Tambah kolom deskripsi untuk informasi lebih detail
ALTER TABLE alat
  ADD COLUMN IF NOT EXISTS deskripsi TEXT;

-- 3. Tambah kolom tipe/kategori alat
ALTER TABLE alat
  ADD COLUMN IF NOT EXISTS tipe_alat VARCHAR(50);

-- 4. Buat index untuk performa pencarian
CREATE INDEX IF NOT EXISTS idx_alat_tipe ON alat(tipe_alat);
CREATE INDEX IF NOT EXISTS idx_alat_nama_search ON alat USING GIN(to_tsvector('indonesian', nama));

-- 5. Update struktur tabel untuk lebih informatif
-- (Opsional: Jika ingin rename kolom, gunakan ALTER TABLE ... RENAME COLUMN)
-- ALTER TABLE alat RENAME COLUMN stok_total TO total_stok;

-- ============================================
-- SUPABASE STORAGE POLICY UNTUK ALAT
-- ============================================
-- Jalankan di Supabase SQL Editor

-- Policy 1: Semua user authenticated bisa upload foto alat
CREATE POLICY "Upload foto alat"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'alat-foto' AND
  auth.role() = 'authenticated'
);

-- Policy 2: Public dapat melihat foto alat
CREATE POLICY "Public read alat foto"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'alat-foto');

-- Policy 3: Authenticated dapat melihat foto alat
CREATE POLICY "Authenticated read alat foto"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'alat-foto');

-- Policy 4: Supervisor dapat update dan delete
CREATE POLICY "Supervisor manage alat foto"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'alat-foto' AND
  EXISTS (
    SELECT 1 FROM profil
    WHERE profil.id = auth.uid()
    AND profil.peran = 'Supervisor'
  )
);

CREATE POLICY "Supervisor delete alat foto"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'alat-foto' AND
  EXISTS (
    SELECT 1 FROM profil
    WHERE profil.id = auth.uid()
    AND profil.peran = 'Supervisor'
  )
);

-- ============================================
-- QUICK VIEW: Lihat struktur tabel alat
-- ============================================
-- SELECT * FROM alat LIMIT 1;
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'alat' ORDER BY ordinal_position;
