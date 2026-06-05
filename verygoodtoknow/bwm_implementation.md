# Implementasi BWM (Best-Worst Method) di Coral-Ops

> Dokumentasi lengkap sistem penggajian berbasis kinerja dengan metode **Best-Worst Method (BWM)** — membaca "B-W-M" (huruf masing-masing: **B**est-**W**orst **M**ethod).

---

## 📋 Daftar Isi

1. [Apa Itu BWM?](#-apa-itu-bwm)
2. [Kriteria Penilaian (C1–C5)](#-kriteria-penilaian-c1c5)
3. [Preferensi Manager (BO & OW Vectors)](#-preferensi-manager-bo--ow-vectors)
4. [LP Solver — Mencari Bobot Optimal](#-lp-solver--mencari-bobot-optimal)
5. [Consistency Ratio — Uji Konsistensi](#-consistency-ratio--uji-konsistensi)
6. [Normalisasi Min-Max Dinamis](#-normalisasi-min-max-dinamis)
7. [Weighted Sum Model — Skor Akhir](#-weighted-sum-model--skor-akhir)
8. [Perhitungan Tunjangan Kinerja](#-perhitungan-tunjangan-kinerja)
9. [Alur Lengkap Batch Calculation](#-alur-lengkap-batch-calculation)
10. [Simulasi Perhitungan Manual](#-simulasi-perhitungan-manual)
11. [Struktur Folder & Kode](#-struktur-folder--kode)
12. [Glosarium Istilah](#-glosarium-istilah)

---

## 🧠 Apa Itu BWM?

**BWM** (dibaca: **B-W-M**, bukan "bem") adalah singkatan dari **Best-Worst Method**, yaitu metode pengambilan keputusan multikriteria (*Multi-Criteria Decision Making* / MCDM) yang diperkenalkan oleh **Rezaei (2015)**.

### Cara Kerja Singkat

1. Manager memilih satu kriteria **Terbaik (Best)** dan satu **Terburuk (Worst)** dari 5 kriteria yang tersedia
2. Manager memberi nilai 1–9 untuk membandingkan Best dengan semua kriteria lain (**BO Vector**)
3. Manager memberi nilai 1–9 untuk membandingkan semua kriteria dengan Worst (**OW Vector**)
4. Sistem menghitung bobot optimal tiap kriteria dengan **LP Solver** (Linear Programming)
5. Sistem mengecek **Consistency Ratio (CR)** — harus ≤ 0.10 supaya dianggap konsisten
6. Nilai mentah tiap teknisi dinormalisasi dengan **Min-Max** dalam satu batch
7. Skor akhir dihitung dengan **Weighted Sum Model (WSM)**
8. Tunjangan kinerja dihitung proporsional terhadap skor tertinggi di batch

### Kenapa BWM Dipilih?

| Aspek | BWM | AHP (Alternatif) |
|-------|-----|------------------|
| Jumlah perbandingan | `2n - 3` (7 untuk 5 kriteria) | `n(n-1)/2` (10 untuk 5 kriteria) |
| Konsistensi | Lebih tinggi (CR biasanya < 0.1) | Lebih rendah |
| Implementasi | LP Sederhana | Eigenvector kompleks |

---

## 📊 Kriteria Penilaian (C1–C5)

Semua kriteria bertipe **Benefit** — makin besar nilainya, makin baik kinerjanya. Dibaca "C-satu, C-dua, ..." atau "C1, C2, C3, C4, C5".

### Tabel Kriteria

| Kode | Nama | Cara Baca | Rentang | Sumber Data |
|------|------|-----------|---------|-------------|
| **C1** | Kecepatan Penyelesaian | "Kecepatan" | 0–100% | `tanggal_selesai_actual` penugasan vs `end_date` (global) |
| **C2** | Kualitas Laporan | "Kualitas" | 0–100% | Status validasi laporan (Disetujui / Ditolak) |
| **C3** | Kepatuhan Laporan | "Kepatuhan" | 0–100% | Jumlah hari lapor unik vs jumlah hari yang diharapkan |
| **C4** | Proaktivitas | "Proaktivitas" | 0–20 (count) | Jumlah kendala disetujui di penugasan (per tim) |
| **C5** | Kompetensi Teknisi | "Kompetensi" | Rp 0–1.500.000 | Level lisensi teknisi (Level 1/2/3) |

### Rumus Detail Per Kriteria

#### C1 — Kecepatan Penyelesaian (`c1_kecepatan`)

```
sisaHari   = end_date - tanggal_selesai_actual (hari)
totalDurasi = end_date - start_date (hari)
c1 = max(0, (sisaHari / totalDurasi) × 100)
```

- Mengukur **seberapa cepat penugasan diselesaikan secara keseluruhan** oleh Supervisor via tombol "Tandai selesai"
- `tanggal_selesai_actual` = tanggal Supervisor klik "Tandai selesai" (diisi otomatis oleh sistem)
- Semakin besar sisa hari sebelum deadline, semakin tinggi skor
- Selesai pas deadline → `c1 = 0` (pas-pasan)
- Selesai H-5 dari total 30 hari → `c1 = (5/30) × 100 = 16.67`
- **Bersifat global**: semua teknisi dalam satu penugasan mendapat nilai C1 yang sama
- Kalau penugasan belum selesai (tidak bisa trigger BWM): `c1 = 0`
- **Tidak tumpang tindih dengan C3** — C1 ukur kecepatan penyelesaian keseluruhan, C3 ukur kepatuhan laporan harian

#### C2 — Kualitas Laporan (`c2_kualitas`)

```
c2 = (jumlah laporan Disetujui / total laporan) × 100
```

- Hanya laporan dengan `status_validasi = 'Disetujui'` yang dihitung
- Laporan ditolak atau menunggu tidak dihitung sebagai berkualitas
- Kalau teknisi belum pernah lapor: `c2 = 0`

#### C3 — Kepatuhan Laporan (`c3_kepatuhan`)

```
totalExpected = jumlah hari antara start_date dan end_date (+1)
  - Kalau frekuensi "Harian": totalExpected = diffDays
  - Kalau frekuensi "Mingguan": totalExpected = ceil(diffDays / 7)

uniqueDates = jumlah tanggal_laporan unik dari semua laporan teknisi

c3 = min(100, (uniqueDates / totalExpected) × 100)
```

- Dipilih nilai minimum antara 100 dan hasil perhitungan (tidak bisa > 100)
- Bedanya dengan C1: C1 hitung **created_at** (waktu submit), C3 hitung **tanggal_laporan** (tanggal yang dilaporkan)
- Kalau teknisi belum pernah lapor: `c3 = 0`

#### C4 — Proaktivitas (`c4_proaktivitas`)

```
c4 = jumlah baris di tabel perpanjangan_penugasan
     WHERE penugasan_id = ... AND pemohon_id = teknisi AND status = 'Disetujui'
```

- Hanya kendala yang **disetujui** yang dihitung
- **Bersifat global (per tim)**: semua teknisi dalam satu penugasan mendapat nilai C4 yang sama
- Alasannya: proaktivitas pelaporan kendala berdampak ke seluruh tim (memundurkan deadline)
- Nilai minimal 0, tidak ada batas atas teoretis (tapi dinormalisasi dalam batch)

#### C5 — Kompetensi Teknisi (`c5_kompetensi`)

```
c5 = nilai dari tabel tunjangan_lisensi berdasarkan level teknisi
```

| Level Lisensi | Tunjangan Jabatan (C5) |
|---------------|----------------------|
| Level 1 | Rp 500.000 |
| Level 2 | Rp 1.000.000 |
| Level 3 | Rp 1.500.000 |

---

## 🎯 Preferensi Manager (BO & OW Vectors)

Manager menentukan dua vektor perbandingan sebelum perhitungan dilakukan.

### Skala Perbandingan 1–9

| Nilai | Makna | Cara Baca |
|-------|-------|-----------|
| 1 | Sama penting | "satu" |
| 2 | Sedikit lebih penting | "dua" |
| 3 | Lebih penting | "tiga" |
| 4 | Cukup lebih penting | "empat" |
| 5 | Jauh lebih penting | "lima" |
| 6 | Jauh lebih penting (kuat) | "enam" |
| 7 | Sangat lebih penting | "tujuh" |
| 8 | Sangat lebih penting (kuat) | "delapan" |
| 9 | Mutlak lebih penting | "sembilan" |

### Cara Membaca Nilai 1 pada Best/Worst

**Pertanyaan yang sering muncul**: "Kenapa BO[Best] = 1? Bukannya itu berarti Best sama pentingnya dengan kriteria lain?"

**Jawabannya**: Nilai 1 di BO[Best] berarti **Best dibandingkan dengan dirinya sendiri** — bukan Best dibandingkan dengan kriteria lain.

Logikanya:
- `BO[Best]` = seberapa lebih penting **Best** dibanding **Best**? → **Sama penting** (ya jelas, kriterianya sama)
- `BO[other]` = seberapa lebih penting **Best** dibanding kriteria **lain**? → Ini yang diisi nilai 2–9

Jadi `BO[C1] = 1` dengan `BO[C5] = 7` artinya: C1 7× lebih penting dari C5. Nilai 1 di Best hanya penanda trivial bahwa Best = Best.

Hal yang sama berlaku untuk OW: `OW[Worst] = 1` karena Worst dibanding Wors = sama penting.

**Intinya**: Jangan lihat angka 1 di Best/Worst sebagai "tidak penting". Lihat angka-angka di **kriteria lain** — makin besar, makin penting kriteria tersebut dibanding Worst, atau makin Best penting dibanding kriteria tersebut.

### Best-to-Others Vector (BO Vector)

Dibaca "**B-O Vektor**". Menunjukkan seberapa penting **Best** dibanding setiap kriteria lain (`j`).

```
BO = [aB1, aB2, aB3, aB4, aB5]

Contoh (Best = C1):
     C1 vs C1  = 1 (sama penting — terhadap dirinya sendiri)
     C1 vs C2  = 2 (sedikit lebih penting)
     C1 vs C3  = 3 (lebih penting)
     C1 vs C4  = 5 (jauh lebih penting)
     C1 vs C5  = 7 (sangat lebih penting — terhadap Worst)
```

### Others-to-Worst Vector (OW Vector)

Dibaca "**O-W Vektor**". Menunjukkan seberapa penting setiap kriteria (`j`) dibanding **Worst**.

```
OW = [a1W, a2W, a3W, a4W, a5W]^T

Contoh (Worst = C5):
     C1 vs C5  = 7 (sangat lebih penting)
     C2 vs C5  = 5 (jauh lebih penting)
     C3 vs C5  = 4 (cukup lebih penting)
     C4 vs C5  = 2 (sedikit lebih penting)
     C5 vs C5  = 1 (sama penting — terhadap dirinya sendiri)
```

---

## 🔧 LP Solver — Mencari Bobot Optimal

Dibaca "**L-P Solver**". LP = **Linear Programming** (Pemrograman Linear).

### Model Matematika

Tujuan: mencari bobot `[w1, w2, w3, w4, w5]` yang **meminimalkan inkonsistensi (ξ atau "xi")**.

```
Minimize:      ξ
Subject to:
  |wB - aBj × wj| ≤ ξ      untuk semua j = 1..5    (Constraint BO)
  |wj - ajW × wW| ≤ ξ      untuk semua j = 1..5    (Constraint OW)
  Σ wj = 1                                          (Total bobot = 1)
  wj ≥ 0, ξ ≥ 0                                     (Non-negatif)
```

Dimana:
- `wB` = bobot kriteria **Best**
- `wW` = bobot kriteria **Worst**
- `aBj` = nilai BO untuk kriteria `j`
- `ajW` = nilai OW untuk kriteria `j`

### Cara Solver Bekerja

1. **Inisialisasi**: Semua bobot mulai dari `0.2` (equal/merata)
2. **Iterasi** (maks 1000x):
   - Hitung pelanggaran constraint
   - Sesuaikan bobot dengan **gradient descent** (arah turunan) atau **Newton-Raphson**
   - Normalisasi ulang supaya `Σwj = 1`
3. **Berhenti** kalau perubahan ξ < toleransi (`0.0001`) → **konvergen**
4. **Output**: `[w1, w2, w3, w4, w5]` dan `ξ*` (xi-star, nilai inkonsistensi minimal)

### Dua Metode Solver

| Metode | Kecepatan | Akurasi | Kapan Dipakai |
|--------|-----------|---------|---------------|
| **Gradient Descent** | Lambat (1000 iterasi) | Stabil | Fallback kalau Newton gagal |
| **Newton-Raphson** | Cepat (10–50 iterasi) | Akurat | **Default** — dipakai pertama |

Sistem pilih otomatis: Newton dulu, kalau tidak konvergen → fallback ke Gradient Descent.

### Contoh Hasil Bobot (dari simulasi proposal)

| Kriteria | Bobot | Cara Baca |
|----------|-------|-----------|
| w1 (Kecepatan) | 0.459 | "nol koma empat lima sembilan" |
| w2 (Kualitas) | 0.230 | "nol koma dua tiga nol" |
| w3 (Kepatuhan) | 0.153 | "nol koma satu lima tiga" |
| w4 (Proaktivitas) | 0.092 | "nol koma nol sembilan dua" |
| w5 (Kompetensi) | 0.066 | "nol koma nol enam enam" |
| **Total** | **1.000** | |

---

## ✅ Consistency Ratio — Uji Konsistensi

Dibaca "**C-R**" atau **Consistency Ratio**. Mengukur seberapa konsisten penilaian Manager.

### Rumus

```
CR = ξ* / CI
```

Dimana:
- `ξ*` (xi-star) = nilai inkonsistensi minimal dari LP Solver
- `CI` (Consistency Index) = nilai ξ* maksimal teoretis berdasarkan `aBW`

### Tabel CI

| aBW (Best vs Worst) | CI |
|---------------------|----|
| 1 | 0.00 |
| 2 | 0.44 |
| 3 | 1.00 |
| 4 | 1.63 |
| 5 | 2.30 |
| 6 | 3.00 |
| 7 | 3.73 |
| 8 | 4.47 |
| 9 | 5.23 |

### Kriteria Penerimaan

| Kondisi | Artinya | Tindakan |
|---------|---------|----------|
| **CR ≤ 0.10** | ✅ Konsisten | Bobot sah dipakai |
| **CR > 0.10** | ❌ Tidak konsisten | Manager harus input ulang preferensi |

### Contoh

Jika `aBW = 7` (Best vs Worst = 7) dan ξ* = 0.025:
```
CI = 3.73 (dari tabel)
CR = 0.025 / 3.73 = 0.007 ≤ 0.10 → ✅ KONSISTEN
```

---

## 📏 Normalisasi Min-Max Dinamis

Dibaca "**Min-Max Normalisasi**". Mengubah nilai mentah dari berbagai satuan menjadi skala **0–100** yang seragam.

### Rumus

```
vij = ((xij - min_j) / (max_j - min_j)) × 100
```

Dimana:
- `xij` = nilai mentah teknisi `i` untuk kriteria `j`
- `min_j` = nilai terkecil di **batch** (semua teknisi di penugasan ini)
- `max_j` = nilai terbesar di **batch**
- `vij` = nilai ternormalisasi (0–100)

### Aturan Penting

- **Kalau `min_j == max_j`** (semua teknisi nilainya sama): `vij = 100` (terbaik sempurna)
- Normalisasi bersifat **dinamis per batch**: min/max dihitung dari teknisi dalam satu penugasan
- Maknanya: peringkat teknisi **relatif terhadap rekan satu timnya**

### Contoh

| Teknisi | C1 (mentah) | C1 (normalisasi) | Perhitungan |
|---------|-------------|------------------|-------------|
| A | 85 | 100 | (85-65)/(85-65) × 100 = 100 |
| B | 72 | 35 | (72-65)/(85-65) × 100 = 35 |
| C | 65 | 0 | (65-65)/(85-65) × 100 = 0 |
| **Min** | **65** | | |
| **Max** | **85** | | |

---

## 🧮 Weighted Sum Model — Skor Akhir

Dibaca "**W-S-M**" atau **Weighted Sum Model**. Menghitung skor akhir teknisi.

### Rumus

```
Si = (w1 × v1) + (w2 × v2) + (w3 × v3) + (w4 × v4) + (w5 × v5)
```

Dimana:
- `Si` = skor akhir teknisi `i` (0–100)
- `wj` = bobot kriteria `j` (dari LP Solver)
- `vj` = nilai ternormalisasi kriteria `j`

### Contoh

Pakai bobot dari LP Solver:
```
S_A = (0.459 × 100) + (0.230 × 100) + (0.153 × 100) + (0.092 × 100) + (0.066 × 100)
    = 45.9 + 23.0 + 15.3 + 9.2 + 6.6
    = 100.00

S_B = (0.459 × 35) + (0.230 × 0) + (0.153 × 50) + (0.092 × 0) + (0.066 × 50)
    = 16.065 + 0 + 7.65 + 0 + 3.3
    = 27.02
```

---

## 💰 Perhitungan Tunjangan Kinerja

Dibaca "Tunjangan Kinerja" atau **Tunjangan BWM**.

### Rumus

```
Tunjangan_i = PlafonBonus × (Si / Smax)
```

Dimana:
- `PlafonBonus` = batas maksimal bonus yang ditetapkan Manager per penugasan (default Rp 2.000.000)
- `Si` = skor akhir teknisi `i`
- `Smax` = skor **tertinggi** di antara semua teknisi dalam batch

### Artinya

- **Teknisi dengan skor tertinggi** → dapat 100% plafon
- **Teknisi lain** → dapat secara **proporsional** berdasarkan skornya
- Sistem ini mendorong kompetisi sehat dalam satu tim

### Contoh

Dengan PlafonBonus = Rp 1.500.000 dan Smax = 100 (Teknisi A):

| Teknisi | Skor | Perhitungan | Tunjangan |
|---------|------|-------------|-----------|
| A | 100.00 | 1.500.000 × (100/100) | **Rp 1.500.000** |
| B | 27.02 | 1.500.000 × (27.02/100) | **Rp 405.300** |
| C | 14.54 | 1.500.000 × (14.54/100) | **Rp 218.100** |

---

## 🔄 Alur Lengkap Batch Calculation

Dibaca "Batch Kalkulasi" — perhitungan serentak untuk semua teknisi dalam satu penugasan.

### Diagram Alur

```
┌──────────────────────────────────────────────────┐
│                 START                             │
│  Manager klik "Hitung BWM" di penugasan selesai  │
└────────────────────┬─────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────┐
│  1. KUMPULKAN DATA                               │
│     ├─ Get preferensi aktif (BO/OW vectors)      │
│     ├─ Get semua teknisi di penugasan             │
│     └─ Get profil & lisensi tiap teknisi         │
└────────────────────┬─────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────┐
│  2. HITUNG METRIK (PER TEKNISI)                  │
│     ├─ C1: Kecepatan (% on-time)                 │
│     ├─ C2: Kualitas (% approved)                 │
│     ├─ C3: Kepatuhan (% unik vs expected)        │
│     ├─ C4: Proaktivitas (count approved kendala) │
│     └─ C5: Kompetensi (dari level lisensi)       │
└────────────────────┬─────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────┐
│  3. BATCH PROCESSING                             │
│     ├─ Hitung min/max per kriteria dari batch    │
│     ├─ Solve LP → bobot [w1..w5] + ξ*           │
│     └─ Hitung CR, validasi konsistensi           │
└────────────────────┬─────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────┐
│  4. PASS 1: NORMALISASI + WSM (PER TEKNISI)      │
│     ├─ Normalisasi Min-Max dinamis → v1..v5     │
│     └─ WSM: Si = Σ(wj × vij)                    │
└────────────────────┬─────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────┐
│  5. HITUNG S_max                                 │
│     └─ Cari skor tertinggi dari semua teknisi    │
└────────────────────┬─────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────┐
│  6. PASS 2: TUNJANGAN (PER TEKNISI)              │
│     └─ Tunjangan = Plafon × (Si / Smax)         │
└────────────────────┬─────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────┐
│  7. SIMPAN KE DATABASE                           │
│     ├─ Simpan ke tabel perhitungan_bwm           │
│     ├─ Status: draft                             │
│     └─ Update bwm_status penugasan → draft       │
└────────────────────┬─────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────┐
│  Manager review → Finalisasi → Masuk gaji_teknisi│
└──────────────────────────────────────────────────┘
```

### Penjelasan Pass 1 & Pass 2

Mengapa perlu 2 pass?

- **Pass 1**: Hitung skor semua teknisi dulu (pakai bobot yang sama dari LP)
- **Antara**: Cari `Smax` = skor tertinggi di batch
- **Pass 2**: Baru hitung tunjangan dengan rumus proporsional

Ini penting karena tunjangan seorang teknisi bergantung pada skor teknisi lain (relatif). Tidak bisa dihitung sebelum semua skor diketahui.

---

## 📐 Simulasi Perhitungan Manual

### Data Input (3 Teknisi)

| Teknisi | Lisensi | C1 (%) | C2 (%) | C3 (%) | C4 (count) | C5 (Rp) |
|---------|---------|--------|--------|--------|-----------|---------|
| A | Level 3 | 85 | 92 | 90 | 5 | 1.500.000 |
| B | Level 2 | 72 | 78 | 80 | 2 | 1.000.000 |
| C | Level 1 | 65 | 85 | 70 | 3 | 500.000 |

### Preferensi Manager

- **Best**: C1 (Kecepatan)
- **Worst**: C5 (Kompetensi)
- **BO**: [1, 2, 3, 5, 7]
- **OW**: [7, 5, 4, 2, 1]

### Hasil LP Solver

| Bobot | Nilai |
|-------|-------|
| w1 | 0.459 |
| w2 | 0.230 |
| w3 | 0.153 |
| w4 | 0.092 |
| w5 | 0.066 |
| **ξ*** | **0.025** |
| **CR** | **0.007 (✅ Konsisten)** |

### Normalisasi

| Teknisi | v1 | v2 | v3 | v4 | v5 |
|---------|----|----|----|----|----|
| A | 100 | 100 | 100 | 100 | 100 |
| B | 35 | 0 | 50 | 0 | 50 |
| C | 0 | 50 | 0 | 33 | 0 |

Contoh perhitungan (Teknisi B, C1):
```
v1_B = ((72 - 65) / (85 - 65)) × 100 = (7/20) × 100 = 35
```

### Skor Akhir

| Teknisi | Skor | Perhitungan |
|---------|------|-------------|
| A | **100.00** | (0.459×100)+(0.230×100)+(0.153×100)+(0.092×100)+(0.066×100) |
| B | **27.02** | (0.459×35)+(0.230×0)+(0.153×50)+(0.092×0)+(0.066×50) |
| C | **14.54** | (0.459×0)+(0.230×50)+(0.153×0)+(0.092×33)+(0.066×0) |

### Tunjangan (Plafon = Rp 1.500.000)

| Peringkat | Teknisi | Skor | Tunjangan |
|-----------|---------|------|-----------|
| 1 | A | 100.00 | **Rp 1.500.000** |
| 2 | B | 27.02 | **Rp 405.300** |
| 3 | C | 14.54 | **Rp 218.100** |

---

## 📁 Struktur Folder & Kode

### Folder `lib/bwm/`

```
lib/bwm/
├── types.ts           # Semua interface TypeScript
├── normalization.ts   # Min-Max normalisasi + batch ranges
├── lp-solver.ts       # LP Solver (Gradient Descent + Newton)
├── consistency.ts     # Consistency Ratio (CR) & validasi
├── calculator.ts      # Orchestrator: batchCalculateBWM()
└── index.ts           # Ekspor publik
```

### Folder `app/api/bwm/`

```
app/api/bwm/
├── preferensi/
│   └── route.ts       # CRUD preferensi Manager
├── perhitungan/
│   └── route.ts       # Trigger BWM calculation + hitung metrik
│   └── [id]/
│       ├── route.ts   # Detail perhitungan per teknisi
│       └── finalize/route.ts  # Finalisasi draft → gaji
└── gaji/
    └── route.ts       # List gaji + create dari perhitungan
```

### Tabel Database

| Tabel | Isi |
|-------|-----|
| `preferensi_bwm` | Preferensi Manager (BO/OW vectors) |
| `perhitungan_bwm` | Hasil perhitungan per teknisi (mentah, normalisasi, bobot, skor, tunjangan) |
| `gaji_teknisi` | Gaji final (tunjangan_jabatan + bonus_bwm) |
| `tunjangan_lisensi` | Mapping level → nilai tunjangan |

---

## 📖 Glosarium Istilah

### A–C

| Istilah | Cara Baca | Arti |
|---------|-----------|------|
| **aBW** | "A-B-W" | Nilai preferensi Best terhadap Worst (dari BO vector) |
| **aBj** | "A-B-J" | Nilai preferensi Best terhadap kriteria j |
| **ajW** | "A-J-W" | Nilai preferensi kriteria j terhadap Worst |
| **Batch** | "betch" | Sekelompok teknisi dalam satu penugasan yang dihitung bersama |
| **Benefit** | "benefit" | Tipe kriteria: makin besar nilai makin baik |
| **Best** | "best" | Kriteria **terbaik/terpenting** menurut Manager |
| **BO Vector** | "B-O Vektor" | **Best-to-Others** — vektor perbandingan Best vs semua kriteria |
| **Bobot (w)** | "bobot" | Tingkat kepentingan kriteria (0–1, total = 1) |
| **C1** | "C-satu" | Kecepatan Penyelesaian — selisih tanggal selesai vs deadline |
| **C2** | "C-dua" | Kualitas Laporan — % laporan disetujui |
| **C3** | "C-tiga" | Kepatuhan Laporan — % hari lapor vs expected |
| **C4** | "C-empat" | Proaktivitas — jumlah kendala disetujui |
| **C5** | "C-lima" | Kompetensi — nilai dari level lisensi |
| **CI** | "C-I" | **Consistency Index** — nilai ξ* maksimal teoretis (dari tabel) |
| **CR** | "C-R" | **Consistency Ratio** — rasio konsistensi (harus ≤ 0.10) |
| **Constraint** | "konstrain" | Batasan dalam model LP yang harus dipenuhi |

### D–M

| Istilah | Cara Baca | Arti |
|---------|-----------|------|
| **Finalisasi** | "finalisasi" | Proses Manager mengubah status draft → final (gaji terhitung) |
| **Gradient Descent** | "gradien descent" | Metode optimasi iteratif mencari bobot optimal |
| **Inkonsistensi** | "in-kon-sis-ten-si" | Tingkat ketidakcocokan preferensi Manager (ξ*) |
| **Iterasi** | "ite-rasi" | Perulangan dalam solver untuk memperbaiki bobot |
| **Konvergen** | "kon-ver-gen" | Solver sudah menemukan jawaban stabil |
| **LP** | "L-P" | **Linear Programming** — pemrograman linear |
| **LP Solver** | "L-P Solver" | Algoritma yang mencari bobot optimal dari model LP |
| **MCDM** | "M-C-D-M" | **Multi-Criteria Decision Making** — pengambilan keputusan multikriteria |
| **Min-Max** | "min-maks" | Metode normalisasi ke skala 0–100 berdasarkan range data |

### N–Z

| Istilah | Cara Baca | Arti |
|---------|-----------|------|
| **Newton-Raphson** | "newton rafson" | Metode optimasi cepat untuk mencari akar persamaan |
| **Nilait Mentah** | "mentah" | Nilai asli sebelum dinormalisasi (raw values) |
| **Normalisasi** | "nor-ma-li-sa-si" | Proses mengubah nilai ke skala seragam (0–100) |
| **OW Vector** | "O-W Vektor" | **Others-to-Worst** — vektor perbandingan semua kriteria vs Worst |
| **Pass 1** | "pas satu" | Tahap pertama: normalisasi + WSM untuk cari skor |
| **Pass 2** | "pas dua" | Tahap kedua: hitung tunjangan dengan Smax |
| **Plafon Bonus** | "pla-fon bonus" | Batas maksimal tunjangan yang bisa didapat |
| **Preferensi** | "pre-fe-ren-si" | Input Manager berupa BO/OW vectors (skala 1–9) |
| **Smax** | "S-maks" | Skor tertinggi dalam batch (pembagi tunjangan) |
| **SPK** | "S-P-K" | **Sistem Pendukung Keputusan** |
| **Solver** | "solver" | Algoritma pemecah masalah optimasi |
| **Tunjangan** | "tun-ja-ngan" | Bonus kinerja yang diterima teknisi (dalam rupiah) |
| **vij** | "v-i-j" | Nilai ternormalisasi teknisi i kriteria j (0–100) |
| **Worst** | "worst" | Kriteria **terburuk/paling rendah** pengaruhnya |
| **WSM** | "W-S-M" | **Weighted Sum Model** — Σ(bobot × nilai) untuk skor akhir |
| **ξ (xi)** | "ksi" | Simbol inkonsistensi dalam model LP |
| **ξ* (xi-star)** | "ksi bintang" | Nilai inkonsistensi minimal hasil LP Solver |

---

*Dokumen diperbarui: 2026-05-29*  
*Berdasarkan implementasi di `lib/bwm/` dan `app/api/bwm/`*
