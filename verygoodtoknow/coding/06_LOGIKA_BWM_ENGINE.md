# 06 — Logika BWM Engine

> **BWM (Best-Worst Method)** adalah metode Multi-Criteria Decision Making (MCDM) yang dipakai di Coral-Ops untuk menghitung bonus kinerja teknisi secara objektif berdasarkan 5 kriteria.

Seluruh kode BWM engine berada di folder `lib/bwm/`. Struktur filenya:

```
lib/bwm/
├── types.ts            # Tipe data, interface, konstanta, error classes
├── normalization.ts    # Normalisasi min-max (nilai mentah → skala 0-100)
├── lp-solver.ts        # LP Solver: mencari bobot optimal dari preferensi
├── consistency.ts      # Consistency Ratio: validasi konsistensi preferensi
├── calculator.ts       # Orchestrator: menggabungkan semua komponen + hitung skor & tunjangan
└── index.ts            # Public API: re-export semua yang dibutuhkan aplikasi lain
```

---

## 1. Tipe Data (`lib/bwm/types.ts`)

BWM engine punya 5 kriteria penilaian yang disimpan sebagai konstanta:

```typescript
// lib/bwm/types.ts :12-21
export const CRITERIA_CODES = ['c1', 'c2', 'c3', 'c4', 'c5'] as const;

export const CRITERIA_NAMES: Record<CriteriaCode, string> = {
  c1: 'Kecepatan Penyelesaian',
  c2: 'Kualitas Laporan',
  c3: 'Kepatuhan Laporan',
  c4: 'Proaktivitas',
  c5: 'Kompetensi Teknisi',
};
```

| Kode | Kriteria | Contoh Nilai Mentah |
|------|----------|-------------------|
| c1 | Kecepatan Penyelesaian | % on-time (0-100) |
| c2 | Kualitas Laporan | % laporan approved (0-100) |
| c3 | Kepatuhan Laporan | % laporan on-time (0-100) |
| c4 | Proaktivitas | Jumlah kendala dilaporkan (0-20) |
| c5 | Kompetensi Teknisi | Nilai dari level lisensi (Rp) |

**Interface utama** yang dipakai di seluruh engine:

```typescript
// lib/bwm/types.ts :117-130
export interface BWMInput {
  teknisiId: string;
  penugasanId: number;
  rawValues: {
    c1_kecepatan: number;
    c2_kualitas: number;
    c3_kepatuhan: number;
    c4_proaktivitas: number;
    c5_kompetensi: number;
  };
  plafonBonus: number; // Plafon bonus untuk project ini
}
```

```typescript
// lib/bwm/types.ts :151-175
export interface BWMResult {
  weights: { w1: number; w2: number; w3: number; w4: number; w5: number };
  normalizedValues: { v1: number; v2: number; v3: number; v4: number; v5: number };
  xiStar: number;        // Tingkat inkonsistensi minimal
  cr: number;            // Consistency Ratio
  isConsistent: boolean; // Apakah preferensi konsisten?
  skorAkhir: number;     // Skor akhir 0-100
  tunjanganDidapat: number; // Bonus dalam Rupiah
}
```

Preferensi BWM (Best-to-Others dan Others-to-Worst) menggunakan skala 1-9:

```typescript
// lib/bwm/types.ts :23
export const PREFERENSI_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
```

Ada juga **error handling** khusus dengan kode error yang terdefinisi:

```typescript
// lib/bwm/types.ts :220-240
export enum BWMErrorCode {
  PREFERENSI_NOT_FOUND = 'PREFERENSI_NOT_FOUND',
  PREFERENSI_INCONSISTENT = 'PREFERENSI_INCONSISTENT',
  PENUGASAN_NOT_FOUND = 'PENUGASAN_NOT_FOUND',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  // ...
}

export class BWMError extends Error {
  constructor(public code: BWMErrorCode, message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'BWMError';
  }
}
```

---

## 2. Normalisasi Nilai Kriteria (`lib/bwm/normalization.ts`)

### 2.1. Masalah yang Dipecahkan

