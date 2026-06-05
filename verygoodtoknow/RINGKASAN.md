# Ringkasan: SPK Penggajian Berbasis BWM — CV Coral Palembang

> **Judul TA:** Pengembangan Sistem Pendukung Keputusan Penggajian Tenaga Kerja Berbasis Kompetensi dan Kinerja Menggunakan Metode Best Worst Method (BWM) pada CV Coral Palembang
> **Penyusun:** Naldi Septian (062240833053) — Politeknik Negeri Sriwijaya, 2026

---

## 1. Latar Belakang Masalah

CV Coral Palembang bergerak di bidang **konstruksi, pemeliharaan gedung, dan instalasi tower**. Penentuan insentif karyawannya masih bersifat **subjektif dan tidak konsisten** karena:

- Tidak ada sistem pembobotan kriteria yang baku dan terintegrasi
- Penilaian kinerja dan kompetensi dilakukan **secara manual** oleh manajer
- Proses administrasi panjang dan rentan **human error**

**Solusi:** Sistem Pendukung Keputusan (SPK) berbasis web menggunakan metode **Best Worst Method (BWM)** untuk menghasilkan pembobotan kriteria yang **objektif, konsisten, dan transparan**.

---

## 2. Konsep Penggajian yang Digunakan

Sistem ini mengintegrasikan dua pendekatan modern:

| Pendekatan | Penjelasan |
|---|---|
| **Competency-Based Pay** | Gaji/tunjangan berdasarkan level kompetensi/keahlian tersertifikasi |
| **Performance-Based Pay** | Tunjangan berdasarkan kinerja nyata di lapangan per periode |

**Output sistem:** Rekomendasi **tunjangan kinerja** (bukan gaji pokok), yang dihitung proporsional berdasarkan skor akhir teknisi.

---

## 3. Kriteria Penilaian Kinerja Teknisi

Ada **5 kriteria** (seluruhnya berjenis **Benefit** — semakin tinggi nilai, semakin baik):

| Kode | Nama Kriteria | Sumber Data |
|---|---|---|
| **c₁** | Kecepatan Penyelesaian SPK | Modul Penugasan — `tanggal_selesai_actual` vs `end_date` (global) |
| **c₂** | Kualitas Laporan | Modul Laporan — rasio laporan disetujui SPV tanpa revisi |
| **c₃** | Kepatuhan Pelaporan Berkala | Modul Laporan — rasio laporan dikirim sebelum tenggat |
| **c₄** | Proaktivitas Pelaporan Kendala | Modul Kendala — jumlah kendala disetujui (global per tim) |
| **c₅** | Kompetensi Teknisi | Profil Teknisi — nilai numerik dari level lisensi |

### Konversi Nilai Kompetensi (c₅)

| Tingkat Lisensi | Nilai Kompetensi (x_i5) |
|---|---|
| Level 1 | Rp 500.000 |
| Level 2 | Rp 1.000.000 |
| Level 3 | Rp 1.500.000 |

---

## 4. Metode BWM (Best Worst Method)

### Prinsip Kerja
BWM hanya membutuhkan **dua vektor perbandingan** (bukan matriks penuh seperti AHP), sehingga:
- Lebih **efisien** (jumlah perbandingan lebih sedikit)
- Tetap menghasilkan bobot yang **konsisten dan akurat**

### Langkah-Langkah BWM

#### Langkah 1 — Tentukan Himpunan Kriteria

$$C = \{c_1, c_2, c_3, \ldots, c_n\}$$

Pada penelitian ini: $C = \{c_1, c_2, c_3, c_4, c_5\}$, dengan $n = 5$.

---

#### Langkah 2 — Tentukan Kriteria Best dan Worst

- **Best (c_B):** kriteria paling berpengaruh → **c₁** (Kecepatan Penyelesaian SPK)
- **Worst (c_W):** kriteria paling kecil pengaruhnya → **c₅** (Kompetensi Teknisi, karena nilainya statis)

---

#### Langkah 3 — Susun Vektor Best-to-Others (BO)

Gunakan skala 1–9:

| Nilai | Makna |
|---|---|
| 1 | Sama penting |
| 2 | Sedikit lebih penting |
| 3 | Lebih penting |
| 4 | Cukup lebih penting |
| 5 | Jauh lebih penting |
| 6 | Jauh lebih penting (kuat) |
| 7 | Sangat lebih penting |
| 8 | Sangat lebih penting (kuat) |
| 9 | Mutlak lebih penting |

$$A_B = (a_{B1}, a_{B2}, \ldots, a_{Bn})$$

> $a_{Bj}$ = tingkat kepentingan $c_B$ relatif terhadap $c_j$; nilai $a_{BB} = 1$

**Vektor BO pada penelitian ini (Best = c₁):**

| c₁ | c₂ | c₃ | c₄ | c₅ |
|---|---|---|---|---|
| 1 | 2 | 3 | 5 | 7 |

