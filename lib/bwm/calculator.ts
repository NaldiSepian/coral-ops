/**
 * BWM Calculator - Main Orchestrator
 *
 * Menggabungkan semua komponen BWM:
 * - LP Solver untuk bobot optimal
 * - Normalisasi untuk nilai kriteria
 * - Consistency Check untuk validasi
 * - Weighted Sum Model untuk skor akhir
 *
 * @module lib/bwm/calculator
 * @see RINGKASAN.md - Langkah 1-9 BWM
 */

import type {
  BWMInput,
  BWMResult,
  ParsedPreferensi,
  BOVector,
  OWVector,
  CriteriaCode,
} from "./types";
import { solveBWM } from "./lp-solver";
import {
  normalizeAllCriteria,
  validateRawValues,
  minMaxNormalize,
  calculateBatchRanges,
  batchNormalizeWithDynamicRanges,
  CRITERIA_RANGES,
} from "./normalization";
import { calculateCR, validateConsistency, CR_THRESHOLD } from "./consistency";

/**
 * Parse preferensi dari database ke BO/OW vectors
 *
 * @param preferensi - Preferensi dari database
 * @returns Parsed preferensi dengan vectors
 */
export function parsePreferensi(preferensi: {
  id: string;
  best_criteria: string;
  worst_criteria: string;
  bo_c1: number;
  bo_c2: number;
  bo_c3: number;
  bo_c4: number;
  bo_c5: number;
  ow_c1: number;
  ow_c2: number;
  ow_c3: number;
  ow_c4: number;
  ow_c5: number;
}): ParsedPreferensi {
  // Type assertion karena data dari database sudah tervalidasi 1-9
  const boVector: BOVector = {
    c1: preferensi.bo_c1 as BOVector["c1"],
    c2: preferensi.bo_c2 as BOVector["c2"],
    c3: preferensi.bo_c3 as BOVector["c3"],
    c4: preferensi.bo_c4 as BOVector["c4"],
    c5: preferensi.bo_c5 as BOVector["c5"],
  };

  const owVector: OWVector = {
    c1: preferensi.ow_c1 as OWVector["c1"],
    c2: preferensi.ow_c2 as OWVector["c2"],
    c3: preferensi.ow_c3 as OWVector["c3"],
    c4: preferensi.ow_c4 as OWVector["c4"],
    c5: preferensi.ow_c5 as OWVector["c5"],
  };

  return {
    id: preferensi.id,
    bestCriteria: preferensi.best_criteria as CriteriaCode,
    worstCriteria: preferensi.worst_criteria as CriteriaCode,
    boVector,
    owVector,
  };
}

/**
 * Hitung skor akhir menggunakan Weighted Sum Model (WSM)
 *
 * Rumus: Si = Σ(wj × vij) untuk j = 1 sampai n
 *
 * @param weights - Bobot [w1, w2, w3, w4, w5]
 * @param normalizedValues - Nilai ternormalisasi [v1, v2, v3, v4, v5]
 * @returns Skor akhir (0-100)
 */
export function calculateWSM(
  weights: number[],
  normalizedValues: number[],
): number {
  if (weights.length !== 5 || normalizedValues.length !== 5) {
    throw new Error("Weights dan normalizedValues harus memiliki 5 elemen");
  }

  let skor = 0;
  for (let i = 0; i < 5; i++) {
    skor += weights[i] * normalizedValues[i];
  }

  // Round ke 2 decimal places
  return Math.round(skor * 100) / 100;
}

/**
 * Hitung tunjangan yang didapat berdasarkan skor dan plafon
 *
 * Absolute scoring: Tunjangan = (Skor / 100) × Plafon
 * Setiap teknisi mendapat sesuai skornya, tidak relatif terhadap S_max.
 * Ini lebih adil karena skor sendiri sudah mencerminkan performa.
 *
 * @param skorAkhir - Skor akhir teknisi (0-100)
 * @param plafonBonus - Plafon maksimal bonus
 * @returns Tunjangan dalam Rupiah
 */
export function calculateTunjangan(
  skorAkhir: number,
  plafonBonus: number,
): number {
  // Rumus: Tunjangan = (Skor / 100) × Plafon
  const tunjangan = (skorAkhir / 100) * plafonBonus;

  // Round ke 2 decimal places
  return Math.round(tunjangan * 100) / 100;
}

/**
 * Lakukan perhitungan BWM lengkap untuk satu teknisi
 *
 * NOTE: Single teknisi = batch dengan 1 elemen.
 * Normalisasi tetap butuh konteks batch, jadi gunakan batchCalculateBWM
 *
 * @param input - Input BWM dengan nilai mentah
 * @param parsedPreferensi - Preferensi yang sudah diparse
 * @returns Hasil BWM lengkap
 * @deprecated Gunakan batchCalculateBWM untuk hasil yang benar secara metodologi
 */
