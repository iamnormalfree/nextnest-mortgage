// ABOUTME: Tests for initial state of useProgressiveFormController
// ABOUTME: Verifies progressive disclosure works correctly with null initial values

import { renderHook } from '@testing-library/react'
import { useProgressiveFormController } from '@/hooks/useProgressiveFormController'

describe('useProgressiveFormController - Initial State', () => {
  const defaultProps = {
    loanType: 'new_purchase' as const,
    sessionId: 'test-session-initial',
    onStepCompletion: jest.fn(),
    onAIInsight: jest.fn(),
    onScoreUpdate: jest.fn()
  }

  describe('Progressive Disclosure', () => {
    it('should initialize propertyCategory as null for progressive disclosure', () => {
      const { result } = renderHook(() => useProgressiveFormController(defaultProps))
      
      // CRITICAL: propertyCategory must be null initially
      // This ensures property type dropdown doesn't appear until category is selected
      expect(result.current.propertyCategory).toBe(null)
    })

    it('should NOT pre-select any property category on mount', () => {
      const { result } = renderHook(() => useProgressiveFormController(defaultProps))
      
      // Verify no category is pre-selected ('resale', 'new_launch', 'bto', 'commercial')
      expect(result.current.propertyCategory).not.toBe('resale')
      expect(result.current.propertyCategory).not.toBe('new_launch')
      expect(result.current.propertyCategory).not.toBe('bto')
      expect(result.current.propertyCategory).not.toBe('commercial')
    })
  })

  describe('Other Initial State', () => {
    it('should start at step 1', () => {
      const { result } = renderHook(() => useProgressiveFormController(defaultProps))
      expect(result.current.currentStep).toBe(1)
    })

    it('should have step 0 in completedSteps (loan type selection)', () => {
      const { result } = renderHook(() => useProgressiveFormController(defaultProps))
      expect(result.current.completedSteps).toEqual([0])
    })

    it('should initialize with leadScore of 0', () => {
      const { result } = renderHook(() => useProgressiveFormController(defaultProps))
      expect(result.current.leadScore).toBe(0)
    })

    it('should initialize with no instant calc result', () => {
      const { result } = renderHook(() => useProgressiveFormController(defaultProps))
      expect(result.current.instantCalcResult).toBe(null)
    })
  })
})
