# 06 — Maps dan Storage
> Mengelola data visual dan lokasi untuk meningkatkan akurasi data lapangan.

Coral-Ops menangani banyak aset digital berupa gambar dan data koordinat yang harus ditampilkan secara intuitif.

---

## 🗺️ Integrasi React Leaflet

Untuk menampilkan peta, kita menggunakan library **Leaflet** melalui wrapper **React Leaflet**. 

### Fitur Peta:
1. **Map Picker**: Digunakan Supervisor saat membuat penugasan untuk menentukan titik koordinat proyek.
2. **Current Location Tracking**: Menggunakan API Geolocation browser untuk mengambil titik persis di mana teknisi berada saat mengirim laporan.
3. **Report Map**: Menampilkan marker di dashboard Supervisor untuk memvisualisasikan sebaran proyek yang sedang berjalan.

> **Penting**: Karena Leaflet memanipulasi DOM secara langsung, komponen peta harus dijalankan sebagai **Client Component** (`"use client"`) dan biasanya di-load secara dinamis untuk menghindari error SSR (Server Side Rendering).

---

## 📸 Supabase Storage (Bucket)

Semua file gambar (foto progres, foto alat, foto before-after) disimpan di **Supabase Storage**.

### Struktur Bucket:
- **`alat-foto`**: Foto fisik alat saat pendaftaran inventaris.
- **`laporan-foto`**: Foto bukti progres harian/mingguan.
- **`bukti-selesai`**: Foto before-after penyelesaian proyek.

### Proses Upload:
1. File dipilih oleh user di frontend.
2. Frontend memanggil API Route `/api/upload/...`.
3. Server memvalidasi ukuran dan tipe file.
4. Server mengunggah ke Supabase Storage dan mendapatkan URL publik.
5. URL tersebut disimpan ke database PostgreSQL.

---

## 📄 PDF Generation (`jspdf`)

Coral-Ops memiliki fitur untuk mendownload laporan dalam format PDF. Fitur ini diimplementasikan menggunakan library **jsPDF**.

- **Halaman 1**: Berisi ringkasan administratif (Judul Proyek, Nama Teknisi, Tanggal, Lokasi).
- **Halaman Selanjutnya**: Fokus pada visual, menampilkan foto-foto progres dan pasangan foto Before-After secara rapi.
- Fitur ini berjalan di sisi client agar tidak membebani server saat banyak user melakukan export secara bersamaan.

---

## 🎨 Penanganan Tema (Dark/Light Mode)

Aplikasi mendukung perpindahan tema. Peta Leaflet juga disesuaikan tile-nya agar tetap nyaman dilihat saat mode gelap menggunakan filter CSS pada layer peta.

---

**Selesai!**
Kembali ke [Daftar Bab](./TUTORIAL_BOOK.md) atau lihat [Glosarium](./GLOSARIUM.md)
