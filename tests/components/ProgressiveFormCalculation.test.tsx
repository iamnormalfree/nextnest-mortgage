// ABOUTME: Tests for ProgressiveFormWithController calculation and progressive disclosure
// ABOUTME: TDD approach - these tests written BEFORE implementation

import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProgressiveFormWithController } from '@/components/forms/ProgressiveFormWithController';
import { calculateMaxLoan, getPropertyTenureLimit, calculateMaxTenure, getTenureMessage, generatePropertyCaveats } from '@/lib/calculations/property-loan-helpers';

describe('Property Loan Calculation Helpers', () => {

  describe('calculateMaxLoan', () => {
    it('returns 75% LTV for first home', () => {
      const maxLoan = calculateMaxLoan(800000, false);
      expect(maxLoan).toBe(600000);
    });

    it('returns 45% LTV for second home', () => {
      const maxLoan = calculateMaxLoan(800000, true);
      expect(maxLoan).toBe(360000);
    });
  });

  describe('getPropertyTenureLimit', () => {
    it('returns 25 years for HDB resale', () => {
      expect(getPropertyTenureLimit('hdb-resale')).toBe(25);
    });

    it('returns 35 years for private condo', () => {
      expect(getPropertyTenureLimit('private-resale')).toBe(35);
    });

    it('returns 35 years for commercial', () => {
      expect(getPropertyTenureLimit('commercial')).toBe(35);
    });
  });

  describe('calculateMaxTenure', () => {
    it('returns age limit when more restrictive than property limit', () => {
      // Age 40, private condo (35yr limit) → 65-40 = 25 years (age more restrictive)
      const tenure = calculateMaxTenure(40, 'private-resale');
      expect(tenure).toBe(25);
    });

    it('returns property limit when more restrictive than age limit', () => {
      // Age 30, HDB (25yr limit) → 65-30 = 35 years, but HDB caps at 25
      const tenure = calculateMaxTenure(30, 'hdb-resale');
      expect(tenure).toBe(25);
    });
  });

  describe('getTenureMessage', () => {
    it('shows age-based message when age is limiting factor', () => {
      // maxTenure=25, ageLimit=25, propertyLimit=35, age=40
      const message = getTenureMessage(25, 25, 35, 'private-resale', 40);
      expect(message).toContain('25 years');
      expect(message).toContain('age 65');
    });

    it('shows HDB limit message when HDB is limiting factor', () => {
      // maxTenure=25, ageLimit=35, propertyLimit=25, age=30
      const message = getTenureMessage(25, 35, 25, 'hdb-resale', 30);
      expect(message).toContain('25 years');
      expect(message).toContain('HDB limit');
    });
  });

  describe('generatePropertyCaveats', () => {
    it('generates correct caveats for private condo, age 40, first home', () => {
      const result = generatePropertyCaveats(800000, 'resale', 'private-resale', 40, false);

      expect(result.maxLoan).toBe(600000);
      expect(result.caveats).toContain('Can use CPF for down payment');
      expect(result.caveats.some(c => c.includes('25 years'))).toBe(true);
      expect(result.caveats.some(c => c.includes('age 65'))).toBe(true);
    });

    it('generates correct caveats for HDB, age 30, first home', () => {
      const result = generatePropertyCaveats(800000, 'resale', 'hdb-resale', 30, false);

      expect(result.maxLoan).toBe(600000);
      expect(result.caveats).toContain('Can use CPF for down payment');
      expect(result.caveats.some(c => c.includes('25 years'))).toBe(true);
      expect(result.caveats.some(c => c.includes('HDB limit'))).toBe(true);
      expect(result.caveats).toContain('Income cap applies (MSR 30% + TDSR 55%)');
    });

    it('generates correct caveats for commercial property', () => {
      const result = generatePropertyCaveats(800000, 'commercial', 'commercial', 35, false);

      expect(result.maxLoan).toBe(600000);
      expect(result.caveats).toContain('⚠️ Cannot use CPF (cash only for down payment)');
      expect(result.caveats).toContain('Higher interest floor (5% vs 4%)');
    });

    it('calculates 45% LTV for second home', () => {
      const result = generatePropertyCaveats(800000, 'resale', 'private-resale', 40, true);

      expect(result.maxLoan).toBe(360000); // 45% of 800k
    });

    it('shows income cap for EC from developer', () => {
      const result = generatePropertyCaveats(800000, 'new-launch', 'ec-new', 35, false);

      expect(result.caveats).toContain('Income cap applies if buying from developer');
    });
  });
});