*Interpretasi: c₁ dinilai 2× lebih penting dari c₂, 3× dari c₃, 5× dari c₄, dan 7× dari c₅.*

---

#### Langkah 4 — Susun Vektor Others-to-Worst (OW)

$$A_W = (a_{1W}, a_{2W}, \ldots, a_{nW})^T$$

> $a_{jW}$ = tingkat kepentingan $c_j$ relatif terhadap $c_W$; nilai $a_{WW} = 1$

**Vektor OW pada penelitian ini (Worst = c₅):**

| Kriteria | Nilai terhadap c₅ |
|---|---|
| c₁ | 7 |
| c₂ | 5 |
| c₃ | 4 |
| c₄ | 2 |
| c₅ | 1 |

---

#### Langkah 5 — Model Optimasi Linear Programming (LP)

Tujuan: cari bobot optimal $w_j^*$ yang **meminimalkan ketidakkonsistenan** $\xi^L$:

$$\min \xi^L \tag{5}$$

Subject to:

$$w_B - a_{Bj} \cdot w_j \leq \xi^L \quad \forall j \tag{6}$$

$$a_{Bj} \cdot w_j - w_B \leq \xi^L \quad \forall j \tag{7}$$

$$w_j - a_{jW} \cdot w_W \leq \xi^L \quad \forall j \tag{8}$$

$$a_{jW} \cdot w_W - w_j \leq \xi^L \quad \forall j \tag{9}$$

$$\sum_{j=1}^{n} w_j = 1, \quad w_j \geq 0 \quad \forall j \tag{10}$$

**Keterangan variabel:**

| Simbol | Keterangan |
|---|---|
| $w_j$ | Bobot kriteria ke-$j$ |
| $w_B$ | Bobot kriteria Best |
| $w_W$ | Bobot kriteria Worst |
| $a_{Bj}$ | Nilai preferensi Best terhadap kriteria $j$ |
| $a_{jW}$ | Nilai preferensi kriteria $j$ terhadap Worst |
| $\xi^L$ | Nilai inkonsistensi maksimal yang diminimalkan |

**Persamaan (6)–(7):** memastikan rasio bobot Best-to-Others mendekati preferensi pakar $a_{Bj}$  
**Persamaan (8)–(9):** memastikan hal yang sama untuk Others-to-Worst

---

#### Langkah 6 — Uji Konsistensi (Consistency Ratio)

$$CR = \frac{\xi^*}{CI} \tag{11}$$

| Simbol | Keterangan |
|---|---|
| $CR$ | Consistency Ratio — rasio konsistensi |
| $\xi^*$ | Nilai inkonsistensi hasil optimasi |
| $CI$ | Consistency Index — nilai referensi berdasarkan $a_{BW}$ |

**Tabel Consistency Index (CI):**

| $a_{BW}$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| CI | 0,00 | 0,44 | 1,00 | 1,63 | 2,30 | 3,00 | 3,73 | 4,47 | 5,23 |

**Kriteria penerimaan:**
- $CR \leq 0{,}10$ → ✅ Bobot **konsisten**, lanjutkan ke normalisasi
- $CR > 0{,}10$ → ❌ Penilaian preferensi **harus diulang**

**Hasil pada penelitian ini:** $a_{BW} = 7$, $CI = 3{,}73$, $\xi^* = 0{,}025$, $CR = 0{,}007 \leq 0{,}1$ ✅

**Bobot hasil LP:**

| c₁ | c₂ | c₃ | c₄ | c₅ | Total |
|---|---|---|---|---|---|
| 0,459 | 0,230 | 0,153 | 0,092 | 0,066 | 1,000 |

---

#### Langkah 7 — Normalisasi Matriks Kinerja (Min-Max)

Seluruh nilai mentah dinormalisasi ke **skala 0–100** agar dapat dibandingkan:

$$v_{ij} = \frac{x_{ij} - x_j^{\min}}{x_j^{\max} - x_j^{\min}} \times 100 \tag{12}$$

| Simbol | Keterangan |
|---|---|
| $v_{ij}$ | Nilai ternormalisasi teknisi ke-$i$ pada kriteria ke-$j$ (skala 0–100) |
| $x_{ij}$ | Nilai mentah teknisi ke-$i$ pada kriteria ke-$j$ |
| $x_j^{\min}$ | Nilai terendah kriteria $j$ di antara seluruh teknisi |
| $x_j^{\max}$ | Nilai tertinggi kriteria $j$ di antara seluruh teknisi |

> **Catatan:** Jika $x_j^{\max} = x_j^{\min}$ (semua teknisi memiliki nilai sama), maka $v_{ij} = 100$ untuk menghindari pembagian nol.

---

#### Langkah 8 — Hitung Skor Akhir Kinerja (WSM)

