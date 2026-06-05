/**
 * Types & Interfaces untuk BWM (Best-Worst Method) Engine
 * 
 * @module lib/bwm/types
 * @description TypeScript definitions untuk sistem SPK penggajian berbasis BWM
 */

// ============================================
// KONSTANTA & ENUM
// ============================================

export const CRITERIA_CODES = ['c1', 'c2', 'c3', 'c4', 'c5'] as const;
export type CriteriaCode = typeof CRITERIA_CODES[number];

export const CRITERIA_NAMES: Record<CriteriaCode, string> = {
  c1: 'Kecepatan Penyelesaian',
  c2: 'Kualitas Laporan',
  c3: 'Kepatuhan Laporan',
  c4: 'Proaktivitas',
  c5: 'Kompetensi Teknisi',
};

export const PREFERENSI_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type PreferensiScale = typeof PREFERENSI_SCALE[number];

// ============================================
// DATABASE TYPES (Supabase)
// ============================================

export interface TunjanganLisensi {
  level: string;
  tunjangan_jabatan: number;
  created_at: string;
  updated_at: string;
}

export interface PreferensiBWM {
  id: string;
  nama: string;
  best_criteria: CriteriaCode;
  worst_criteria: CriteriaCode;
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
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PerhitunganBWM {
  id: string;
  penugasan_id: number;
  teknisi_id: string;
  preferensi_id: string | null;
  // Nilai mentah
  c1_kecepatan: number | null;
  c2_kualitas: number | null;
  c3_kepatuhan: number | null;
  c4_proaktivitas: number | null;
  c5_kompetensi: number | null;
  // Normalisasi
  v1: number | null;
  v2: number | null;
  v3: number | null;
  v4: number | null;
  v5: number | null;
  // Bobot
  w1: number | null;
  w2: number | null;
  w3: number | null;
  w4: number | null;
  w5: number | null;
  // Konsistensi
  xi_star: number | null;
  cr: number | null;
  // Hasil
  skor_akhir: number | null;
  tunjangan_didapat: number | null;
  // Status
  status: 'draft' | 'final';
  finalisasi_oleh: string | null;
  finalisasi_pada: string | null;
  created_at: string;
}

export interface GajiTeknisi {
  id: string;
  teknisi_id: string;
  penugasan_id: number;
  periode_mulai: string | null;
  periode_selesai: string | null;
  tunjangan_jabatan: number;
  bonus_bwm: number;
  total_gaji: number;
  status: 'draft' | 'disetujui' | 'dibayar';
  disetujui_oleh: string | null;
  disetujui_pada: string | null;
  dibayar_pada: string | null;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// BWM CALCULATION TYPES
// ============================================

/** Input untuk perhitungan BWM per teknisi */
export interface BWMInput {
  teknisiId: string;
  penugasanId: number;
  // Nilai mentah kriteria (sebelum normalisasi)
  rawValues: {
    c1_kecepatan: number;     // % on-time (0-100)
    c2_kualitas: number;      // % laporan approved (0-100)
    c3_kepatuhan: number;     // % laporan on-time (0-100)
    c4_proaktivitas: number;  // count kendala
    c5_kompetensi: number;    // nilai dari level lisensi
  };
  // Plafon bonus untuk project ini
  plafonBonus: number;
}

/** Vector Best-to-Others (BO) */
export interface BOVector {
  c1: PreferensiScale;
  c2: PreferensiScale;
  c3: PreferensiScale;
  c4: PreferensiScale;
  c5: PreferensiScale;
}

/** Vector Others-to-Worst (OW) */
export interface OWVector {
  c1: PreferensiScale;
  c2: PreferensiScale;
  c3: PreferensiScale;
  c4: PreferensiScale;
  c5: PreferensiScale;
}

/** Hasil perhitungan BWM */
export interface BWMResult {
  // Bobot optimal
  weights: {
    w1: number;
    w2: number;
    w3: number;
    w4: number;
    w5: number;
  };
  // Nilai ternormalisasi (0-100)
  normalizedValues: {
    v1: number;
    v2: number;
    v3: number;
    v4: number;
    v5: number;
  };
  // Konsistensi
  xiStar: number;
  cr: number;
  isConsistent: boolean;
  // Skor akhir
  skorAkhir: number;  // 0-100
  tunjanganDidapat: number;  // dalam rupiah
}

/** Preferensi BWM yang sudah diparse ke BO/OW vectors */
export interface ParsedPreferensi {
  id: string;
  bestCriteria: CriteriaCode;
  worstCriteria: CriteriaCode;
  boVector: BOVector;
  owVector: OWVector;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreatePreferensiRequest {
  nama: string;
  best_criteria: CriteriaCode;
  worst_criteria: CriteriaCode;
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
}

export interface CalculateBWMRequest {
  penugasanId: number;
  preferensiId?: string; // Kalau tidak diisi, pakai preferensi aktif
}

export interface FinalizePerhitunganRequest {
  perhitunganId: string;
  keterangan?: string;
}

// ============================================
// ERROR TYPES
// ============================================

export enum BWMErrorCode {
  PREFERENSI_NOT_FOUND = 'PREFERENSI_NOT_FOUND',
  PREFERENSI_INCONSISTENT = 'PREFERENSI_INCONSISTENT',
  PENUGASAN_NOT_FOUND = 'PENUGASAN_NOT_FOUND',
  PENUGASAN_NOT_COMPLETE = 'PENUGASAN_NOT_COMPLETE',
  TEKNISI_NOT_FOUND = 'TEKNISI_NOT_FOUND',
  ALREADY_CALCULATED = 'ALREADY_CALCULATED',
  INVALID_INPUT = 'INVALID_INPUT',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
}

export class BWMError extends Error {
  constructor(
    public code: BWMErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BWMError';
  }
}

// ============================================
// UTILITY TYPES
// ============================================

/** Criteria dengan nilai min/max untuk normalisasi */
export interface CriteriaRange {
  code: CriteriaCode;
  name: string;
  min: number;
  max: number;
}

/** Status BWM untuk penugasan */
export type BwmStatus = 'belum_dihitung' | 'draft' | 'final';

/** Hasil perhitungan untuk multiple teknisi */
export interface BatchBWMResult {
  penugasanId: number;
  teknisiCount: number;
  results: PerhitunganBWM[];
  errors: Array<{ teknisiId: string; error: string }>;
}