Nilai mentah dari 5 kriteria punya satuan dan skala berbeda:
- c1 (kecepatan): 0-100%
- c4 (proaktivitas): 0-20 (jumlah kendala)
- c5 (kompetensi): 0-1.500.000 (rupiah)

Tidak bisa langsung dijumlahkan. Makanya perlu **dinormalisasi** ke skala yang sama (0-100).

### 2.2. Range Per Kriteria

```typescript
// lib/bwm/normalization.ts :31-37
export const CRITERIA_RANGES: Record<CriteriaCode, { min: number; max: number }> = {
  c1: { min: 0, max: 100 },
  c2: { min: 0, max: 100 },
  c3: { min: 0, max: 100 },
  c4: { min: 0, max: 20 },
  c5: { min: 0, max: 1500000 },
};
```

### 2.3. Rumus Normalisasi Min-Max

```
x_normalized = ((nilai_asli - min) / (max - min)) × 100
```

Implementasinya:

```typescript
// lib/bwm/normalization.ts :60-72
export function minMaxNormalize(value: number, min: number, max: number): number {
  if (max === min) return 100; // Semua nilai sama = terbaik
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.round(normalized * 100) / 100;
}
```

### 2.4. Normalisasi Batch dengan Range Dinamis

Teknisinya dalam satu penugasan dinormalisasi **bersama-sama** dalam satu batch. Range min/max dihitung dari seluruh batch, bukan dari range global. Ini membuat perbandingan antar teknisi lebih adil.

```typescript
// lib/bwm/normalization.ts :171-203
export function calculateBatchRanges(allRawValues) {
  // Ambil semua nilai c1, c2, ... dari setiap teknisi
  // Hitung min dan max per kriteria
  return {
    c1: { min: Math.min(...c1Values), max: Math.max(...c1Values) },
    c2: { min: Math.min(...c2Values), max: Math.max(...c2Values) },
    // ...
  };
}
```

**Alur normalisasi batch:**
1. Kumpulkan semua nilai mentah dari seluruh teknisi dalam satu penugasan
2. Hitung min/max per kriteria dari batch tersebut
3. Normalisasi setiap teknisi menggunakan range dari batch
4. Hasil: nilai v1-v5 dalam skala 0-100 yang sudah sebanding antar teknisi

### 2.5. Validasi Input

Sebelum normalisasi, nilai mentah divalidasi:

```typescript
// lib/bwm/normalization.ts :135-165
export function validateRawValues(rawValues) {
  const errors: string[] = [];
  if (rawValues.c1_kecepatan < 0 || rawValues.c1_kecepatan > 100)
    errors.push('c1_kecepatan harus antara 0-100');
  if (rawValues.c4_proaktivitas < 0)
    errors.push('c4_proaktivitas tidak boleh negatif');
  // ... validasi lainnya
  return errors;
}
```

---

## 3. LP Solver — Mencari Bobot Optimal (`lib/bwm/lp-solver.ts`)

### 3.1. Apa yang Dilakukan LP Solver?

LP Solver menerjemahkan **preferensi manager** (kriteria mana yang paling penting, mana yang paling tidak penting) menjadi **bobot numerik** (w1-w5). Bobot ini menentukan seberapa besar pengaruh masing-masing kriteria terhadap skor akhir.

### 3.2. Model Matematika (Rezaei, 2015)

```
Minimize    ξ (xi)
Subject to:
  |wB - aBj × wj| ≤ ξ,   untuk semua j
  |wj - ajW × wW| ≤ ξ,   untuk semua j
  Σwj = 1
  wj ≥ 0, ξ ≥ 0
```

Penjelasan:
- **wB** = bobot kriteria terbaik (best)
- **wW** = bobot kriteria terburuk (worst)
- **wj** = bobot kriteria ke-j
- **aBj** = seberapa penting kriteria B dibanding kriteria j (1-9)
- **ajW** = seberapa penting kriteria j dibanding kriteria W (1-9)
- Tujuan: meminimalkan inkonsistensi (ξ)

### 3.3. Implementasi Gradient Descent

