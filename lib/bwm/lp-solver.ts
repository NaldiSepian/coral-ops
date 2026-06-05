/**
 * LP Solver untuk BWM (Best-Worst Method)
 *
 * Menyelesaikan model LP untuk mendapatkan bobot optimal
 * dengan menggunakan pendekatan iterative approximation (tanpa library external)
 *
 * @module lib/bwm/lp-solver
 * @see RINGKASAN.md - Step 4: Model LP
 */

import type { BOVector, OWVector, CriteriaCode } from "./types";

const CRITERIA_CODES: CriteriaCode[] = ["c1", "c2", "c3", "c4", "c5"];

/**
 * Hasil dari LP Solver
 */
export interface LPSolverResult {
  /** Bobot optimal untuk setiap kriteria */
  weights: number[];
  /** Nilai xi* (ketidakkonsistenan minimal) */
  xiStar: number;
  /** Apakah solusi konvergen */
  converged: boolean;
  /** Jumlah iterasi */
  iterations: number;
}

/**
 * Konfigurasi untuk solver
 */
interface SolverConfig {
  /** Maksimal iterasi */
  maxIterations: number;
  /** Toleransi konvergensi */
  tolerance: number;
  /** Learning rate untuk gradient descent */
  learningRate: number;
}

const DEFAULT_CONFIG: SolverConfig = {
  maxIterations: 1000,
  tolerance: 0.0001,
  learningRate: 0.01,
};

/**
 * Menyelesaikan model LP untuk BWM
 *
 * Model LP (Rezaei, 2015):
 * Minimize xi
 * Subject to:
 *   |wB - aBj * wj| <= xi,  untuk semua j
 *   |wj - ajW * wW| <= xi,  untuk semua j
 *   sum(wj) = 1
 *   wj >= 0, xi >= 0
 *
 * @param bestCriteria - Kriteria terbaik (B)
 * @param worstCriteria - Kriteria terburuk (W)
 * @param boVector - Vector Best-to-Others
 * @param owVector - Vector Others-to-Worst
 * @param config - Konfigurasi solver (opsional)
 * @returns Hasil LP solver dengan bobot optimal
 */
export function solveLP(
  bestCriteria: CriteriaCode,
  worstCriteria: CriteriaCode,
  boVector: BOVector,
  owVector: OWVector,
  config: Partial<SolverConfig> = {},
): LPSolverResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Index untuk best dan worst
  const bestIndex = CRITERIA_CODES.indexOf(bestCriteria);
  const worstIndex = CRITERIA_CODES.indexOf(worstCriteria);

  if (bestIndex === -1 || worstIndex === -1) {
    throw new Error("Invalid best or worst criteria");
  }

  // Inisialisasi bobot dengan nilai equal (0.2 untuk 5 kriteria)
  let weights = new Array(5).fill(0.2);

  // Iterative refinement menggunakan gradient descent
  let xiStar = Infinity;
  let converged = false;
  let iterations = 0;

  for (let iter = 0; iter < cfg.maxIterations; iter++) {
    iterations = iter + 1;

    // Hitung constraint violations untuk setiap kriteria
    const violations: number[] = [];

    for (let j = 0; j < 5; j++) {
      // Constraint 1: |wB - aBj * wj| <= xi
      const boKey = CRITERIA_CODES[j] as keyof BOVector;
      const aBj = boVector[boKey];
      const violation1 = Math.abs(weights[bestIndex] - aBj * weights[j]);

      // Constraint 2: |wj - ajW * wW| <= xi
      const owKey = CRITERIA_CODES[j] as keyof OWVector;
      const ajW = owVector[owKey];
      const violation2 = Math.abs(weights[j] - ajW * weights[worstIndex]);

      violations.push(violation1, violation2);
    }

    // xiStar adalah maksimal violation
    const currentXi = Math.max(...violations);

    // Cek konvergensi
    if (
      Math.abs(currentXi - xiStar) < cfg.tolerance &&
      currentXi < cfg.tolerance * 10
    ) {
      xiStar = currentXi;
      converged = true;
      break;
    }

    xiStar = currentXi;

    // Update weights menggunakan gradient descent
    const gradients = new Array(5).fill(0);

    for (let j = 0; j < 5; j++) {
      // Gradient dari constraint 1
      const boKey = CRITERIA_CODES[j] as keyof BOVector;
      const aBj = boVector[boKey];
      const diff1 = weights[bestIndex] - aBj * weights[j];
      const sign1 = Math.sign(diff1);

      if (j === bestIndex) {
        gradients[bestIndex] += sign1;
      } else {
        gradients[j] += -sign1 * aBj;
      }

      // Gradient dari constraint 2
      const owKey = CRITERIA_CODES[j] as keyof OWVector;
      const ajW = owVector[owKey];
      const diff2 = weights[j] - ajW * weights[worstIndex];
      const sign2 = Math.sign(diff2);

      if (j === worstIndex) {
        gradients[worstIndex] += -sign2 * ajW;
      } else {
        gradients[j] += sign2;
      }
    }

    // Apply gradients
    for (let j = 0; j < 5; j++) {
      weights[j] -= cfg.learningRate * gradients[j];
      weights[j] = Math.max(0.0001, weights[j]); // Pastikan positif
    }

    // Normalisasi: sum(weights) = 1
    const sumWeights = weights.reduce((a, b) => a + b, 0);
    weights = weights.map((w) => w / sumWeights);
  }

  // Pastikan tidak ada nilai 0
  weights = weights.map((w) => Math.max(w, 0.0001));
  const finalSum = weights.reduce((a, b) => a + b, 0);
  weights = weights.map((w) => w / finalSum);

  return {
    weights,
    xiStar,
    converged,
    iterations,
  };
}