export function calculateBWM(
  input: BWMInput,
  parsedPreferensi: ParsedPreferensi,
): BWMResult {
  // Single teknisi = batch dengan 1 elemen
  // min == max dalam batch → semua v = 100 (sesuai proposal)
  const results = batchCalculateBWM([input], parsedPreferensi);

  if (results[0].error) {
    throw new Error(results[0].error);
  }

  return results[0].result;
}

/**
 * Calculate BWM dengan pre-calculated dynamic ranges
 * Internal function untuk batch processing
 *
 * NOTE: Fungsi ini hanya menghitung sampai skor. Tunjangan dihitung di 2nd pass
 * dengan skor maksimum batch yang sudah diketahui.
 */
function calculateBWMWithRanges(
  input: BWMInput,
  parsedPreferensi: ParsedPreferensi,
  ranges: ReturnType<typeof calculateBatchRanges>,
  lpResult: { weights: number[]; xiStar: number; converged: boolean },
): Omit<BWMResult, "tunjanganDidapat"> {
  // Step 1: Validasi input
  const validationErrors = validateRawValues(input.rawValues);
  if (validationErrors.length > 0) {
    throw new Error(`Validasi gagal: ${validationErrors.join(", ")}`);
  }

  // Step 2: Normalisasi dengan dynamic ranges dari batch
  const normalized = {
    v1: minMaxNormalize(
      input.rawValues.c1_kecepatan,
      CRITERIA_RANGES.c1.min,
      CRITERIA_RANGES.c1.max,
    ),
    v2: minMaxNormalize(
      input.rawValues.c2_kualitas,
      ranges.c2.min,
      ranges.c2.max,
    ),
    v3: minMaxNormalize(
      input.rawValues.c3_kepatuhan,
      ranges.c3.min,
      ranges.c3.max,
    ),
    v4: minMaxNormalize(
      input.rawValues.c4_proaktivitas,
      CRITERIA_RANGES.c4.min,
      CRITERIA_RANGES.c4.max,
    ),
    v5: minMaxNormalize(
      input.rawValues.c5_kompetensi,
      ranges.c5.min,
      ranges.c5.max,
    ),
  };
  const normalizedValues = [
    normalized.v1,
    normalized.v2,
    normalized.v3,
    normalized.v4,
    normalized.v5,
  ];

  // Step 3: Hitung skor akhir dengan WSM
  const skorAkhir = calculateWSM(lpResult.weights, normalizedValues);

  return {
    weights: {
      w1: Math.round(lpResult.weights[0] * 10000) / 10000,
      w2: Math.round(lpResult.weights[1] * 10000) / 10000,
      w3: Math.round(lpResult.weights[2] * 10000) / 10000,
      w4: Math.round(lpResult.weights[3] * 10000) / 10000,
      w5: Math.round(lpResult.weights[4] * 10000) / 10000,
    },
    normalizedValues: {
      v1: normalized.v1,
      v2: normalized.v2,
      v3: normalized.v3,
      v4: normalized.v4,
      v5: normalized.v5,
    },
    xiStar: Math.round(lpResult.xiStar * 1000000) / 1000000,
    cr: 0, // Akan dihitung di luar
    isConsistent: false, // Akan dihitung di luar
    skorAkhir,
    // tunjanganDidapat dihitung di 2nd pass
  } as Omit<BWMResult, "tunjanganDidapat">;
}

/**
 * Batch calculation untuk multiple teknisi
 * Menggunakan dynamic normalization: min/max dari seluruh batch
 *
 * Flow:
 * 1. Kumpulkan semua raw values, hitung min/max per kriteria dari batch
 * 2. Solve LP (hanya sekali untuk semua teknisi)
 * 3. Normalisasi + WSM untuk semua teknisi
 * 4. Hitung tunjangan dengan absolute scoring (Skor/100 × Plafon)
 *
 * @param inputs - Array input untuk setiap teknisi
 * @param parsedPreferensi - Preferensi yang sudah diparse
 * @returns Array hasil BWM
 */
