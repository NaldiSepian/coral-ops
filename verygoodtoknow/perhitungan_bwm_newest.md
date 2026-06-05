# Contoh Perhitungan BWM — 3 Teknisi Berbeda Level Kompetensi

**Penugasan:** Perawatan Sistem Jaringan  
**Plafon Bonus:** Rp 1.500.000  
**Tanggal Selesai:** 31/5/2026 (pas deadline)

---

## 1. Preferensi Manager

Manager menentukan kriteria terbaik (*best*) dan terburuk (*worst*), serta nilai perbandingan berpasangan:

| Best Criteria | Worst Criteria |
|---------------|---------------|
| C1 (Kecepatan) | C5 (Kompetensi) |

### Best-to-Others (BO)
Seberapa penting C1 (Best) dibanding setiap kriteria lain:

| C1 (Best) | C2 | C3 | C4 | C5 (Worst) |
|-----------|----|----|----|------------|
| 1 | 2 | 3 | 5 | 9 |

### Others-to-Worst (OW)
Seberapa penting setiap kriteria lain dibanding C5 (Worst):

| C1 | C2 | C3 | C4 | C5 (Worst) |
|----|----|----|----|------------|
| 5 | 4 | 3 | 2 | 1 |

---

## 2. Bobot Kriteria (Weights) — LP Solver

Preferensi di atas diproses oleh LP Solver (`lib/bwm/lp-solver.ts`) dan menghasilkan:

| Kriteria | Bobot | Persentase |
|----------|-------|------------|
| C1 — Kecepatan | 0.4090 | **40.90%** |
| C2 — Kualitas | 0.2483 | **24.83%** |
| C3 — Kepatuhan | 0.1850 | **18.50%** |
| C4 — Proaktivitas | 0.0993 | **9.93%** |
| C5 — Kompetensi | 0.0584 | **5.84%** |
| **Total** | **1.0000** | **100%** |

**Consistency Ratio:** $CR = 0.0392$ (≤ 0.10 ✅ konsisten)  
**Xi Star:** $\xi^* = 0.1461$

> C1 sebagai Best mendapat bobot tertinggi (40.90%), C5 sebagai Worst mendapat bobot terendah (5.84%).

---

## 3. Data Tiga Teknisi

| # | User | Level | Lisensi | Nilai C5 |
|---|------|-------|---------|----------|
| 1 | User Pertama | Level 1 | Rp 500.000 | **500.000** |
| 2 | User Kedua | Level 2 | Rp 1.000.000 | **1.000.000** |
| 3 | User Ketiga | Level 3 | Rp 1.500.000 | **1.500.000** |

---

## 4. Nilai Mentah (Raw Values)

### C1 — Kecepatan
Penugasan selesai pas deadline (31/5/2026). Sisa hari = 0.

$$ C1 = 50 + (0 \times 10) = 50 $$

### C2 — Kualitas
Semua laporan disetujui → 100% *approved*.
$$ C2 = \frac{100}{100} \times 100 = 100 $$

### C3 — Kepatuhan
Penugasan 3 hari, frekuensi harian → expected = 3. Masing-masing teknisi lapor 1 hari unik.

$$ C3 = \frac{1}{3} \times 100 = 33 $$

### C4 — Proaktivitas
1 kendala disetujui dalam penugasan (global, sama untuk semua).

$$ C4 = 1 $$

### C5 — Kompetensi
Nilai dari level lisensi masing-masing teknisi.

| # | User | C1 | C2 | C3 | C4 | C5 |
|---|------|----|----|----|----|----|
| 1 | Level 1 | 50 | 100 | 33 | 1 | 500.000 |
| 2 | Level 2 | 50 | 100 | 33 | 1 | 1.000.000 |
| 3 | Level 3 | 50 | 100 | 33 | 1 | 1.500.000 |

---

## 5. Normalisasi (Min-Max ke 0-100)

### Static Range
Dua kriteria pakai range global, tidak tergantung batch.

| Kriteria | Range | Rumus | Semua User |
|----------|-------|-------|------------|
| C1 — Kecepatan | 0–100 | $V1 = \frac{50-0}{100-0} \times 100$ | **50.00** |
| C4 — Proaktivitas | 0–20 | $V4 = \frac{1-0}{20-0} \times 100$ | **5.00** |

### Dynamic Range
Tiga kriteria pakai range dari batch (min/max dari seluruh teknisi).

**C2:** Semua punya nilai 100 → min = max = 100.

$$ V2 = 100 $$

**C3:** Semua punya nilai 33 → min = max = 33.

$$ V3 = 100 $$

**C5:** Berbeda per level.