/**
 * Alternatif solver menggunakan metode Newton-Raphson yang lebih cepat
 * untuk kasus BWM yang relatif sederhana (hanya 5 kriteria)
 *
 * @param bestCriteria - Kriteria terbaik
 * @param worstCriteria - Kriteria terburuk
 * @param boVector - Vector Best-to-Others
 * @param owVector - Vector Others-to-Worst
 * @returns Hasil LP solver
 */
export function solveLPNewton(
  bestCriteria: CriteriaCode,
  worstCriteria: CriteriaCode,
  boVector: BOVector,
  owVector: OWVector,
): LPSolverResult {
  const bestIndex = CRITERIA_CODES.indexOf(bestCriteria);
  const worstIndex = CRITERIA_CODES.indexOf(worstCriteria);

  if (bestIndex === -1 || worstIndex === -1) {
    throw new Error("Invalid best or worst criteria");
  }

  // Extract values dari vectors
  const boValues = CRITERIA_CODES.map((c) => boVector[c]);
  const owValues = CRITERIA_CODES.map((c) => owVector[c]);

  // Solver sederhana: set weights berdasarkan geometric mean dari constraints
  const weights = new Array(5).fill(0);

  // Untuk kriteria best
  weights[bestIndex] = 1.0;

  // Untuk kriteria lain: weight[j] = weight[best] / aBj
  for (let j = 0; j < 5; j++) {
    if (j !== bestIndex) {
      weights[j] = weights[bestIndex] / boValues[j];
    }
  }

  // Normalisasi
  let sumWeights = weights.reduce((a, b) => a + b, 0);
  let normalizedWeights = weights.map((w) => w / sumWeights);

  // Iterasi refinement
  let xiStar = Infinity;
  let converged = false;
  let iterations = 0;
  const maxIterations = 100;
  const tolerance = 0.00001;

  for (let iter = 0; iter < maxIterations; iter++) {
    iterations++;

    // Hitung xi berdasarkan weights saat ini
    const violations: number[] = [];

    for (let j = 0; j < 5; j++) {
      const v1 = Math.abs(
        normalizedWeights[bestIndex] - boValues[j] * normalizedWeights[j],
      );
      const v2 = Math.abs(
        normalizedWeights[j] - owValues[j] * normalizedWeights[worstIndex],
      );
      violations.push(v1, v2);
    }

    const currentXi = Math.max(...violations);

    if (Math.abs(currentXi - xiStar) < tolerance) {
      converged = true;
      break;
    }

    xiStar = currentXi;

    // Refine weights
    for (let j = 0; j < 5; j++) {
      if (j !== bestIndex) {
        const targetFromBO = normalizedWeights[bestIndex] / boValues[j];
        const targetFromOW = owValues[j] * normalizedWeights[worstIndex];
        // Average dari dua estimate
        normalizedWeights[j] = (targetFromBO + targetFromOW) / 2;
      }
    }

    // Normalisasi ulang
    sumWeights = normalizedWeights.reduce((a, b) => a + b, 0);
    normalizedWeights = normalizedWeights.map((w) =>
      Math.max(w / sumWeights, 0.0001),
    );
  }

  // Final normalisasi
  sumWeights = normalizedWeights.reduce((a, b) => a + b, 0);
  normalizedWeights = normalizedWeights.map((w) => w / sumWeights);

  return {
    weights: normalizedWeights,
    xiStar,
    converged,
    iterations,
  };
}

/**
 * Wrapper function yang memilih solver terbaik berdasarkan kondisi
 */
export function solveBWM(
  bestCriteria: CriteriaCode,
  worstCriteria: CriteriaCode,
  boVector: BOVector,
  owVector: OWVector,
): LPSolverResult {
  // Gunakan Newton method sebagai default (lebih cepat untuk BWM)
  const result = solveLPNewton(bestCriteria, worstCriteria, boVector, owVector);

  // Fallback ke gradient descent kalau Newton tidak konvergen
  // Note: xiStar != CR, hanya check converged status
  if (!result.converged) {
    return solveLP(bestCriteria, worstCriteria, boVector, owVector);
  }

  return result;
}
