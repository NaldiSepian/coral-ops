/**
 * Normalisasi Min-Max untuk BWM
 * 
 * Mengubah nilai mentah kriteria menjadi skala 0-100
 * menggunakan metode Min-Max Normalization
 * 
 * @module lib/bwm/normalization
 * @see RINGKASAN.md - Step 6: Normalisasi Nilai Kriteria
 */

import type { CriteriaCode } from './types';

/**
 * Hasil normalisasi untuk satu kriteria
 */
export interface NormalizedCriteria {
  /** Nilai asli (raw) */
  originalValue: number;
  /** Nilai ternormalisasi (0-100) */
  normalizedValue: number;
  /** Min value untuk kriteria ini */
  min: number;
  /** Max value untuk kriteria ini */
  max: number;
}

/**
 * Konfigurasi range untuk setiap kriteria
 * Semua kriteria bertipe BENEFIT (nilai lebih besar = lebih baik)
 */
export const CRITERIA_RANGES: Record<CriteriaCode, { min: number; max: number }> = {
  c1: { min: 0, max: 100 },    // Kecepatan: % on-time (0-100%)
  c2: { min: 0, max: 100 },    // Kualitas: % approved (0-100%)
  c3: { min: 0, max: 100 },    // Kepatuhan: % on-time report (0-100%)
  c4: { min: 0, max: 20 },     // Proaktivitas: count kendala (0-20)
  c5: { min: 0, max: 1500000 }, // Kompetensi: nilai Rupiah (0-1.5jt)
};

/**
 * Deskripsi kriteria untuk dokumentasi
 */
export const CRITERIA_DESCRIPTIONS: Record<CriteriaCode, string> = {
  c1: 'Kecepatan Penyelesaian (% on-time completion)',
  c2: 'Kualitas Laporan (% laporan approved tanpa revisi)',
  c3: 'Kepatuhan Laporan (% laporan on-time vs expected)',
  c4: 'Proaktivitas (jumlah kendala yang dilaporkan)',
  c5: 'Kompetensi Teknisi (nilai dari level lisensi)',
};

/**
 * Normalisasi nilai menggunakan Min-Max
 * 
 * Rumus: x_ij = (x_ij - min_j) / (max_j - min_j) × 100
 * 
 * @param value - Nilai yang akan dinormalisasi
 * @param min - Nilai minimum untuk kriteria
 * @param max - Nilai maximum untuk kriteria
 * @returns Nilai ternormalisasi (0-100)
 */
export function minMaxNormalize(value: number, min: number, max: number): number {
  // Handle edge case: kalau range 0, semua nilai sama = 100 (terbaik)
  if (max === min) {
    return 100;
  }
  
  // Min-Max normalization ke skala 0-100
  // Tidak perlu clamp, formula sudah handle
  const normalized = ((value - min) / (max - min)) * 100;
  
  // Round ke 2 decimal places
  return Math.round(normalized * 100) / 100;
}

/**
 * Normalisasi semua nilai kriteria untuk satu teknisi
 * 
 * @param rawValues - Nilai mentah 5 kriteria
 * @returns Object dengan nilai ternormalisasi
 */
export function normalizeAllCriteria(rawValues: {
  c1_kecepatan: number;
  c2_kualitas: number;
  c3_kepatuhan: number;
  c4_proaktivitas: number;
  c5_kompetensi: number;
}): {
  v1: number;
  v2: number;
  v3: number;
  v4: number;
  v5: number;
} {
  return {
    v1: minMaxNormalize(rawValues.c1_kecepatan, CRITERIA_RANGES.c1.min, CRITERIA_RANGES.c1.max),
    v2: minMaxNormalize(rawValues.c2_kualitas, CRITERIA_RANGES.c2.min, CRITERIA_RANGES.c2.max),
    v3: minMaxNormalize(rawValues.c3_kepatuhan, CRITERIA_RANGES.c3.min, CRITERIA_RANGES.c3.max),
    v4: minMaxNormalize(rawValues.c4_proaktivitas, CRITERIA_RANGES.c4.min, CRITERIA_RANGES.c4.max),
    v5: minMaxNormalize(rawValues.c5_kompetensi, CRITERIA_RANGES.c5.min, CRITERIA_RANGES.c5.max),
  };
}

/**
 * Denormalisasi: mengembalikan nilai normalisasi ke nilai asli
 * 
 * @param normalizedValue - Nilai ternormalisasi (0-100)
 * @param min - Nilai minimum untuk kriteria
 * @param max - Nilai maximum untuk kriteria
 * @returns Nilai asli
 */
export function denormalize(normalizedValue: number, min: number, max: number): number {
  return ((normalizedValue / 100) * (max - min)) + min;
}

/**
 * Hitung nilai kompetensi (c5) dari level lisensi
 * 
 * @param level - Level lisensi ('Level 1', 'Level 2', 'Level 3')
 * @param tunjanganLisensi - Map level ke tunjangan
 * @returns Nilai kompetensi dalam Rupiah
 */
