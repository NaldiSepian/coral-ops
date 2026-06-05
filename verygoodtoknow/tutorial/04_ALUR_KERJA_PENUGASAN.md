# 04 — Alur Kerja Penugasan
> Bagaimana Supervisor membuat perintah kerja dan mengalokasikan sumber daya.

Proses operasional dimulai saat Supervisor membuat **Penugasan (SPK)**. Di Coral-Ops, ini dilakukan melalui antarmuka *Wizard* yang terbagi menjadi 3 langkah utama.

---

## 🧙‍♂️ Wizard Create Penugasan

Komponen ini berada di `components/penugasan/create-penugasan/`.

### Langkah 1: Data Dasar SPK
Supervisor mengisi detail administratif proyek:
- **Judul**: Nama pekerjaan.
- **Kategori**: Rekonstruksi, Instalasi, atau Perawatan.
- **Lokasi**: Memilih titik di peta (Leaflet).
- **Deadline**: Kapan pekerjaan harus selesai.

### Langkah 2: Alokasi Teknisi
Supervisor memilih satu atau lebih teknisi dari daftar pengguna yang tersedia. Sistem memungkinkan kerja tim (banyak teknisi dalam satu tugas).

### Langkah 3: Alokasi Alat (Inventaris)
Langkah krusial di mana Supervisor meminjamkan alat dari gudang ke tim tersebut.
- Sistem memfilter hanya alat yang memiliki `stok_tersedia > 0`.
- Supervisor wajib mengunggah **foto pengambilan alat** sebagai bukti kondisi awal alat saat keluar dari gudang.

---

## 🔧 Manajemen Inventaris

Salah satu fitur inti Coral-Ops adalah pelacakan alat yang akurat.

- **Stok Total**: Jumlah keseluruhan alat yang dimiliki perusahaan.
- **Stok Tersedia**: Jumlah alat yang saat ini berada di gudang (tidak sedang dipinjam).
- **Sedang Dipakai**: Alat yang sedang dibawa teknisi ke lapangan.

Status stok berubah secara otomatis saat penugasan dibuat atau saat alat dikembalikan oleh teknisi di akhir proyek.

---

## 📅 Penjadwalan dan Frekuensi Laporan

Berdasarkan kategori penugasan, sistem menentukan frekuensi teknisi harus mengirim laporan:
- **Harian**: Untuk proyek jangka pendek atau rekonstruksi berat.
- **Mingguan**: Untuk pemeliharaan rutin.

Informasi ini muncul di dashboard teknisi sebagai pengingat untuk tetap memberikan kabar progres secara berkala.

---

## 📍 Penandaan Lokasi (Map Picking)

Kita menggunakan `components/shared/report-location-map.tsx`.
Supervisor bisa melakukan pencarian alamat atau langsung mengklik titik koordinat di peta. Data ini disimpan sebagai koordinat GPS yang nantinya akan dibandingkan dengan lokasi teknisi saat melapor.

---

**Lanjut ke Bab berikutnya:**
[05 — Pelaporan dan Validasi](./05_PELAPORAN_DAN_VALIDASI.md)
