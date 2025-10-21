import { renderHook, act, waitFor } from '@testing-library/react'
import { useProgressiveFormController } from '@/hooks/useProgressiveFormController'

describe('useProgressiveFormController - Step-Aware Calculations', () => {
  
  const defaultProps = {
    loanType: 'new_purchase' as const,
    sessionId: 'test-session',
    onStepCompletion: jest.fn(),
    onAIInsight: jest.fn(),
    onScoreUpdate: jest.fn()
  }

  describe('Step 2: Pure LTV Calculation', () => {
    it('should use pure LTV calculation on Step 2 (no income)', async () => {
      const { result } = renderHook(() => useProgressiveFormController(defaultProps))

      // Navigate to Step 2
      act(() => {
        result.current.setValue('propertyCategory', 'resale')
        result.current.setValue('propertyType', 'HDB')
        result.current.setValue('priceRange', 1000000)
        result.current.setValue('combinedAge', 35)
        result.current.setValue('existingProperties', 0)
      })

      // Manually set step to 2 (simulating navigation)
      act(() => {
        result.current.setCurrentStep(2)
      })

      // Wait for calculation to complete
      await waitFor(() => {
        expect(result.current.instantCalcResult).toBeTruthy()
      }, { timeout: 3000 })

      // Assertions
      expect(result.current.instantCalcResult?.calculationType).toBe('pure_ltv')
      expect(result.current.instantCalcResult?.maxLoanAmount).toBe(750000)
      
      if (result.current.instantCalcResult?.calculationType === 'pure_ltv') {
        expect(result.current.instantCalcResult.limitingFactor).toBe('LTV')
        expect(result.current.instantCalcResult.reasonCodes).toContain('first_property_75_ltv')
        expect(result.current.instantCalcResult.reasonCodes).not.toContain('msr_limited')
        expect(result.current.instantCalcResult.reasonCodes).not.toContain('tdsr_limited')
      }
    })

    it('should NOT use income on Step 2 even if available in form data', async () => {
      const { result } = renderHook(() => useProgressiveFormController(defaultProps))

      // Set Step 2 data + income (income should be ignored)
      act(() => {
        result.current.setValue('propertyCategory', 'resale')
        result.current.setValue('propertyType', 'HDB')
        result.current.setValue('priceRange', 1000000)
        result.current.setValue('combinedAge', 35)
        result.current.setValue('existingProperties', 0)
        result.current.setValue('actualIncomes.0', 5000)  // ← Income present but should be ignored
        result.current.setCurrentStep(2)
      })

      await waitFor(() => {
        expect(result.current.instantCalcResult).toBeTruthy()
      }, { timeout: 3000 })

      // Should still use pure LTV, not income-based
      expect(result.current.instantCalcResult?.calculationType).toBe('pure_ltv')
      expect(result.current.instantCalcResult?.maxLoanAmount).toBe(750000)  // Not MSR-limited
    })
  })

  describe('Step 3: Full Analysis', () => {
    it('should use full analysis with actual income on Step 3', async () => {
      const { result } = renderHook(() => useProgressiveFormController(defaultProps))

      // Set Step 2 data
      act(() => {
        result.current.setValue('propertyCategory', 'resale')
        result.current.setValue('propertyType', 'HDB')
        result.current.setValue('priceRange', 1000000)
        result.current.setValue('combinedAge', 35)
        result.current.setValue('existingProperties', 0)
        result.current.setCurrentStep(2)
      })

      await waitFor(() => {
        expect(result.current.instantCalcResult?.calculationType).toBe('pure_ltv')
      }, { timeout: 3000 })

      // Move to Step 3 and add income
      act(() => {
        result.current.setValue('actualIncomes.0', 8000)
        result.current.setValue('actualAges.0', 35)
        result.current.setCurrentStep(3)
      })

      await waitFor(() => {
        expect(result.current.instantCalcResult?.calculationType).toBe('full_analysis')
      }, { timeout: 3000 })

      // Assertions
      if (result.current.instantCalcResult?.calculationType === 'full_analysis') {
        expect(result.current.instantCalcResult.maxLoanAmount).toBeLessThanOrEqual(750000)
        expect(['MSR', 'TDSR', 'LTV']).toContain(result.current.instantCalcResult.limitingFactor)
      }
    })

    it('should NOT calculate on Step 3 without income', async () => {
      const { result } = renderHook(() => useProgressiveFormController(defaultProps))

      // Set Step 2 data
      act(() => {
        result.current.setValue('propertyCategory', 'resale')
        result.current.setValue('propertyType', 'HDB')
        result.current.setValue('priceRange', 1000000)
        result.current.setValue('combinedAge', 35)
        result.current.setValue('existingProperties', 0)
        result.current.setCurrentStep(2)
      })

      await waitFor(() => {
        expect(result.current.instantCalcResult?.calculationType).toBe('pure_ltv')
      }, { timeout: 3000 })

      // Move to Step 3 WITHOUT income
      act(() => {
        result.current.setValue('actualAges.0', 35)
        result.current.setCurrentStep(3)
        // NO actualIncomes set
      })

      // Wait a bit
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 2000))
      })

      // Should clear result (no income = no full analysis)
      expect(result.current.instantCalcResult).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should recalculate pure LTV when user goes back to Step 2', async () => {
      const { result } = renderHook(() => useProgressiveFormController(defaultProps))

      // Navigate to Step 3 with full analysis
      act(() => {
        result.current.setValue('propertyCategory', 'resale')
        result.current.setValue('propertyType', 'HDB')
        result.current.setValue('priceRange', 1000000)
        result.current.setValue('combinedAge', 35)
        result.current.setValue('existingProperties', 0)
        result.current.setCurrentStep(2)
      })

      await waitFor(() => {
        expect(result.current.instantCalcResult?.calculationType).toBe('pure_ltv')
      }, { timeout: 3000 })

      act(() => {
        result.current.setValue('actualIncomes.0', 8000)
        result.current.setCurrentStep(3)
      })

      await waitFor(() => {
        expect(result.current.instantCalcResult?.calculationType).toBe('full_analysis')
      }, { timeout: 3000 })

      // Go back to Step 2
      act(() => {
        result.current.prev()
      })

      expect(result.current.currentStep).toBe(2)

      // Wait for recalculation
      await waitFor(() => {
        expect(result.current.instantCalcResult?.calculationType).toBe('pure_ltv')
      }, { timeout: 3000 })
    })
  })
})
