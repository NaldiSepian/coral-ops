/**
 * Unit Test untuk Normalization BWM
 * 
 * @module lib/bwm/normalization.test
 */

import { describe, it, expect } from 'vitest';
import {
  minMaxNormalize,
  normalizeAllCriteria,
  validateRawValues,
  batchNormalize,
  CRITERIA_RANGES,
} from './normalization';

describe('Normalization', () => {
  describe('minMaxNormalize', () => {
    it('should normalize value to 0-100 scale', () => {
      // 50 dalam range 0-100 = 50
      expect(minMaxNormalize(50, 0, 100)).toBe(50);

      // 75 dalam range 0-100 = 75
      expect(minMaxNormalize(75, 0, 100)).toBe(75);

      // 0 dalam range 0-100 = 0
      expect(minMaxNormalize(0, 0, 100)).toBe(0);

      // 100 dalam range 0-100 = 100
      expect(minMaxNormalize(100, 0, 100)).toBe(100);
    });

    it('should allow out-of-range values (dynamic normalization)', () => {
      // Dynamic normalization: tidak clamp, formula langsung
      // Value > max akan > 100
      expect(minMaxNormalize(150, 0, 100)).toBe(150);

      // Value < min akan < 0
      expect(minMaxNormalize(-10, 0, 100)).toBe(-10);
    });

    it('should return 100 (max) when all values equal', () => {
      // Edge case: min === max = semua nilai sama = 100 (terbaik)
      expect(minMaxNormalize(50, 50, 50)).toBe(100);
      expect(minMaxNormalize(80, 80, 80)).toBe(100);
    });

    it('should handle custom ranges', () => {
      // Kompetensi: range 0-1.5jt
      const tunjangan = 1000000; // 1 juta
      const normalized = minMaxNormalize(tunjangan, 0, 1500000);
      expect(normalized).toBeCloseTo(66.67, 1); // 66.67%
    });
  });

  describe('normalizeAllCriteria', () => {
    it('should normalize all 5 criteria correctly', () => {
      const rawValues = {
        c1_kecepatan: 80,      // 80% on-time
        c2_kualitas: 90,       // 90% approved
        c3_kepatuhan: 100,     // 100% on-time report
        c4_proaktivitas: 5,    // 5 kendala dilaporkan
        c5_kompetensi: 1000000, // Level 2 (1 juta)
      };

      const result = normalizeAllCriteria(rawValues);

      // Check all values are in 0-100 range
      expect(result.v1).toBe(80); // 80/100 * 100
      expect(result.v2).toBe(90); // 90/100 * 100
      expect(result.v3).toBe(100); // 100/100 * 100
      expect(result.v4).toBe(25); // 5/20 * 100
      expect(result.v5).toBeCloseTo(66.67, 1); // 1jt/1.5jt * 100
    });

    it('should handle zero values', () => {
      const rawValues = {
        c1_kecepatan: 0,
        c2_kualitas: 0,
        c3_kepatuhan: 0,
        c4_proaktivitas: 0,
        c5_kompetensi: 0,
      };

      const result = normalizeAllCriteria(rawValues);

      expect(result.v1).toBe(0);
      expect(result.v2).toBe(0);
      expect(result.v3).toBe(0);
      expect(result.v4).toBe(0);
      expect(result.v5).toBe(0);
    });

    it('should handle max values', () => {
      const rawValues = {
        c1_kecepatan: 100,
        c2_kualitas: 100,
        c3_kepatuhan: 100,
        c4_proaktivitas: 20,     // Max proaktivitas
        c5_kompetensi: 1500000,  // Max kompetensi (Level 3)
      };

      const result = normalizeAllCriteria(rawValues);

      expect(result.v1).toBe(100);
      expect(result.v2).toBe(100);
      expect(result.v3).toBe(100);
      expect(result.v4).toBe(100);
      expect(result.v5).toBe(100);
    });
  });

  describe('validateRawValues', () => {
    it('should return empty array for valid values', () => {
      const rawValues = {
        c1_kecepatan: 50,
        c2_kualitas: 75,
        c3_kepatuhan: 100,
        c4_proaktivitas: 3,
        c5_kompetensi: 500000,
      };

      const errors = validateRawValues(rawValues);
      expect(errors).toHaveLength(0);
    });

    it('should detect out-of-range percentage values', () => {
      const rawValues = {
        c1_kecepatan: 150, // Invalid: > 100
        c2_kualitas: -10,  // Invalid: < 0
        c3_kepatuhan: 50,
        c4_proaktivitas: 3,
        c5_kompetensi: 500000,
      };

      const errors = validateRawValues(rawValues);
      expect(errors).toContain('c1_kecepatan harus antara 0-100');
      expect(errors).toContain('c2_kualitas harus antara 0-100');
    });

    it('should detect negative values for c4 and c5', () => {
      const rawValues = {
        c1_kecepatan: 50,
        c2_kualitas: 75,
        c3_kepatuhan: 100,
        c4_proaktivitas: -1, // Invalid: negative
        c5_kompetensi: -100, // Invalid: negative
      };

      const errors = validateRawValues(rawValues);
      expect(errors).toContain('c4_proaktivitas tidak boleh negatif');
      expect(errors).toContain('c5_kompetensi tidak boleh negatif');
    });
  });

  describe('batchNormalize', () => {
    it('should normalize multiple technicians', () => {
      const inputs = [
        { teknisiId: '1', c1_kecepatan: 80, c2_kualitas: 90, c3_kepatuhan: 100, c4_proaktivitas: 5, c5_kompetensi: 1000000 },
        { teknisiId: '2', c1_kecepatan: 60, c2_kualitas: 70, c3_kepatuhan: 80, c4_proaktivitas: 3, c5_kompetensi: 1500000 },
      ];

      const results = batchNormalize(inputs);

      expect(results).toHaveLength(2);
      expect(results[0].teknisiId).toBe('1');
      expect(results[1].teknisiId).toBe('2');

      // Teknisi 2 should have higher kompetensi score
      expect(results[1].v5).toBeGreaterThan(results[0].v5);
    });
  });

  describe('CRITERIA_RANGES', () => {
    it('should have correct ranges defined', () => {
      expect(CRITERIA_RANGES.c1).toEqual({ min: 0, max: 100 });
      expect(CRITERIA_RANGES.c2).toEqual({ min: 0, max: 100 });
      expect(CRITERIA_RANGES.c3).toEqual({ min: 0, max: 100 });
      expect(CRITERIA_RANGES.c4).toEqual({ min: 0, max: 20 });
      expect(CRITERIA_RANGES.c5).toEqual({ min: 0, max: 1500000 });
    });
  });
});