```typescript
// lib/bwm/lp-solver.ts :65-176
export function solveLP(bestCriteria, worstCriteria, boVector, owVector, config = {}) {
  const cfg = { maxIterations: 1000, tolerance: 0.0001, learningRate: 0.01, ...config };

  // Mulai dengan bobot equal (0.2 untuk 5 kriteria)
  let weights = new Array(5).fill(0.2);

  for (let iter = 0; iter < cfg.maxIterations; iter++) {
    // Hitung pelanggaran constraint
    const violations = [];
    for (let j = 0; j < 5; j++) {
      violations.push(Math.abs(weights[bestIndex] - aBj * weights[j]));
      violations.push(Math.abs(weights[j] - ajW * weights[worstIndex]));
    }

    // ξ = pelanggaran terbesar
    const currentXi = Math.max(...violations);

    // Cek konvergensi
    if (Math.abs(currentXi - xiStar) < cfg.tolerance) {
      converged = true;
      break;
    }

    // Update bobot dengan gradient descent
    // Arahkan bobot supaya pelanggaran makin kecil
    weights[j] -= cfg.learningRate * gradients[j];
    weights[j] = Math.max(0.0001, weights[j]); // Pastikan positif

    // Normalisasi: Σw = 1
    weights = weights.map((w) => w / sumWeights);
  }

  return { weights, xiStar, converged, iterations };
}
```

### 3.4. Metode Newton-Raphson (Lebih Cepat)

Untuk 5 kriteria, ada metode yang lebih cepat:

```typescript
// lib/bwm/lp-solver.ts :188-281
export function solveLPNewton(bestCriteria, worstCriteria, boVector, owVector) {
  // Inisialisasi: weight[best] = 1, yang lain = 1/aBj
  weights[bestIndex] = 1.0;
  for (let j = 0; j < 5; j++) {
    if (j !== bestIndex) weights[j] = weights[bestIndex] / boValues[j];
  }
  // Normalisasi
  weights = weights.map((w) => w / sumWeights);

  // Iterasi refinement: rata-rata dari dua estimate (BO dan OW)
  for (let iter = 0; iter < maxIterations; iter++) {
    for (let j = 0; j < 5; j++) {
      const targetFromBO = normalizedWeights[bestIndex] / boValues[j];
      const targetFromOW = owValues[j] * normalizedWeights[worstIndex];
      normalizedWeights[j] = (targetFromBO + targetFromOW) / 2;
    }
    // Normalisasi ulang
  }

  return { weights, xiStar, converged, iterations };
}
```

### 3.5. Auto-select Solver

```typescript
// lib/bwm/lp-solver.ts :286-302
export function solveBWM(bestCriteria, worstCriteria, boVector, owVector) {
  // Coba Newton dulu (lebih cepat)
  const result = solveLPNewton(bestCriteria, worstCriteria, boVector, owVector);
  // Fallback ke gradient descent kalau tidak konvergen
  if (!result.converged) return solveLP(bestCriteria, worstCriteria, boVector, owVector);
  return result;
}
```

---

## 4. Consistency Ratio (`lib/bwm/consistency.ts`)

### 4.1. Kenapa Perlu Cek Konsistensi?

Preferensi manusia bisa tidak konsisten. Contoh: A lebih penting dari B, B lebih penting dari C, tapi C lebih penting dari A — itu tidak konsisten. Consistency Ratio (CR) mengukur seberapa konsisten preferensi manager.

### 4.2. Rumus CR

```
CR = xi* / CI
```

- **xi*** = nilai inkonsistensi minimal dari LP solver
- **CI** = Consistency Index (nilai maksimum xi* yang理论上可能)

Jika **CR ≤ 0.10**, preferensi dianggap konsisten.

```typescript
// lib/bwm/consistency.ts :19
export const CR_THRESHOLD = 0.10;
```

### 4.3. Implementasi

```typescript
// lib/bwm/consistency.ts :49-66
export function calculateCR(xiStar, bestCriteria, worstCriteria, aBW) {
  const ci = calculateConsistencyIndex(bestCriteria, worstCriteria, aBW);
  if (ci === 0) return 0;
  return Math.round((xiStar / ci) * 10000) / 10000;
}
```

