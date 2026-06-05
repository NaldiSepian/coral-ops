/**
 * Unit Test untuk BWM Calculator (Full Integration)
 * 
 * @module lib/bwm/calculator.test
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBWM,
  parsePreferensi,
  calculateWSM,
  calculateTunjangan,
  formatBWMResult,
  calculateRelativeScore,
  batchCalculateBWM,
} from './calculator';
import type { BWMInput, ParsedPreferensi } from './types';

describe('BWM Calculator', () => {
  // Sample preferensi yang konsisten (simulasi dari database)
  // Best = c2 (Kualitas), Worst = c4 (Proaktivitas)
  const samplePreferensiDB = {
    id: 'pref-001',
    best_criteria: 'c2',
    worst_criteria: 'c4',
    bo_c1: 3,  // c1 dibanding c2: c1 sedikit kurang penting dari c2
    bo_c2: 1,  // best vs itself = 1 (wajib)
    bo_c3: 4,  // c3 lebih tidak penting dari c2
    bo_c4: 9,  // worst vs best: c4 sangat tidak penting dibanding c2
    bo_c5: 2,  // c5 hampir sama pentingnya dengan c2
    ow_c1: 3,  // c1 vs worst(c4): c1 lebih penting dari c4
    ow_c2: 9,  // best vs worst: c2 sangat penting dibanding c4
    ow_c3: 2,  // c3 vs c4: c3 lebih penting dari c4
    ow_c4: 1,  // worst vs itself = 1 (wajib)
    ow_c5: 4,  // c5 vs c4: c5 lebih penting dari c4
  };

  const parsedPreferensi = parsePreferensi(samplePreferensiDB);

  describe('parsePreferensi', () => {
    it('should parse database preferensi to BO/OW vectors', () => {
      expect(parsedPreferensi.id).toBe('pref-001');
      expect(parsedPreferensi.bestCriteria).toBe('c2');
      expect(parsedPreferensi.worstCriteria).toBe('c4');
      expect(parsedPreferensi.boVector.c2).toBe(1); // Best vs itself = 1
      expect(parsedPreferensi.owVector.c4).toBe(1); // Worst vs itself = 1
    });
  });

  describe('calculateWSM', () => {
    it('should calculate weighted sum correctly', () => {
      const weights = [0.3, 0.25, 0.2, 0.15, 0.1];
      const values = [80, 90, 70, 60, 85];

      // Si = 0.3*80 + 0.25*90 + 0.2*70 + 0.15*60 + 0.1*85
      // = 24 + 22.5 + 14 + 9 + 8.5 = 78
      const result = calculateWSM(weights, values);
      expect(result).toBe(78);
    });

    it('should handle equal weights', () => {
      const weights = [0.2, 0.2, 0.2, 0.2, 0.2];
      const values = [100, 100, 100, 100, 100];

      const result = calculateWSM(weights, values);
      expect(result).toBe(100);
    });

    it('should throw error for mismatched array lengths', () => {
      expect(() => calculateWSM([0.2, 0.3], [80, 90, 70])).toThrow(
        'Weights dan normalizedValues harus memiliki 5 elemen'
      );
    });
  });

  describe('calculateTunjangan', () => {
    it('should calculate tunjangan correctly (absolute)', () => {
      const skor = 75;
      const plafon = 2000000; // 2 juta

      // Tunjangan = 75/100 * 2jt = 1.5jt
      const result = calculateTunjangan(skor, plafon);
      expect(result).toBe(1500000);
    });

    it('should return 0 for zero score', () => {
      const result = calculateTunjangan(0, 2000000);
      expect(result).toBe(0);
    });

    it('should return partial plafon for score < 100', () => {
      const result = calculateTunjangan(85, 2000000);
      // 85/100 * 2jt = 1.7jt
      expect(result).toBe(1700000);
    });

    it('should calculate proportionally for any score', () => {
      const skor = 65;
      const plafon = 1500000;

      // Tunjangan = 65/100 * 1.5jt = 975,000
      const result = calculateTunjangan(skor, plafon);
      expect(result).toBe(975000);
    });
  });

  describe('calculateBWM (Full Calculation)', () => {
    it('should perform complete BWM calculation', () => {
      const input: BWMInput = {
        teknisiId: 'tek-001',
        penugasanId: 1,
        rawValues: {
          c1_kecepatan: 85,       // 85% on-time
          c2_kualitas: 90,        // 90% approved (best criteria)
          c3_kepatuhan: 95,       // 95% on-time report
          c4_proaktivitas: 8,     // 8 kendala (worst criteria)
          c5_kompetensi: 1000000, // Level 2
        },
        plafonBonus: 2000000,
      };

      const result = calculateBWM(input, parsedPreferensi);

      // Check weights sum to 1
      const weightSum = Object.values(result.weights).reduce((a, b) => a + b, 0);
      expect(weightSum).toBeCloseTo(1, 2);

      // Best criteria (c2) should have highest weight
      expect(result.weights.w2).toBeGreaterThan(result.weights.w4);

      // Check all normalized values are in 0-100
      Object.values(result.normalizedValues).forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      });

      // Check score is in valid range
      expect(result.skorAkhir).toBeGreaterThanOrEqual(0);
      expect(result.skorAkhir).toBeLessThanOrEqual(100);

      // Check tunjangan is calculated
      expect(result.tunjanganDidapat).toBeGreaterThan(0);
      expect(result.tunjanganDidapat).toBeLessThanOrEqual(input.plafonBonus);

      // Check consistency
      expect(result.cr).toBeDefined();
      expect(typeof result.isConsistent).toBe('boolean');
    });

    it('should handle perfect score scenario', () => {
      const input: BWMInput = {
        teknisiId: 'tek-002',
        penugasanId: 1,
        rawValues: {
          c1_kecepatan: 100,      // Perfect
          c2_kualitas: 100,       // Perfect (best criteria)
          c3_kepatuhan: 100,      // Perfect
          c4_proaktivitas: 20,    // Max proaktivitas
          c5_kompetensi: 1500000, // Level 3
        },
        plafonBonus: 2500000,
      };

      const result = calculateBWM(input, parsedPreferensi);

      // Should get high score
      expect(result.skorAkhir).toBeGreaterThan(90);

      // Should get near-max tunjangan
      expect(result.tunjanganDidapat).toBeGreaterThan(2000000);
    });

    it('should handle low performance scenario in batch', () => {
      // Dengan dynamic normalization, single teknisi = batch dengan 1 elemen
      // min=max → semua nilai = 100 (terbaik dalam batch sendiri)
      // Untuk test low performance, butuh batch dengan multiple teknisi
      const inputs: BWMInput[] = [
        {
          teknisiId: 'tek-001',
          penugasanId: 1,
          rawValues: {
            c1_kecepatan: 95,       // High
            c2_kualitas: 90,        // High
            c3_kepatuhan: 85,       // High
            c4_proaktivitas: 15,    // High
            c5_kompetensi: 1500000, // Level 3
          },
          plafonBonus: 2000000,
        },
        {
          teknisiId: 'tek-002',
          penugasanId: 1,
          rawValues: {
            c1_kecepatan: 30,       // Low
            c2_kualitas: 40,        // Low
            c3_kepatuhan: 50,       // Medium-low
            c4_proaktivitas: 0,     // No proaktivitas
            c5_kompetensi: 500000,  // Level 1
          },
          plafonBonus: 2000000,
        },
      ];

      const results = batchCalculateBWM(inputs, parsedPreferensi);
      const lowPerformer = results.find(r => r.input.teknisiId === 'tek-002');

      // Low performer should get lower score than high performer
      expect(lowPerformer?.result.skorAkhir).toBeLessThan(results[0].result.skorAkhir);
      expect(lowPerformer?.result.tunjanganDidapat).toBeLessThan(results[0].result.tunjanganDidapat);
    });
  });

  describe('formatBWMResult', () => {
    it('should format result for display', () => {
      const result = calculateBWM(
        {
          teknisiId: 'tek-001',
          penugasanId: 1,
          rawValues: {
            c1_kecepatan: 80,
            c2_kualitas: 90,
            c3_kepatuhan: 85,
            c4_proaktivitas: 5,
            c5_kompetensi: 1000000,
          },
          plafonBonus: 2000000,
        },
        parsedPreferensi
      );

      const formatted = formatBWMResult(result);

      // Check weights are formatted as percentages
      expect(formatted.weights.w1).toContain('%');
      expect(formatted.weights.w2).toContain('%');

      // Check tunjangan is formatted as currency
      expect(formatted.tunjanganDidapat).toContain('Rp');

      // Check score format
      expect(formatted.skorAkhir).toContain('/100');
    });
  });

  describe('calculateRelativeScore', () => {
    it('should calculate relative score correctly', () => {
      const skorTeknisi = 75;
      const skorMaksimal = 90;

      const relative = calculateRelativeScore(skorTeknisi, skorMaksimal);
      // 75/90 * 100 = 83.33%
      expect(relative).toBeCloseTo(83.33, 1);
    });

    it('should return 100 for max score', () => {
      const relative = calculateRelativeScore(90, 90);
      expect(relative).toBe(100);
    });

    it('should handle zero max score', () => {
      const relative = calculateRelativeScore(50, 0);
      expect(relative).toBe(0);
    });
  });

  describe('batchCalculateBWM', () => {
    it('should calculate for multiple technicians', () => {
      const inputs: BWMInput[] = [
        {
          teknisiId: 'tek-001',
          penugasanId: 1,
          rawValues: {
            c1_kecepatan: 90,
            c2_kualitas: 95,
            c3_kepatuhan: 100,
            c4_proaktivitas: 8,
            c5_kompetensi: 1000000,
          },
          plafonBonus: 2000000,
        },
        {
          teknisiId: 'tek-002',
          penugasanId: 1,
          rawValues: {
            c1_kecepatan: 70,
            c2_kualitas: 75,
            c3_kepatuhan: 80,
            c4_proaktivitas: 4,
            c5_kompetensi: 1500000,
          },
          plafonBonus: 2000000,
        },
      ];

      const results = batchCalculateBWM(inputs, parsedPreferensi);

      expect(results).toHaveLength(2);
      expect(results[0].result.skorAkhir).toBeDefined();
      expect(results[1].result.skorAkhir).toBeDefined();

      // Teknisi 1 should have higher score
      expect(results[0].result.skorAkhir).toBeGreaterThan(results[1].result.skorAkhir);
    });

    it('should handle errors gracefully', () => {
      const inputs: BWMInput[] = [
        {
          teknisiId: 'tek-001',
          penugasanId: 1,
          rawValues: {
            c1_kecepatan: 150, // Invalid: > 100
            c2_kualitas: 90,
            c3_kepatuhan: 100,
            c4_proaktivitas: 5,
            c5_kompetensi: 1000000,
          },
          plafonBonus: 2000000,
        },
      ];

      const results = batchCalculateBWM(inputs, parsedPreferensi);

      expect(results).toHaveLength(1);
      expect(results[0].error).toBeDefined();
      expect(results[0].error).toContain('Validasi gagal');
    });
  });
});
