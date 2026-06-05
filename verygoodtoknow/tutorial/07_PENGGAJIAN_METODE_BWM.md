# 07 — Sistem Penggajian (Metode BWM)
> Implementasi algoritma Best-Worst Method (BWM) untuk perhitungan tunjangan kinerja teknisi.

Salah satu fitur paling kompleks di Coral-Ops adalah sistem penggajian yang objektif. Manager menggunakan metode **Best-Worst Method (BWM)** untuk menentukan bobot kriteria penilaian secara matematis dan konsisten.

---

## 🧠 Apa itu BWM?

BWM adalah metode pengambilan keputusan multikriteria (*Multi-Criteria Decision Making*) yang mengharuskan pengambil keputusan (Manager) menentukan kriteria **Terbaik** (Best) dan **Terburuk** (Worst) dari daftar kriteria yang ada.

### Kriteria Penilaian (C1 - C5):
1. **C1 (Kecepatan Penyelesaian)**: Seberapa cepat tugas selesai dibanding deadline.
2. **C2 (Kualitas Laporan)**: Persentase laporan yang langsung disetujui tanpa revisi.
3. **C3 (Kepatuhan Laporan)**: Kedisiplinan mengirim laporan sesuai frekuensi (harian/mingguan).
4. **C4 (Proaktivitas)**: Keaktifan teknisi dalam melaporkan kendala di lapangan.
5. **C5 (Kompetensi)**: Tingkat keahlian teknisi (berdasarkan level lisensi/jabatan).

---

## ⚙️ Alur Perhitungan Matematis

Logika ini dapat ditemukan di folder `lib/bwm/`.

### 1. Penentuan Preferensi (BO & OW Vectors)
Manager memberikan nilai 1-9 untuk membandingkan kriteria Terbaik dengan kriteria lainnya (**Best-to-Others / BO**) dan kriteria lainnya dengan kriteria Terburuk (**Others-to-Worst / OW**).

### 2. LP Solver (Linear Programming)
Sistem menggunakan **LP Solver** (`lib/bwm/lp-solver.ts`) untuk mencari bobot optimal ($w_j$) untuk setiap kriteria sehingga selisih absolut antara perbandingan Manager dan perbandingan bobot minimum.

### 3. Cek Konsistensi (Consistency Ratio)
Setelah bobot didapat, sistem menghitung **Consistency Ratio (CR)**.
- Jika **CR < 0.1**, maka perbandingan Manager dianggap konsisten dan valid.
- Jika tidak, Manager harus mengulang input preferensi.

### 4. Normalisasi Nilai (Min-Max)
Nilai mentah dari setiap teknisi dalam satu proyek dikumpulkan dan dinormalisasi menggunakan metode **Min-Max Normalization** agar semua kriteria memiliki skala yang sama (0 - 100).

---

## 💰 Perhitungan Tunjangan

Hasil akhir dari BWM adalah **Skor Akhir (0-100)** untuk setiap teknisi.

**Rumus Tunjangan:**
$$Tunjangan_i = \left( \frac{Skor_i}{Skor_{max}} \right) \times Plafon Bonus$$

Artinya, teknisi dengan skor tertinggi dalam satu batch akan mendapatkan 100% dari plafon bonus, sementara teknisi lain mendapatkan secara proporsional.

---

## 🖥️ Antarmuka Manager

Halaman penggajian berada di `/views/manager/bwm/gaji`. Di sini Manager bisa:
- Memilih proyek yang sudah selesai.
- Mengatur preferensi BWM atau menggunakan template yang sudah ada.
- Melihat kalkulasi otomatis performa teknisi.
- Melakukan finalisasi gaji untuk diproses oleh bagian keuangan.

---

**Selesai!**
Ini adalah bab terakhir dari Tutorial Book Coral-Ops. 
Kembali ke [Daftar Bab](./TUTORIAL_BOOK.md) atau lihat istilah di [Glosarium](./GLOSARIUM.md).
