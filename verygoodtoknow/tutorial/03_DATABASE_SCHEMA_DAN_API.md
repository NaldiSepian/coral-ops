# 03 — Database Schema dan API
> Memahami struktur data dan bagaimana cara aplikasi berkomunikasi dengan server.

Coral-Ops menggunakan **PostgreSQL** yang dikelola oleh Supabase. Salah satu fitur unggulannya adalah dukungan terhadap data spasial (geolocation).

---

## 📊 Tabel Utama

Database Coral-Ops terdiri dari beberapa tabel kunci:

1. **`penugasan`**: Tabel utama untuk Surat Perintah Kerja (SPK). Menyimpan judul, lokasi, kategori, dan deadline.
2. **`profil`**: Menyimpan informasi user (nama, peran) yang terhubung ke Auth Supabase.
3. **`laporan_progres`**: Catatan berkala dari teknisi, termasuk persentase penyelesaian dan status validasi.
4. **`alat` & `peminjaman_alat`**: Manajemen inventaris untuk melacak siapa yang memakai alat apa di proyek mana.
5. **`bukti_laporan`**: Menyimpan metadata foto before-after yang dipasangkan.

---

## 🌍 Geolocation (PostGIS)

Kita menggunakan tipe data `GEOGRAPHY(POINT)` untuk menyimpan koordinat GPS. Ini memungkinkan kita melakukan perhitungan jarak atau menampilkan titik lokasi secara akurat di peta.

- **`lokasi` (tabel penugasan)**: Titik target proyek.
- **`titik_gps` (tabel laporan_progres)**: Lokasi teknisi saat mengirim laporan (untuk memastikan teknisi benar-benar di lokasi).

---

## 🛣️ API Routes di Next.js

Seluruh komunikasi antara Frontend dan Database dilakukan melalui **Next.js API Routes** yang berada di folder `app/api/`.

Struktur foldernya mencerminkan endpoint URL:
- `GET /api/penugasan`: Mengambil daftar tugas.
- `POST /api/penugasan/[id]/laporan`: Mengirim laporan untuk tugas tertentu.
- `POST /api/laporan/[id]/validasi`: Digunakan supervisor untuk menyetujui laporan.

### Mengapa menggunakan API Routes, bukan Supabase Client langsung?
1. **Keamanan**: Kita bisa menyisipkan logika validasi tambahan di sisi server.
2. **Abstraksi**: Frontend tidak perlu tahu detail query database yang kompleks.
3. **Audit Log**: Memudahkan pencatatan aktivitas (siapa mengubah apa) setiap kali API dipanggil.

---

## ⚙️ Penanganan Transaksi

Beberapa operasi seperti peminjaman alat membutuhkan ketelitian tinggi. Saat teknisi meminjam alat, sistem akan:
1. Memeriksa stok tersedia di tabel `alat`.
2. Jika cukup, membuat record di `peminjaman_alat`.
3. Mengurangi `stok_tersedia` di tabel `alat`.

Semua ini dilakukan dalam satu transaksi database untuk mencegah data tidak konsisten (seperti stok minus).

---

**Lanjut ke Bab berikutnya:**
[04 — Alur Kerja Penugasan](./04_ALUR_KERJA_PENUGASAN.md)