CI dihitung menggunakan **lookup table** dari paper Rezaei (2015):

```typescript
// lib/bwm/consistency.ts :103-113
const ciTable: Record<number, number> = {
  1: 0.00, 2: 0.44, 3: 1.00, 4: 1.63,
  5: 2.30, 6: 3.00, 7: 3.73, 8: 4.47, 9: 5.23,
};
```

### 4.4. Validasi Vektor Preferensi

Sebelum menghitung, engine memvalidasi preferensi:

```typescript
// lib/bwm/consistency.ts :189-229
export function validateVectors(boVector, owVector, bestCriteria, worstCriteria) {
  const errors: string[] = [];
  // 1. aBB harus = 1 (best terhadap dirinya sendiri)
  // 2. aWW harus = 1 (worst terhadap dirinya sendiri)
  // 3. aBW × aWB >= 1 (kondisi konsistensi)
  // 4. Semua nilai dalam range 1-9
  return errors;
}
```

---

## 5. Calculator — Orchestrator Utama (`lib/bwm/calculator.ts`)

Calculator menggabungkan semua komponen di atas. Ini alur lengkapnya:

### 5.1. Parse Preferensi

Preferensi dari database (dalam bentuk flat fields) diubah ke format BO/OW vectors:

```typescript
// lib/bwm/calculator.ts :38-77
export function parsePreferensi(preferensi) {
  return {
    id: preferensi.id,
    bestCriteria: preferensi.best_criteria,
    worstCriteria: preferensi.worst_criteria,
    boVector: { c1: preferensi.bo_c1, c2: preferensi.bo_c2, ... },
    owVector: { c1: preferensi.ow_c1, c2: preferensi.ow_c2, ... },
  };
}
```

### 5.2. Weighted Sum Model (WSM)

Setelah bobot (w) dan nilai ternormalisasi (v) didapat, skor akhir dihitung:

```typescript
// lib/bwm/calculator.ts :88-103
export function calculateWSM(weights: number[], normalizedValues: number[]): number {
  let skor = 0;
  for (let i = 0; i < 5; i++) {
    skor += weights[i] * normalizedValues[i];
  }
  return Math.round(skor * 100) / 100;
}
```

Rumus: **Skor = (w1 × v1) + (w2 × v2) + (w3 × v3) + (w4 × v4) + (w5 × v5)**

### 5.3. Hitung Tunjangan

Tunjangan setiap teknisi dihitung relatif terhadap skor tertinggi dalam batch:

```typescript
// lib/bwm/calculator.ts :115-128
export function calculateTunjangan(skorAkhir, plafonBonus, skorMaksimumBatch) {
  if (skorMaksimumBatch === 0) return 0;
  return (skorAkhir / skorMaksimumBatch) * plafonBonus;
}
```

Rumus: **Tunjangan = (Skor_i / S_max) × PlafonBonus**

### 5.4. Batch Calculation (Alur Lengkap)

```typescript
// lib/bwm/calculator.ts :252-362
export function batchCalculateBWM(inputs, parsedPreferensi) {
  // Step 1: Hitung min/max dari batch untuk normalisasi dinamis
  const ranges = calculateBatchRanges(inputs.map(i => i.rawValues));

  // Step 2: Solve LP (sekali untuk semua teknisi)
  const lpResult = solveBWM(...);

  // Step 3: Hitung Consistency Ratio
  const cr = calculateCR(lpResult.xiStar, ...);

  // Pass 1: Normalisasi + WSM untuk setiap teknisi
  for (const input of inputs) {
    const normalized = normalizeWithRanges(input.rawValues, ranges);
    const skorAkhir = calculateWSM(lpResult.weights, normalized);
  }

  // Step 4: Hitung skor maksimum batch (S_max)
  const skorMaksimumBatch = Math.max(...allScores);

  // Pass 2: Hitung tunjangan dengan S_max
  for (const teknisi of results) {
    teknisi.tunjanganDidapat = calculateTunjangan(teknisi.skor, plafon, S_max);
  }

  return results;
}
```