| User | C5 | Min | Max | $V5 = \frac{C5 - min}{max - min} \times 100$ |
|------|----|-----|-----|---------------------------------------------|
| Level 1 | 500.000 | 500.000 | 1.500.000 | $\frac{500k - 500k}{1.5jt - 500k} \times 100 = \textbf{0.00}$ |
| Level 2 | 1.000.000 | 500.000 | 1.500.000 | $\frac{1jt - 500k}{1.5jt - 500k} \times 100 = \textbf{50.00}$ |
| Level 3 | 1.500.000 | 500.000 | 1.500.000 | $\frac{1.5jt - 500k}{1.5jt - 500k} \times 100 = \textbf{100.00}$ |

### Rekapitulasi Normalisasi

| # | User | V1 | V2 | V3 | V4 | V5 |
|---|------|----|----|----|----|----|
| 1 | Level 1 | 50.00 | 100.00 | 100.00 | 5.00 | **0.00** |
| 2 | Level 2 | 50.00 | 100.00 | 100.00 | 5.00 | **50.00** |
| 3 | Level 3 | 50.00 | 100.00 | 100.00 | 5.00 | **100.00** |

---

## 6. Skor Akhir (Weighted Sum Model)

$$ S_i = \sum_{j=1}^{5} w_j \times V_{ij} $$

### Level 3

| Komponen | Bobot $(w)$ | V | $w \times V$ |
|----------|------------|---|-------------|
| C1 | 0.4090 | 50.00 | 20.45 |
| C2 | 0.2483 | 100.00 | 24.83 |
| C3 | 0.1850 | 100.00 | 18.50 |
| C4 | 0.0993 | 5.00 | 0.50 |
| C5 | 0.0584 | 100.00 | **5.84** |
| **Skor** | | | **70.12** |

### Level 2

| Komponen | Bobot $(w)$ | V | $w \times V$ |
|----------|------------|---|-------------|
| C1 | 0.4090 | 50.00 | 20.45 |
| C2 | 0.2483 | 100.00 | 24.83 |
| C3 | 0.1850 | 100.00 | 18.50 |
| C4 | 0.0993 | 5.00 | 0.50 |
| C5 | 0.0584 | 50.00 | **2.92** |
| **Skor** | | | **67.20** |

### Level 1

| Komponen | Bobot $(w)$ | V | $w \times V$ |
|----------|------------|---|-------------|
| C1 | 0.4090 | 50.00 | 20.45 |
| C2 | 0.2483 | 100.00 | 24.83 |
| C3 | 0.1850 | 100.00 | 18.50 |
| C4 | 0.0993 | 5.00 | 0.50 |
| C5 | 0.0584 | 0.00 | **0.00** |
| **Skor** | | | **64.27** |

---

## 7. Tunjangan (Absolute Scoring)

$$ \text{Tunjangan} = \frac{S_i}{100} \times \text{Plafon} $$

Plafon: Rp 1.500.000

| # | User | Level | Skor | Tunjangan | % Plafon |
|---|------|-------|------|-----------|----------|
| 1 | User Ketiga | Level 3 | 70.12 | $\frac{70.12}{100} \times 1.500.000$ | **Rp 1.051.800** | 70.12% |
| 2 | User Kedua | Level 2 | 67.20 | $\frac{67.20}{100} \times 1.500.000$ | **Rp 1.008.000** | 67.20% |
| 3 | User Pertama | Level 1 | 64.27 | $\frac{64.27}{100} \times 1.500.000$ | **Rp 964.050** | 64.27% |
| | | | | **Total** | **Rp 3.023.850** | |

---

## 8. Kesimpulan

1. **Perbedaan skor hanya berasal dari C5 (Kompetensi).** C1–C4 identik karena semua teknisi dalam penugasan yang sama (C1 global, C2/C3/C4 nilainya sama).

2. **Bobot C5 sangat kecil** (5.84% karena ditetapkan sebagai *worst criteria*). Akibatnya, perbedaan Level 3 ke Level 1 hanya berdampak **5.84 poin** pada skor akhir ($0.0584 \times 100 = 5.84$).

3. **Level 3 unggul tipis** — skor 70.12 vs Level 2 (67.20) vs Level 1 (64.27). Semua di kisaran 64–70 karena faktor dominan (C1–C4) identik.

4. **Absolute scoring** memastikan tunjangan proporsional: tidak ada yang mendapat 100% plafon hanya karena jadi yang tertinggi. Level 3 dapat Rp 1.051.800 (70.12%), sesuai skor absolutnya.

5. **Jika ingin kompetensi lebih berdampak**, manager perlu merevisi preferensi — misal menaikkan prioritas C5 atau bahkan menjadikannya *best criteria*.

---

## Referensi Implementasi

| Komponen | File |
|----------|------|
| Bobot (LP Solver) | `lib/bwm/lp-solver.ts` |
| Normalisasi | `lib/bwm/normalization.ts` |
| Consistency Check | `lib/bwm/consistency.ts` |
| WSM & Tunjangan | `lib/bwm/calculator.ts` |
| Perhitungan Raw Values | `app/api/bwm/perhitungan/route.ts` |
