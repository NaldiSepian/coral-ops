-- ============================================
-- SUPABASE STORAGE POLICIES
-- ============================================
-- Untuk bucket: laporan-progres
-- Jalankan ini di Supabase SQL Editor
-- ============================================

-- IMPORTANT: Pastikan bucket 'laporan-progres' sudah dibuat di Storage
-- dengan setting: Public bucket = false (private)

-- ============================================
-- 1. POLICY: Teknisi bisa upload foto laporan
-- ============================================
CREATE POLICY "Teknisi dapat upload foto laporan"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'laporan-progres' AND
  auth.role() = 'authenticated'
);

-- ============================================
-- 2. POLICY: Teknisi bisa baca foto laporan sendiri
-- ============================================
CREATE POLICY "Teknisi dapat baca laporan sendiri"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'laporan-progres' AND
  auth.role() = 'authenticated'
);

-- ============================================
-- 3. POLICY: Supervisor & Manager bisa baca SEMUA foto laporan
-- ============================================
CREATE POLICY "Supervisor dan Manager dapat baca semua laporan"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'laporan-progres' AND
  EXISTS (
    SELECT 1 FROM profil
    WHERE profil.id = auth.uid()
    AND profil.peran IN ('Supervisor', 'Manager')
  )
);

-- ============================================
-- 4. POLICY: Supervisor bisa update foto laporan
-- ============================================
CREATE POLICY "Supervisor dapat update foto laporan"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'laporan-progres' AND
  EXISTS (
    SELECT 1 FROM profil
    WHERE profil.id = auth.uid()
    AND profil.peran IN ('Supervisor', 'Manager')
  )
);

-- ============================================
-- 5. POLICY: Supervisor bisa delete foto laporan
-- ============================================
CREATE POLICY "Supervisor dapat delete foto laporan"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'laporan-progres' AND
  EXISTS (
    SELECT 1 FROM profil
    WHERE profil.id = auth.uid()
    AND profil.peran = 'Supervisor'
  )
);

-- ============================================
-- ALTERNATIF: Jika ingin bucket PUBLIC (tidak recommended)
-- ============================================
-- Jika Anda set bucket menjadi public, maka gambar bisa diakses tanpa auth
-- Untuk set bucket public:
-- 1. Buka Supabase Dashboard
-- 2. Storage > Buckets > laporan-progres
-- 3. Klik gear icon > Edit bucket
-- 4. Set "Public bucket" = ON
-- 
-- Kemudian hapus semua policy di atas dan buat policy sederhana:
/*
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'laporan-progres');

CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'laporan-progres');
*/

-- ============================================
-- TROUBLESHOOTING: Cek existing policies
-- ============================================
-- Jalankan query ini untuk melihat policy yang sudah ada:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- ============================================
-- TROUBLESHOOTING: Drop semua policy lama jika ada konflik
-- ============================================
-- DROP POLICY IF EXISTS "Teknisi dapat upload foto laporan" ON storage.objects;
-- DROP POLICY IF EXISTS "Teknisi dapat baca laporan sendiri" ON storage.objects;
-- DROP POLICY IF EXISTS "Supervisor dan Manager dapat baca semua laporan" ON storage.objects;
-- DROP POLICY IF EXISTS "Supervisor dapat update foto laporan" ON storage.objects;
-- DROP POLICY IF EXISTS "Supervisor dapat delete foto laporan" ON storage.objects;
