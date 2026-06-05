# 01 — Database dan Schema
> Langkah pertama: Membangun fondasi data menggunakan PostgreSQL.

Dalam pengembangan aplikasi berorientasi data, kita selalu mulai dari **Database Schema**. Tanpa tabel yang benar, logika API dan UI akan berantakan.

---

## 1. Persiapan Supabase
Buat project baru di [Supabase Dashboard](https://supabase.com). Dapatkan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` untuk diletakkan di file `.env.local`.

---

## 2. Membuat Tabel Utama
Gunakan SQL Editor di Supabase untuk menjalankan perintah berikut (atau lihat file `database/schema.sql` jika ada).

### Tabel Profil (User)
```sql
CREATE TABLE profil (
  id UUID REFERENCES auth.users PRIMARY KEY,
  nama TEXT NOT NULL,
  peran TEXT CHECK (peran IN ('Manager', 'Supervisor', 'Teknisi')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabel Penugasan (SPK)
```sql
CREATE TABLE penugasan (
  id SERIAL PRIMARY KEY,
  judul TEXT NOT NULL,
  lokasi GEOGRAPHY(POINT) NOT NULL, -- Membutuhkan ekstensi PostGIS
  kategori TEXT,
  status TEXT DEFAULT 'Aktif',
  supervisor_id UUID REFERENCES profil(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Menghubungkan Antar Tabel (Relasi)
Pastikan setiap tabel yang memiliki referensi ke tabel lain memiliki **Foreign Key** yang benar. Misalnya, tabel `penugasan_teknisi` untuk menghubungkan banyak teknisi ke satu tugas (*many-to-many*).

```sql
CREATE TABLE penugasan_teknisi (
  penugasan_id INT REFERENCES penugasan(id) ON DELETE CASCADE,
  teknisi_id UUID REFERENCES profil(id) ON DELETE CASCADE,
  PRIMARY KEY (penugasan_id, teknisi_id)
);
```

---

## 4. Keamanan dengan RLS (Row Level Security)
Jangan lupa mengaktifkan RLS agar data tidak bisa diakses sembarangan.

```sql
ALTER TABLE penugasan ENABLE ROW LEVEL SECURITY;

-- Contoh Policy: Hanya SPV yang buat tugas yang bisa edit
CREATE POLICY "SPV can update own assignments" 
ON penugasan FOR UPDATE 
USING (auth.uid() = supervisor_id);
```

---

## 💡 Tips Coding
- Gunakan **CamelCase** untuk nama file di aplikasi, tapi gunakan **snake_case** untuk nama kolom di database.
- Selalu tambahkan kolom `created_at` dan `updated_at` untuk audit trail.

---

**Langkah Selanjutnya:**
[02 — Integrasi Supabase Client](./02_INTEGRASI_SUPABASE_CLIENT.md)