### 5.5. Format Hasil untuk Display

```typescript
// lib/bwm/calculator.ts :370-395
export function formatBWMResult(result) {
  return {
    weights: {
      w1: `${(result.weights.w1 * 100).toFixed(2)}%`,
      w2: `${(result.weights.w2 * 100).toFixed(2)}%`,
      // ...
    },
    skorAkhir: `${result.skorAkhir.toFixed(2)}/100`,
    tunjanganDidapat: new Intl.NumberFormat("id-ID", {
      style: "currency", currency: "IDR",
    }).format(result.tunjanganDidapat),
  };
}
```

---

## 6. Public API (`lib/bwm/index.ts`)

File ini re-export semua fungsi dan type yang dibutuhkan aplikasi lain:

```typescript
// lib/bwm/index.ts
export { calculateBWM, batchCalculateBWM, parsePreferensi, calculateWSM, ... } from './calculator';
export { solveBWM, solveLP, solveLPNewton, ... } from './lp-solver';
export { minMaxNormalize, normalizeAllCriteria, ... } from './normalization';
export { calculateCR, validateConsistency, ... } from './consistency';
export { BWMError, BWMErrorCode, CRITERIA_NAMES, ... } from './types';
```

Cara pakai di komponen atau API route:

```typescript
import { batchCalculateBWM, parsePreferensi } from '@/lib/bwm';

const preferensi = parsePreferensi(dbPreferensi);
const results = batchCalculateBWM(teknisiList, preferensi);
```

---

## Ringkasan Alur BWM

```
┌─────────────────────────────────────────────────────────┐
│  1. Manager menentukan preferensi (best, worst, BO, OW) │
│     Disimpan di tabel `preferensi_bwm`                  │
├─────────────────────────────────────────────────────────┤
│  2. Sistem mengumpulkan nilai mentah teknisi            │
│     (kecepatan, kualitas, kepatuhan, proaktivitas,      │
│      kompetensi) dari database                          │
├─────────────────────────────────────────────────────────┤
│  3. Normalisasi batch:                                  │
│     - Hitung min/max per kriteria dari batch            │
│     - Normalisasi semua teknisi ke skala 0-100          │
├─────────────────────────────────────────────────────────┤
│  4. LP Solver:                                          │
│     - Cari bobot optimal (w1-w5) dari preferensi        │
│     - Hitung ξ* (tingkat inkonsistensi)                 │
├─────────────────────────────────────────────────────────┤
│  5. Consistency Check:                                  │
│     - Hitung CR = ξ* / CI                               │
│     - Pastikan CR ≤ 0.10                                │
├─────────────────────────────────────────────────────────┤
│  6. Hitung skor akhir (WSM):                            │
│     Skor = Σ(wj × vj)                                   │
├─────────────────────────────────────────────────────────┤
│  7. Hitung tunjangan:                                   │
│     Tunjangan = (Skor_i / S_max) × Plafon               │
├─────────────────────────────────────────────────────────┤
│  8. Simpan hasil ke tabel `perhitungan_bwm`             │
│     Finalisasi → generate gaji di `gaji_teknisi`        │
└─────────────────────────────────────────────────────────┘
```

---

## Catatan Penting

- Semua perhitungan menggunakan **dynamic normalization** — range min/max dihitung dari batch teknisi dalam satu penugasan, bukan dari range global. Ini sesuai proposal untuk perbandingan yang adil.
- LP Solver menggunakan **Newton-Raphson** sebagai default (lebih cepat), dengan **Gradient Descent** sebagai fallback.
- Preferensi dengan **CR > 0.10** sebaiknya direvisi karena dianggap tidak konsisten.
- Hasil perhitungan disimpan di database dengan status **draft** sampai manager melakukan finalisasi.

---

**Selamat!** Anda telah mempelajari seluruh alur BWM Engine dari input preferensi hingga output tunjangan teknisi.

[Kembali ke Index Tutorial](./CODING_INDEX.md)