export function calculateKompetensiValue(
  level: string,
  tunjanganLisensi: Map<string, number>
): number {
  const tunjangan = tunjanganLisensi.get(level) || 0;
  return tunjangan;
}

/**
 * Validasi nilai mentah sebelum normalisasi
 * 
 * @param rawValues - Nilai mentah kriteria
 * @returns Array error message jika ada invalid value
 */
export function validateRawValues(rawValues: {
  c1_kecepatan: number;
  c2_kualitas: number;
  c3_kepatuhan: number;
  c4_proaktivitas: number;
  c5_kompetensi: number;
}): string[] {
  const errors: string[] = [];
  
  if (rawValues.c1_kecepatan < 0 || rawValues.c1_kecepatan > 100) {
    errors.push('c1_kecepatan harus antara 0-100');
  }
  
  if (rawValues.c2_kualitas < 0 || rawValues.c2_kualitas > 100) {
    errors.push('c2_kualitas harus antara 0-100');
  }
  
  if (rawValues.c3_kepatuhan < 0 || rawValues.c3_kepatuhan > 100) {
    errors.push('c3_kepatuhan harus antara 0-100');
  }
  
  if (rawValues.c4_proaktivitas < 0) {
    errors.push('c4_proaktivitas tidak boleh negatif');
  }
  
  if (rawValues.c5_kompetensi < 0) {
    errors.push('c5_kompetensi tidak boleh negatif');
  }
  
  return errors;
}

/**
 * Hitung min/max dari batch untuk normalisasi dinamis
 * Sesuai proposal: min/max dari kelompok teknisi yang dievaluasi
 */
export function calculateBatchRanges(
  allRawValues: Array<{
    c1_kecepatan: number;
    c2_kualitas: number;
    c3_kepatuhan: number;
    c4_proaktivitas: number;
    c5_kompetensi: number;
  }>
): {
  c1: { min: number; max: number };
  c2: { min: number; max: number };
  c3: { min: number; max: number };
  c4: { min: number; max: number };
  c5: { min: number; max: number };
} {
  if (allRawValues.length === 0) {
    throw new Error('Batch tidak boleh kosong');
  }

  const c1Values = allRawValues.map(v => v.c1_kecepatan);
  const c2Values = allRawValues.map(v => v.c2_kualitas);
  const c3Values = allRawValues.map(v => v.c3_kepatuhan);
  const c4Values = allRawValues.map(v => v.c4_proaktivitas);
  const c5Values = allRawValues.map(v => v.c5_kompetensi);

  return {
    c1: { min: Math.min(...c1Values), max: Math.max(...c1Values) },
    c2: { min: Math.min(...c2Values), max: Math.max(...c2Values) },
    c3: { min: Math.min(...c3Values), max: Math.max(...c3Values) },
    c4: { min: Math.min(...c4Values), max: Math.max(...c4Values) },
    c5: { min: Math.min(...c5Values), max: Math.max(...c5Values) },
  };
}

/**
 * Normalisasi dengan dynamic ranges dari batch
 * Step 1: Hitung min/max dari seluruh batch
 * Step 2: Normalisasi masing-masing dengan ranges tersebut
 */
export function batchNormalizeWithDynamicRanges(
  allRawValues: Array<{
    teknisiId: string;
    c1_kecepatan: number;
    c2_kualitas: number;
    c3_kepatuhan: number;
    c4_proaktivitas: number;
    c5_kompetensi: number;
  }>
): Array<{
  teknisiId: string;
  v1: number;
  v2: number;
  v3: number;
  v4: number;
  v5: number;
}> {
  if (allRawValues.length === 0) {
    return [];
  }

  // Step 1: Hitung min/max dari batch
  const ranges = calculateBatchRanges(allRawValues);

  // Step 2: Normalisasi dengan ranges dinamis
  return allRawValues.map(item => ({
    teknisiId: item.teknisiId,
    v1: minMaxNormalize(item.c1_kecepatan, ranges.c1.min, ranges.c1.max),
    v2: minMaxNormalize(item.c2_kualitas, ranges.c2.min, ranges.c2.max),
    v3: minMaxNormalize(item.c3_kepatuhan, ranges.c3.min, ranges.c3.max),
    v4: minMaxNormalize(item.c4_proaktivitas, ranges.c4.min, ranges.c4.max),
    v5: minMaxNormalize(item.c5_kompetensi, ranges.c5.min, ranges.c5.max),
  }));
}

/**
 * @deprecated Gunakan batchNormalizeWithDynamicRanges untuk hasil yang sesuai proposal
 * Batch normalisasi untuk multiple teknisi (menggunakan static ranges)
 */
export function batchNormalize(
  allRawValues: Array<{
    teknisiId: string;
    c1_kecepatan: number;
    c2_kualitas: number;
    c3_kepatuhan: number;
    c4_proaktivitas: number;
    c5_kompetensi: number;
  }>
): Array<{
  teknisiId: string;
  v1: number;
  v2: number;
  v3: number;
  v4: number;
  v5: number;
}> {
  return batchNormalizeWithDynamicRanges(allRawValues);
}
