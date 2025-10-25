import { getStep2VisibleFields } from '@/lib/forms/field-visibility-rules'
import type { LoanType, PropertyCategory, PropertyType } from '@/lib/contracts/form-contracts'

describe('field-visibility-rules', () => {
  describe('Step 2 Progressive Disclosure', () => {
    it('shows only category when nothing selected', () => {
      const fields = getStep2VisibleFields({
        loanType: 'new_purchase',
        propertyCategory: null,
        propertyType: null
      })

      expect(fields).toEqual(['propertyCategory'])
    })

    it('shows category + type after category selected', () => {
      const fields = getStep2VisibleFields({
        loanType: 'new_purchase',
        propertyCategory: 'resale',
        propertyType: null
      })

      expect(fields).toEqual(['propertyCategory', 'propertyType'])
    })

    it('shows price + age ONLY after type selected (NEW behavior)', () => {
      const fields = getStep2VisibleFields({
        loanType: 'new_purchase',
        propertyCategory: 'resale',
        propertyType: 'Private'
      })

      expect(fields).toContain('propertyCategory')
      expect(fields).toContain('propertyType')
      expect(fields).toContain('priceRange')
      expect(fields).toContain('combinedAge')
    })

    it('shows existing properties checkbox for Private/EC/Landed', () => {
      const fields = getStep2VisibleFields({
        loanType: 'new_purchase',
        propertyCategory: 'resale',
        propertyType: 'Private'
      })

      expect(fields).toContain('existingProperties')
    })

    it('does NOT show existing properties for HDB', () => {
      const fields = getStep2VisibleFields({
        loanType: 'new_purchase',
        propertyCategory: 'resale',
        propertyType: 'HDB'
      })

      expect(fields).not.toContain('existingProperties')
    })

    it('refinance shows all fields immediately (no progressive disclosure)', () => {
      const fields = getStep2VisibleFields({
        loanType: 'refinance',
        propertyCategory: null,
        propertyType: 'Private'
      })

      expect(fields).toContain('propertyType')
      expect(fields).toContain('priceRange')
      expect(fields).toContain('outstandingLoan')
    })
  })
})
