/**
 * Consistency Check untuk BWM (Best-Worst Method)
 * 
 * Menghitung Consistency Ratio (CR) dan memvalidasi konsistensi
 * preferensi dari decision maker
 * 
 * @module lib/bwm/consistency
 * @see RINGKASAN.md - Step 5: Menghitung Consistency Ratio
 */

import type { CriteriaCode, BOVector, OWVector } from './types';

const CRITERIA_CODES: CriteriaCode[] = ['c1', 'c2', 'c3', 'c4', 'c5'];

/**
 * Threshold CR (Consistency Ratio) yang dianggap konsisten
 * Berdasarkan proposal: CR ≤ 0.10 dianggap konsisten
 */
export const CR_THRESHOLD = 0.10;

/**
 * Hasil perhitungan konsistensi
 */
export interface ConsistencyResult {
  /** Consistency Ratio */
  cr: number;
  /** xi* (ketidakkonsistenan minimal) */
  xiStar: number;
  /** Apakah preferensi konsisten */
  isConsistent: boolean;
  /** Jumlah kriteria */
  n: number;
}

/**
 * Hitung Consistency Ratio (CR) untuk BWM
 * 
 * Rumus: CR = xi* / Consistency Index
 * 
 * Dimana Consistency Index (CI) adalah nilai xi* maksimum yang mungkin
 * untuk kombinasi best-worst dan a_BW tertentu.
 * 
 * @param xiStar - Nilai xi* dari LP solver
 * @param bestCriteria - Kriteria terbaik
 * @param worstCriteria - Kriteria terburuk
 * @param aBW - Nilai preferensi aBW (dari BO vector untuk worst criteria)
 * @returns Consistency Ratio
 */
export function calculateCR(
  xiStar: number,
  bestCriteria: CriteriaCode,
  worstCriteria: CriteriaCode,
  aBW: number
): number {
  // Consistency Index (CI) - nilai xi* maksimum teoritis
  const ci = calculateConsistencyIndex(bestCriteria, worstCriteria, aBW);
  
  if (ci === 0) {
    return 0; // Hindari division by zero
  }
  
  const cr = xiStar / ci;
  
  // Round ke 4 decimal places
  return Math.round(cr * 10000) / 10000;
}

/**
 * Hitung Consistency Index (CI) - xi* maksimum teoritis
 * 
 * @param bestCriteria - Kriteria terbaik
 * @param worstCriteria - Kriteria terburuk
 * @param aBW - Nilai preferensi aBW
 * @returns Consistency Index
 */
function calculateConsistencyIndex(
  bestCriteria: CriteriaCode,
  worstCriteria: CriteriaCode,
  aBW: number
): number {
  const n = 5; // Jumlah kriteria
  
  // CI untuk kasus ideal: best vs worst dengan preferensi aBW
  // Rumus: CI = (aBW - 1) / (aBW + 1 - 2 * sqrt(aBW)) * (n - 1)
  
  // Untuk aBW = 1 (semua kriteria sama penting), CI = 0
  if (aBW <= 1) {
    return 0.0001; // Small epsilon untuk menghindari division by zero
  }
  
  // Hitung CI berdasarkan aBW
  // Formula dari Rezaei (2015): CI = max(xi*) untuk kombinasi best-worst
  const sqrtABW = Math.sqrt(aBW);
  const denominator = aBW + 1 - 2 * sqrtABW;
  
  if (denominator === 0) {
    return 0.0001;
  }
  
  const ci = ((aBW - 1) / denominator) * (n - 1);
  
  // Lookup table untuk CI (valuasi yang sudah terbukti dari paper Rezaei)
  const ciTable: Record<number, number> = {
    1: 0.00,
    2: 0.44,
    3: 1.00,
    4: 1.63,
    5: 2.30,
    6: 3.00,
    7: 3.73,
    8: 4.47,
    9: 5.23,
  };
  
  // Use lookup table kalau ada, otherwise use calculated value
  const floorABW = Math.floor(aBW);
  const lookupCI = ciTable[floorABW] || ci;
  
  return lookupCI;
}

