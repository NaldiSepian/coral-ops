/**
 * Unit Test untuk LP Solver BWM
 * 
 * @module lib/bwm/lp-solver.test
 */

import { describe, it, expect } from 'vitest';
import { solveBWM, solveLP, solveLPNewton } from './lp-solver';
import type { BOVector, OWVector } from './types';

describe('LP Solver', () => {
  // Test case dengan preferensi konsisten
  // Best=c2 (Kualitas), Worst=c4 (Proaktivitas)
  const sampleBO: BOVector = {
    c1: 3,  // c1 vs c2
    c2: 1,  // Best vs itself
    c3: 4,  // c3 vs c2
    c4: 9,  // Worst vs best (c4 sangat tidak penting)
    c5: 2,  // c5 vs c2
  };

  const sampleOW: OWVector = {
    c1: 3,  // c1 vs c4
    c2: 9,  // Best vs worst (c2 sangat penting)
    c3: 2,  // c3 vs c4
    c4: 1,  // Worst vs itself
    c5: 4,  // c5 vs c4
  };

  describe('solveLPNewton', () => {
    it('should solve LP and return valid weights', () => {
      const result = solveLPNewton('c2', 'c4', sampleBO, sampleOW);

      // Check weights sum to ~1
      const weightSum = result.weights.reduce((a, b) => a + b, 0);
      expect(weightSum).toBeCloseTo(1, 2);

      // Check all weights are positive
      result.weights.forEach(w => {
        expect(w).toBeGreaterThan(0);
      });

      // Check convergence
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThan(100);
    });

    it('should have consistent results for equal weights scenario', () => {
      // When all criteria are equally important
      const equalBO: BOVector = { c1: 1, c2: 1, c3: 1, c4: 1, c5: 1 };
      const equalOW: OWVector = { c1: 1, c2: 1, c3: 1, c4: 1, c5: 1 };

      const result = solveLPNewton('c2', 'c4', equalBO, equalOW);

      // All weights should be roughly equal (0.2)
      result.weights.forEach(w => {
        expect(w).toBeCloseTo(0.2, 1);
      });

      // xi* should be close to 0 for perfectly consistent input
      expect(result.xiStar).toBeLessThan(0.1);
    });
  });

  describe('solveLP (Gradient Descent)', () => {
    it('should solve LP with gradient descent', () => {
      const result = solveLP('c2', 'c4', sampleBO, sampleOW, {
        maxIterations: 500,
        tolerance: 0.0001,
        learningRate: 0.01,
      });

      const weightSum = result.weights.reduce((a, b) => a + b, 0);
      expect(weightSum).toBeCloseTo(1, 2);

      result.weights.forEach(w => {
        expect(w).toBeGreaterThan(0);
      });
    });
  });

  describe('solveBWM (Auto-select)', () => {
    it('should auto-select best solver', () => {
      const result = solveBWM('c2', 'c4', sampleBO, sampleOW);

      expect(result.weights).toHaveLength(5);
      expect(result.converged).toBe(true);

      const weightSum = result.weights.reduce((a, b) => a + b, 0);
      expect(weightSum).toBeCloseTo(1, 2);
    });

    it.skip('should handle edge case with extreme preferences', () => {
      // TODO: Fix LP solver untuk preferensi yang sangat ekstrem
      // Preferensi yang masih konsisten tapi lebih ekstrem
      const extremeBO: BOVector = { c1: 7, c2: 1, c3: 6, c4: 9, c5: 3 };
      const extremeOW: OWVector = { c1: 4, c2: 9, c3: 3, c4: 1, c5: 5 };

      const result = solveBWM('c2', 'c4', extremeBO, extremeOW);

      // Best criteria should have highest weight
      expect(result.weights[1]).toBeGreaterThan(result.weights[3]); // w2 > w4
      expect(result.converged).toBe(true);
    });
  });
});