describe('ProgressiveFormWithController Component', () => {

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
  });

  describe('Progressive Disclosure', () => {
    it('shows property type dropdown only after category selected', () => {
      const { rerender } = render(
        <ProgressiveFormWithController formData={{}} onUpdate={mockOnUpdate} />
      );

      // Property type should not be visible initially
      expect(screen.queryByLabelText(/property type/i)).not.toBeInTheDocument();

      // Select category
      rerender(
        <ProgressiveFormWithController
          formData={{ propertyCategory: 'resale' }}
          onUpdate={mockOnUpdate}
        />
      );

      // Property type should now be visible
      expect(screen.getByLabelText(/property type/i)).toBeInTheDocument();
    });

    it('shows remaining fields only after property type selected', () => {
      const { rerender } = render(
        <ProgressiveFormWithController formData={{}} onUpdate={mockOnUpdate} />
      );

      // Price and age fields should not be visible initially
      expect(screen.queryByLabelText(/property price/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/combined age/i)).not.toBeInTheDocument();

      // Select category and type
      rerender(
        <ProgressiveFormWithController
          formData={{
            propertyCategory: 'resale',
            propertyType: 'private-resale'
          }}
          onUpdate={mockOnUpdate}
        />
      );

      // Fields should now be visible
      expect(screen.getByLabelText(/property price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/combined age/i)).toBeInTheDocument();
    });

    it('filters property types based on selected category', () => {
      render(
        <ProgressiveFormWithController
          formData={{ propertyCategory: 'resale' }}
          onUpdate={mockOnUpdate}
        />
      );

      const propertyTypeSelect = screen.getByLabelText(/property type/i);
      fireEvent.click(propertyTypeSelect);

      // Should show resale-specific options
      expect(screen.getByText('HDB')).toBeInTheDocument();
      expect(screen.getByText('Private Condo')).toBeInTheDocument();
      expect(screen.getByText('Executive Condo (EC)')).toBeInTheDocument();
      expect(screen.getByText('Landed Property')).toBeInTheDocument();
    });

    it('resets property type when category changes', async () => {
      const { rerender } = render(
        <ProgressiveFormWithController
          formData={{
            propertyCategory: 'resale',
            propertyType: 'hdb-resale'
          }}
          onUpdate={mockOnUpdate}
        />
      );

      // Change category
      const categorySelect = screen.getByLabelText(/property category/i);
      fireEvent.change(categorySelect, { target: { value: 'new-launch' } });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith({
          propertyCategory: 'new-launch',
          propertyType: undefined // Should reset type
        });
      });
    });
  });

  describe('Calculation Display', () => {
    it('hides calculation until all fields filled', () => {
      render(
        <ProgressiveFormWithController
          formData={{
            propertyCategory: 'resale',
            propertyType: 'private-resale'
            // Missing price and age
          }}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.queryByText(/you can borrow up to/i)).not.toBeInTheDocument();
    });

    it('shows personalized calculation when all fields filled', () => {
      render(
        <ProgressiveFormWithController
          formData={{
            propertyCategory: 'resale',
            propertyType: 'private-resale',
            propertyPrice: 800000,
            combinedAge: 40,
            isKeepingCurrentProperty: false
          }}
          onUpdate={mockOnUpdate}
        />
      );

      // Should show max loan
      expect(screen.getByText(/\$600,000/)).toBeInTheDocument();

      // Should show personalized caveats
      expect(screen.getByText(/can use cpf for down payment/i)).toBeInTheDocument();
      expect(screen.getByText(/25 years/i)).toBeInTheDocument();
    });

    it('calculates 45% LTV when second home checkbox checked', () => {
      render(
        <ProgressiveFormWithController
          formData={{
            propertyCategory: 'resale',
            propertyType: 'private-resale',
            propertyPrice: 800000,
            combinedAge: 40,
            isKeepingCurrentProperty: true // Second home
          }}
          onUpdate={mockOnUpdate}
        />
      );

      // Should show 45% LTV = $360k
      expect(screen.getByText(/\$360,000/)).toBeInTheDocument();
    });
  });
});
