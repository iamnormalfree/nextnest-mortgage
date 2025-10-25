// ABOUTME: Tests for property loan calculation helpers (max loan, tenure limits, caveat messages)

import { describe, it, expect } from '@jest/globals';
import {
  calculateMaxLoan,
  getPropertyTenureLimit,
  calculateMaxTenure,
  getTenureMessage,
  generatePropertyCaveats
} from '@/lib/calculations/property-loan-helpers';

describe('property-loan-helpers', () => {
  describe('calculateMaxLoan', () => {
    it('calculates 75% LTV for first home', () => {
      expect(calculateMaxLoan(1000000, false)).toBe(750000);
    });

    it('calculates 45% LTV for second home', () => {
      expect(calculateMaxLoan(1000000, true)).toBe(450000);
    });

    it('floors the result to integer', () => {
      expect(calculateMaxLoan(1000001, false)).toBe(750000);
    });
  });

  describe('getPropertyTenureLimit', () => {
    it('returns 25 years for HDB properties', () => {
      expect(getPropertyTenureLimit('hdb-resale')).toBe(25);
      expect(getPropertyTenureLimit('hdb-new')).toBe(25);
    });

    it('returns 30 years for private properties (75% LTV tier)', () => {
      expect(getPropertyTenureLimit('private-resale')).toBe(30);
      expect(getPropertyTenureLimit('ec-new')).toBe(30);
      expect(getPropertyTenureLimit('landed-new')).toBe(30);
    });

    it('defaults to 30 years for unknown types', () => {
      expect(getPropertyTenureLimit('unknown')).toBe(30);
    });
  });

  describe('calculateMaxTenure', () => {
    it('returns minimum of age limit and property limit', () => {
      expect(calculateMaxTenure(40, 'hdb-resale')).toBe(25); // min(25, 25)
      expect(calculateMaxTenure(35, 'hdb-resale')).toBe(25); // min(30, 25)
      expect(calculateMaxTenure(46, 'private-resale')).toBe(19); // min(19, 30)
      expect(calculateMaxTenure(25, 'private-resale')).toBe(30); // min(40, 30) - CORRECTED from 35
    });
  });

  describe('getTenureMessage - improved transparency', () => {
    it('shows both limits when they are equal (HDB, age 40)', () => {
      // ageLimit=25, propertyLimit=25, maxTenure=25
      const message = getTenureMessage(25, 25, 25, 'hdb-resale', 40);
      expect(message).toBe('Max tenure: 25 years (HDB cap 25y, age limit 25y)');
    });

    it('shows both limits when property restricts (HDB, age 35)', () => {
      // ageLimit=30, propertyLimit=25, maxTenure=25
      const message = getTenureMessage(25, 30, 25, 'hdb-resale', 35);
      expect(message).toBe('Max tenure: 25 years (HDB cap 25y; age allows 30y)');
    });

    it('shows both limits when age restricts (Private, age 46)', () => {
      // ageLimit=19, propertyLimit=30, maxTenure=19 - CORRECTED from 35
      const message = getTenureMessage(19, 19, 30, 'private-resale', 46);
      expect(message).toBe('Max tenure: 19 years (age limit, ends at 65; private property cap 30y)');
    });

    it('shows both limits when property restricts (Private, age 25)', () => {
      // ageLimit=40, propertyLimit=30, maxTenure=30 - CORRECTED from 35
      const message = getTenureMessage(30, 40, 30, 'private-resale', 25);
      expect(message).toBe('Max tenure: 30 years (private property cap 30y; age allows 40y)');
    });

    it('handles EC properties correctly when property restricts', () => {
      // ageLimit=40, propertyLimit=30, maxTenure=30 - CORRECTED from 35
      const message = getTenureMessage(30, 40, 30, 'ec-new', 25);
      expect(message).toBe('Max tenure: 30 years (private property cap 30y; age allows 40y)');
    });

    it('handles edge case: very young borrower with HDB', () => {
      // ageLimit=45, propertyLimit=25, maxTenure=25
      const message = getTenureMessage(25, 45, 25, 'hdb-new', 20);
      expect(message).toBe('Max tenure: 25 years (HDB cap 25y; age allows 45y)');
    });

    it('handles edge case: older borrower with private property', () => {
      // ageLimit=10, propertyLimit=30, maxTenure=10 - CORRECTED from 35
      const message = getTenureMessage(10, 10, 30, 'private-new', 55);
      expect(message).toBe('Max tenure: 10 years (age limit, ends at 65; private property cap 30y)');
    });
  });

  describe('generatePropertyCaveats', () => {
    it('includes improved tenure message for HDB with property restriction', () => {
      const result = generatePropertyCaveats(500000, 'resale', 'hdb-resale', 35, false);
      expect(result.maxLoan).toBe(375000);
      expect(result.caveats).toContain('Max tenure: 25 years (HDB cap 25y; age allows 30y)');
    });

    it('includes improved tenure message for private with age restriction', () => {
      const result = generatePropertyCaveats(1000000, 'resale', 'private-resale', 46, false);
      expect(result.maxLoan).toBe(750000);
      expect(result.caveats).toContain('Max tenure: 19 years (age limit, ends at 65; private property cap 30y)');
    });

    it('includes other caveats correctly', () => {
      const result = generatePropertyCaveats(500000, 'resale', 'hdb-resale', 35, false);
      expect(result.caveats).toContain('Can use CPF for down payment');
      expect(result.caveats).toContain('Income cap applies (MSR 30% + TDSR 55%)');
    });
  });
});
