// ABOUTME: Test for CRITICAL tenure cap fix - 75% LTV should cap non-HDB at 30 years, not 35
// ABOUTME: This test validates Dr Elena v2 rules are correctly applied

import {
  getPropertyTenureLimit,
  calculateMaxTenure
} from '../../lib/calculations/property-loan-helpers';

describe('property-loan-helpers - TENURE CAP FIX', () => {
  describe('getPropertyTenureLimit - 75% LTV tier', () => {
    test('Dr Elena v2: Private properties should cap at 30 years for 75% LTV', () => {
      // Dr Elena v2 Rule: "Apply reduced LTV tier if (non-HDB tenure > 30y)"
      // Therefore, for 75% LTV (base tier), max tenure is 30 years
      expect(getPropertyTenureLimit('private-resale')).toBe(30);
      expect(getPropertyTenureLimit('private-new')).toBe(30);
      expect(getPropertyTenureLimit('private-uc')).toBe(30);
    });

    test('Dr Elena v2: EC properties should cap at 30 years for 75% LTV', () => {
      expect(getPropertyTenureLimit('ec-resale')).toBe(30);
      expect(getPropertyTenureLimit('ec-new')).toBe(30);
    });

    test('Dr Elena v2: Landed properties should cap at 30 years for 75% LTV', () => {
      expect(getPropertyTenureLimit('landed-resale')).toBe(30);
      expect(getPropertyTenureLimit('landed-new')).toBe(30);
    });

    test('Dr Elena v2: Commercial properties should cap at 30 years for 75% LTV', () => {
      expect(getPropertyTenureLimit('commercial')).toBe(30);
    });

    test('Dr Elena v2: HDB should cap at 25 years for 75% LTV (correct)', () => {
      // This is already correct - HDB caps at 25 years
      expect(getPropertyTenureLimit('hdb-resale')).toBe(25);
      expect(getPropertyTenureLimit('hdb-new')).toBe(25);
    });
  });

  describe('calculateMaxTenure - real-world scenarios', () => {
    test('Young buyer (age 25) with private condo: Should cap at 30 years, not 35', () => {
      // Age 25: Age limit = 65 - 25 = 40 years
      // Property limit (75% LTV) = 30 years
      // Result: min(40, 30) = 30 years (NOT 35!)
      expect(calculateMaxTenure(25, 'private-resale')).toBe(30);
    });

    test('Age 30 with EC: Should cap at 30 years, not 35', () => {
      // Age 30: Age limit = 65 - 30 = 35 years
      // Property limit (75% LTV) = 30 years
      // Result: min(35, 30) = 30 years (NOT 35!)
      expect(calculateMaxTenure(30, 'ec-resale')).toBe(30);
    });

    test('Age 34 with landed: Should cap at 30 years, not 31', () => {
      // Age 34: Age limit = 65 - 34 = 31 years
      // Property limit (75% LTV) = 30 years
      // Result: min(31, 30) = 30 years
      expect(calculateMaxTenure(34, 'landed-resale')).toBe(30);
    });
  });
});