/**
 * Validasi konsistensi preferensi
 * 
 * @param cr - Consistency Ratio
 * @returns Object dengan status konsistensi
 */
export function validateConsistency(cr: number): {
  isConsistent: boolean;
  message: string;
  level: 'high' | 'medium' | 'low';
} {
  if (cr <= 0.1) {
    return {
      isConsistent: true,
      message: 'Konsistensi sangat tinggi (CR ≤ 0.1)',
      level: 'high',
    };
  } else if (cr <= CR_THRESHOLD) {
    return {
      isConsistent: true,
      message: `Konsistensi cukup (CR ≤ ${CR_THRESHOLD})`,
      level: 'medium',
    };
  } else {
    return {
      isConsistent: false,
      message: `Konsistensi rendah (CR > ${CR_THRESHOLD}). Pertimbangkan untuk revisi preferensi.`,
      level: 'low',
    };
  }
}

/**
 * Hitung xi* maksimum teoritis untuk validasi
 * 
 * @param boVector - Best-to-Others vector
 * @param owVector - Others-to-Worst vector
 * @returns xi* teoritis
 */
export function calculateTheoreticalXiStar(
  boVector: BOVector,
  owVector: OWVector,
  bestCriteria: CriteriaCode,
  worstCriteria: CriteriaCode
): number {
  const bestIndex = CRITERIA_CODES.indexOf(bestCriteria);
  const worstIndex = CRITERIA_CODES.indexOf(worstCriteria);
  
  // xi* teoritis terjadi ketika bobot optimal dihitung
  // dari persamaan: wB = aBW * wW
  
  const boValues = CRITERIA_CODES.map(c => boVector[c]);
  const aBW = boValues[worstIndex]; // aBW adalah preferensi best terhadap worst
  
  // Untuk kasus ideal dengan 2 kriteria
  const xiTheoretical = (aBW - 1) / (aBW + 1);
  
  return xiTheoretical;
}

/**
 * Validasi BO dan OW vectors sebelum perhitungan
 * 
 * @param boVector - Best-to-Others vector
 * @param owVector - Others-to-Worst vector
 * @returns Array error message jika ada inconsistency
 */
export function validateVectors(
  boVector: BOVector,
  owVector: OWVector,
  bestCriteria: CriteriaCode,
  worstCriteria: CriteriaCode
): string[] {
  const errors: string[] = [];
  
  // 1. Validasi: aBB harus = 1 (best terhadap dirinya sendiri)
  const boBestValue = boVector[bestCriteria];
  if (boBestValue !== 1) {
    errors.push(`aB${bestCriteria} harus = 1 (kriteria best terhadap dirinya sendiri)`);
  }
  
  // 2. Validasi: aWW harus = 1 (worst terhadap dirinya sendiri)
  const owWorstValue = owVector[worstCriteria];
  if (owWorstValue !== 1) {
    errors.push(`a${worstCriteria}W harus = 1 (kriteria worst terhadap dirinya sendiri)`);
  }
  
  // 3. Validasi: aBW * aWB >= 1 (consistency condition)
  const aBW = boVector[worstCriteria];
  const aWB = owVector[bestCriteria];
  if (aBW * aWB < 1) {
    errors.push(`Inconsistency: aBW * aWB = ${aBW * aWB} < 1. Harus >= 1.`);
  }
  
  // 4. Validasi: range nilai 1-9
  const checkRange = (value: number, name: string) => {
    if (value < 1 || value > 9) {
      errors.push(`${name} = ${value} di luar range 1-9`);
    }
  };
  
  CRITERIA_CODES.forEach(c => {
    checkRange(boVector[c], `BO.${c}`);
    checkRange(owVector[c], `OW.${c}`);
  });
  
  return errors;
}

/**
 * Format CR untuk display
 * 
 * @param cr - Consistency Ratio
 * @returns String terformat
 */
export function formatCR(cr: number): string {
  return cr.toFixed(4);
}
