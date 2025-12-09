# 🖼️ Cara Menampilkan Gambar di Aplikasi

## Masalah: Gambar Tidak Tampil

Jika gambar tidak tampil di halaman validasi laporan, kemungkinan besar ada masalah dengan **Supabase Storage Policy**.

---

## ✅ Solusi 1: Buat Bucket Public (Paling Mudah)

### Langkah-langkah:

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project Anda

2. **Buka Storage**
   - Klik menu "Storage" di sidebar

3. **Buat atau Edit Bucket**
   - Jika belum ada bucket `laporan-progres`, klik "New bucket"
   - Jika sudah ada, klik icon **gear** di sebelah kanan bucket

4. **Set Public Bucket**
   - Toggle **"Public bucket"** = **ON**
   - Klik "Save"

5. **Tambah Policy (Optional)**
   - Klik bucket `laporan-progres`
   - Tab "Policies"
   - Klik "New Policy"
   - Pilih template **"Allow public read"**
   - Klik "Review" → "Save Policy"

### ✅ Selesai! Gambar seharusnya sudah bisa tampil.

---

## 🔒 Solusi 2: Gunakan Private Bucket + Policy (Lebih Aman)

Jika ingin bucket tetap private, jalankan SQL di **SQL Editor**:

```sql
-- 1. POLICY: Semua user authenticated bisa upload
CREATE POLICY "Teknisi dapat upload foto laporan"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'laporan-progres' AND
  auth.role() = 'authenticated'
);

-- 2. POLICY: Semua user authenticated bisa baca
CREATE POLICY "User dapat baca foto laporan"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'laporan-progres' AND
  auth.role() = 'authenticated'
);

-- 3. POLICY: Supervisor bisa delete
CREATE POLICY "Supervisor dapat delete foto laporan"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'laporan-progres' AND
  EXISTS (
    SELECT 1 FROM profil
    WHERE profil.id = auth.uid()
    AND profil.peran IN ('Supervisor', 'Manager')
  )
);
```

---

## 🛠️ Troubleshooting

### Cek apakah bucket sudah ada:
```sql
SELECT * FROM storage.buckets WHERE name = 'laporan-progres';
```

### Cek policy yang ada:
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%laporan%';
```

### Hapus semua policy lama (jika ada konflik):
```sql
DROP POLICY IF EXISTS "Teknisi dapat upload foto laporan" ON storage.objects;
DROP POLICY IF EXISTS "Teknisi dapat baca laporan sendiri" ON storage.objects;
DROP POLICY IF EXISTS "Supervisor dan Manager dapat baca semua laporan" ON storage.objects;
```

---

## 📝 Cara Test

1. **Upload foto dari teknisi** (lewat form Lapor Progres)
2. **Buka halaman Validasi Laporan** sebagai Supervisor
3. **Gambar seharusnya tampil** sebagai thumbnail kecil
4. **Klik gambar** untuk buka di tab baru

---

## 💡 Tips

- **Gunakan bucket public** jika aplikasi hanya untuk internal/tidak ada data sensitif
- **Gunakan bucket private** jika ada foto yang harus restricted
- **Pastikan URL foto** yang disimpan di database sudah lengkap (bukan hanya path)

---

## 🎨 Update Tema Warna

Halaman validasi sudah diupdate menggunakan warna dari `globals.css`:
- ✅ Primary: Teal Blue (untuk persentase badge)
- ✅ Secondary: Lime Green (untuk status disetujui)
- ✅ Accent: Abu-biru lembut (untuk status menunggu)
- ✅ Destructive: Merah (untuk status ditolak)
- ✅ Muted: Background abu-biru soft

Tidak ada lagi warna hardcoded seperti `bg-yellow-50`, `bg-green-50`, dll.
