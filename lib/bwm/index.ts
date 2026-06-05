/**
 * BWM (Best-Worst Method) Engine - Public API
 * 
 * Export semua fungsi dan types untuk penggunaan di seluruh aplikasi
 * 
 * @module lib/bwm
 * @example
 * ```typescript
 * import { calculateBWM, parsePreferensi } from '@/lib/bwm';
 * 
 * const preferensi = parsePreferensi(dbPreferensi);
 * const result = calculateBWM(input, preferensi);
 * ```
 */

// Types
export type {
  TunjanganLisensi,
  PreferensiBWM,
  PerhitunganBWM,
  GajiTeknisi,
  BWMInput,
  BWMResult,
  ParsedPreferensi,
  BOVector,
  OWVector,
  CriteriaCode,
  CreatePreferensiRequest,
  CalculateBWMRequest,
  FinalizePerhitunganRequest,
  BatchBWMResult,
} from './types';

// Error Classes (export sebagai value)
export { BWMError, BWMErrorCode } from './types';

// Constants
export {
  CRITERIA_CODES,
  CRITERIA_NAMES,
  PREFERENSI_SCALE,
} from './types';

// Main Calculator
export {
  calculateBWM,
  batchCalculateBWM,
  parsePreferensi,
  calculateWSM,
  calculateTunjangan,
  formatBWMResult,
  calculateRelativeScore,
} from './calculator';

// LP Solver
export {
  solveBWM,
  solveLP,
  solveLPNewton,
  type LPSolverResult,
} from './lp-solver';

// Normalization
export {
  minMaxNormalize,
  normalizeAllCriteria,
  batchNormalize,
  batchNormalizeWithDynamicRanges,
  calculateBatchRanges,
  validateRawValues,
  calculateKompetensiValue,
  denormalize,
  CRITERIA_RANGES,
  CRITERIA_DESCRIPTIONS,
  type NormalizedCriteria,
} from './normalization';

// Consistency
export {
  calculateCR,
  validateConsistency,
  validateVectors,
  formatCR,
  CR_THRESHOLD,
  type ConsistencyResult,
} from './consistency';