Skor akhir dihitung menggunakan **Weighted Sum Model**:

$$S_i = \sum_{j=1}^{n} w_j \times v_{ij} \tag{13}$$

| Simbol | Keterangan |
|---|---|
| $S_i$ | Skor akhir kinerja teknisi ke-$i$ (rentang 0–100) |
| $w_j$ | Bobot kriteria ke-$j$ dari hasil BWM |
| $v_{ij}$ | Nilai ternormalisasi teknisi ke-$i$ pada kriteria ke-$j$ |

---

#### Langkah 9 — Rekomendasi Tunjangan Kinerja

$$\text{TunjanganKinerja}_i = \text{TunjanganMaks} \times \frac{S_i}{S_{\max}} \tag{14}$$

| Simbol | Keterangan |
|---|---|
| $\text{TunjanganMaks}$ | Plafon tunjangan kinerja per periode (ditetapkan manajemen) |
| $S_i$ | Skor kinerja teknisi ke-$i$ |
| $S_{\max}$ | Skor tertinggi di antara seluruh teknisi pada periode yang sama |

> Hasil ini bersifat **rekomendasi sistem**. Manager tetap memiliki otoritas untuk meninjau dan menyesuaikan sebelum slip gaji diterbitkan.

---

## 5. Contoh Perhitungan Manual

### Data Mentah

| Teknisi | Lisensi | c₁ SPK (%) | c₂ Laporan (%) | c₃ On-Time (%) | c₄ Kendala (jml) | c₅ Kompetensi (Rp) |
|---|---|---|---|---|---|---|
| A | Level 3 | 85 | 92 | 90 | 5 | 1.500.000 |
| B | Level 2 | 72 | 78 | 80 | 2 | 1.000.000 |
| C | Level 1 | 65 | 85 | 70 | 3 | 500.000 |
| **Min** | — | 65 | 78 | 70 | 2 | 500.000 |
| **Max** | — | 85 | 92 | 90 | 5 | 1.500.000 |

### Matriks Ternormalisasi

| Teknisi | v₁ | v₂ | v₃ | v₄ | v₅ |
|---|---|---|---|---|---|
| A | 100 | 100 | 100 | 100 | 100 |
| B | 35 | 0 | 50 | 0 | 50 |
| C | 0 | 50 | 0 | 33 | 0 |

*Contoh: Teknisi B pada c₁ → $(72 - 65) / (85 - 65) \times 100 = 35$*

### Skor Akhir

$$S_A = (0{,}459 \times 100) + (0{,}230 \times 100) + (0{,}153 \times 100) + (0{,}092 \times 100) + (0{,}066 \times 100) = \mathbf{100{,}00}$$

$$S_B = (0{,}459 \times 35) + (0{,}230 \times 0) + (0{,}153 \times 50) + (0{,}092 \times 0) + (0{,}066 \times 50) = \mathbf{27{,}02}$$

$$S_C = (0{,}459 \times 0) + (0{,}230 \times 50) + (0{,}153 \times 0) + (0{,}092 \times 33) + (0{,}066 \times 0) = \mathbf{14{,}54}$$

### Rekomendasi Tunjangan (TunjanganMaks = Rp 1.500.000)

| Peringkat | Teknisi | Lisensi | Skor Sᵢ | Tunjangan Direkomendasikan |
|---|---|---|---|---|
| 1 | A | Level 3 | 100,00 | **Rp 1.500.000** |
| 2 | B | Level 2 | 27,02 | **Rp 405.300** |
| 3 | C | Level 1 | 14,54 | **Rp 218.100** |

---

## 6. Alur Sistem yang Diusulkan

```
Manager Login
    ↓
Manager Isi Preferensi Best & Worst Kriteria
    ↓
Sistem Kalkulasi Bobot Kriteria (BWM LP)
    ↓
Sistem Generate Data Penilaian dari Laporan
    ↓
Normalisasi Otomatis Data Kinerja (Min-Max)
    ↓
Kalkulasi Skor Akhir Kinerja (WSM)
    ↓
Sistem Generate Rekomendasi Tunjangan ke Slip Gaji
    ↓
Manager Approval (Digital)
    ↓
Selesai
```

---

## 7. Stack Teknologi

| Kategori | Detail |
|---|---|
| **Frontend** | Next.js, TypeScript, HTML, TailwindCSS |
| **Backend/DB** | Supabase, PostgreSQL |
| **Tools** | Visual Studio Code, Microsoft Word |
| **Hardware** | Laptop Asus TUF Gaming (Ryzen 7, RAM 16GB, SSD 512GB) |
| **Metode Pengembangan** | Waterfall (Requirements → Design → Implementation → Testing → Maintenance) |
| **Pengujian Sistem** | Black Box Testing |

---

*Ringkasan dibuat dari dokumen TA Sempro BAB I–III, Naldi Septian, Polsri 2026.*