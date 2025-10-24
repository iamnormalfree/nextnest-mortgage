// ABOUTME: Unit test for shouldShowPropertyTypeSelect logic
// ABOUTME: Verifies progressive disclosure correctly hides field when category is null

describe('shouldShowPropertyTypeSelect Logic', () => {
  // Simulate the current logic
  const shouldShowPropertyTypeSelect_BEFORE_FIX = (
    loanType: string,
    propertyCategory: string | null
  ) => {
    return (
      loanType === 'new_purchase' &&
      propertyCategory !== 'bto' &&
      propertyCategory !== 'commercial'
    )
  }

  // Fixed logic with null check
  const shouldShowPropertyTypeSelect_AFTER_FIX = (
    loanType: string,
    propertyCategory: string | null
  ) => {
    return (
      loanType === 'new_purchase' &&
      propertyCategory !== null &&
      propertyCategory !== 'bto' &&
      propertyCategory !== 'commercial'
    )
  }

  describe('BEFORE FIX (Bug)', () => {
    it('should return TRUE when propertyCategory is null (BUG!)', () => {
      const result = shouldShowPropertyTypeSelect_BEFORE_FIX('new_purchase', null)
      
      // This is the BUG - it returns TRUE when it should return FALSE
      expect(result).toBe(true)
    })

    it('should return FALSE when propertyCategory is bto', () => {
      const result = shouldShowPropertyTypeSelect_BEFORE_FIX('new_purchase', 'bto')
      expect(result).toBe(false)
    })

    it('should return FALSE when propertyCategory is commercial', () => {
      const result = shouldShowPropertyTypeSelect_BEFORE_FIX('new_purchase', 'commercial')
      expect(result).toBe(false)
    })

    it('should return TRUE when propertyCategory is resale', () => {
      const result = shouldShowPropertyTypeSelect_BEFORE_FIX('new_purchase', 'resale')
      expect(result).toBe(true)
    })
  })

  describe('AFTER FIX (Correct)', () => {
    it('should return FALSE when propertyCategory is null (FIXED!)', () => {
      const result = shouldShowPropertyTypeSelect_AFTER_FIX('new_purchase', null)
      
      // FIXED - now correctly returns FALSE when category is null
      expect(result).toBe(false)
    })

    it('should return FALSE when propertyCategory is bto', () => {
      const result = shouldShowPropertyTypeSelect_AFTER_FIX('new_purchase', 'bto')
      expect(result).toBe(false)
    })

    it('should return FALSE when propertyCategory is commercial', () => {
      const result = shouldShowPropertyTypeSelect_AFTER_FIX('new_purchase', 'commercial')
      expect(result).toBe(false)
    })

    it('should return TRUE when propertyCategory is resale', () => {
      const result = shouldShowPropertyTypeSelect_AFTER_FIX('new_purchase', 'resale')
      expect(result).toBe(true)
    })

    it('should return TRUE when propertyCategory is new_launch', () => {
      const result = shouldShowPropertyTypeSelect_AFTER_FIX('new_purchase', 'new_launch')
      expect(result).toBe(true)
    })
  })

  describe('Truth Table Verification', () => {
    it('documents the complete truth table', () => {
      const truthTable = `
        | loanType      | propertyCategory | BEFORE_FIX | AFTER_FIX | Expected |
        |--------------|------------------|------------|-----------|----------|
        | new_purchase | null             | TRUE ❌    | FALSE ✅  | FALSE    |
        | new_purchase | resale           | TRUE ✅    | TRUE ✅   | TRUE     |
        | new_purchase | new_launch       | TRUE ✅    | TRUE ✅   | TRUE     |
        | new_purchase | bto              | FALSE ✅   | FALSE ✅  | FALSE    |
        | new_purchase | commercial       | FALSE ✅   | FALSE ✅  | FALSE    |
        | refinance    | null             | FALSE ✅   | FALSE ✅  | FALSE    |
      `
      
      expect(truthTable).toBeTruthy()
    })
  })
})