export function batchCalculateBWM(
  inputs: BWMInput[],
  parsedPreferensi: ParsedPreferensi,
): Array<{ input: BWMInput; result: BWMResult; error?: string }> {
  if (inputs.length === 0) {
    return [];
  }

  try {
    // Step 1: Hitung min/max dari batch untuk normalisasi dinamis
    const rawValuesOnly = inputs.map((input) => input.rawValues);
    const ranges = calculateBatchRanges(rawValuesOnly);

    // Step 2: Solve LP (hanya sekali, hasil sama untuk semua teknisi)
    const lpResult = solveBWM(
      parsedPreferensi.bestCriteria,
      parsedPreferensi.worstCriteria,
      parsedPreferensi.boVector,
      parsedPreferensi.owVector,
    );

    if (!lpResult.converged) {
      throw new Error("LP Solver tidak konvergen");
    }

    // Step 3: Hitung Consistency Ratio (sama untuk semua)
    const aBW = parsedPreferensi.boVector[parsedPreferensi.worstCriteria];
    const cr = calculateCR(
      lpResult.xiStar,
      parsedPreferensi.bestCriteria,
      parsedPreferensi.worstCriteria,
      aBW,
    );
    const consistencyCheck = validateConsistency(cr);

    // Pass 1: Hitung skor untuk semua teknisi
    const intermediateResults: Array<{
      input: BWMInput;
      result: Omit<BWMResult, "tunjanganDidapat">;
      error?: string;
    }> = inputs.map((input) => {
      try {
        const result = calculateBWMWithRanges(
          input,
          parsedPreferensi,
          ranges,
          lpResult,
        );
        return {
          input,
          result: {
            ...result,
            cr,
            isConsistent: consistencyCheck.isConsistent,
          },
        };
      } catch (error) {
        return {
          input,
          result: {} as Omit<BWMResult, "tunjanganDidapat">,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    // Pass 2: Hitung tunjangan dengan absolute scoring
    return intermediateResults.map((item) => {
      if (item.error) {
        return item as { input: BWMInput; result: BWMResult; error?: string };
      }

      const tunjanganDidapat = calculateTunjangan(
        item.result.skorAkhir,
        item.input.plafonBonus,
      );

      // Build complete BWMResult
      const completeResult: BWMResult = {
        weights: item.result.weights,
        normalizedValues: item.result.normalizedValues,
        xiStar: item.result.xiStar,
        cr: item.result.cr,
        isConsistent: item.result.isConsistent,
        skorAkhir: item.result.skorAkhir,
        tunjanganDidapat,
      };

      return {
        input: item.input,
        result: completeResult,
      };
    });
  } catch (error) {
    // Error di level batch (LP solver gagal, dll)
    const errorMsg =
      error instanceof Error ? error.message : "Unknown batch error";
    return inputs.map((input) => ({
      input,
      result: {} as BWMResult,
      error: errorMsg,
    }));
  }
}

/**
 * Format hasil BWM untuk display
 *
 * @param result - Hasil BWM
 * @returns Object dengan nilai terformat
 */
export function formatBWMResult(result: BWMResult) {
  return {
    weights: {
      w1: `${(result.weights.w1 * 100).toFixed(2)}%`,
      w2: `${(result.weights.w2 * 100).toFixed(2)}%`,
      w3: `${(result.weights.w3 * 100).toFixed(2)}%`,
      w4: `${(result.weights.w4 * 100).toFixed(2)}%`,
      w5: `${(result.weights.w5 * 100).toFixed(2)}%`,
    },
    normalizedValues: {
      v1: result.normalizedValues.v1.toFixed(2),
      v2: result.normalizedValues.v2.toFixed(2),
      v3: result.normalizedValues.v3.toFixed(2),
      v4: result.normalizedValues.v4.toFixed(2),
      v5: result.normalizedValues.v5.toFixed(2),
    },
    xiStar: result.xiStar.toFixed(6),
    cr: result.cr.toFixed(4),
    isConsistent: result.isConsistent,
    skorAkhir: `${result.skorAkhir.toFixed(2)}/100`,
    tunjanganDidapat: new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(result.tunjanganDidapat),
  };
}

/**
 * Hitung persentase skor relatif terhadap skor maksimum
 * Digunakan untuk perbandingan antar teknisi
 *
 * @param skorAkhir - Skor teknisi
 * @param skorMaksimal - Skor maksimal dalam kelompok
 * @returns Persentase relatif
 */
export function calculateRelativeScore(
  skorAkhir: number,
  skorMaksimal: number,
): number {
  if (skorMaksimal === 0) {
    return 0;
  }
  return Math.round((skorAkhir / skorMaksimal) * 100 * 100) / 100;
}

// Re-export dari sub-modules untuk kemudahan
export { solveBWM, solveLP, solveLPNewton } from "./lp-solver";
export {
  minMaxNormalize,
  normalizeAllCriteria,
  batchNormalize,
  validateRawValues,
  CRITERIA_RANGES,
  CRITERIA_DESCRIPTIONS,
} from "./normalization";
export {
  calculateCR,
  validateConsistency,
  validateVectors,
  formatCR,
  CR_THRESHOLD,
} from "./consistency";
