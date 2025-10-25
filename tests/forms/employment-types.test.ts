import {
  INCOME_RECOGNITION_RATES,
  VARIABLE_INCOME_RECOGNITION_RATE,
  DOCUMENTATION_REQUIREMENTS,
  EmploymentType
} from '@/lib/forms/employment-types'

describe('employment-types', () => {
  describe('Income Recognition Rates', () => {
    it('recognizes employed income at 100%', () => {
      expect(INCOME_RECOGNITION_RATES.employed).toBe(1.0)
    })

    it('recognizes self-employed income at 70%', () => {
      expect(INCOME_RECOGNITION_RATES['self-employed']).toBe(0.7)
    })

    it('recognizes in-between-jobs at 100%', () => {
      expect(INCOME_RECOGNITION_RATES['in-between-jobs']).toBe(1.0)
    })

    it('recognizes not-working at 0%', () => {
      expect(INCOME_RECOGNITION_RATES['not-working']).toBe(0.0)
    })

    it('recognizes variable income at 70%', () => {
      expect(VARIABLE_INCOME_RECOGNITION_RATE).toBe(0.7)
    })
  })

  describe('Documentation Requirements', () => {
    it('requires payslips and letter for employed', () => {
      expect(DOCUMENTATION_REQUIREMENTS.employed).toContain('Latest 3 months payslips')
      expect(DOCUMENTATION_REQUIREMENTS.employed).toContain('Employment letter')
    })

    it('requires 2 years NOA for self-employed', () => {
      expect(DOCUMENTATION_REQUIREMENTS['self-employed']).toContain('Latest 2 years Notice of Assessment (NOA)')
    })

    it('requires contract and work email for in-between-jobs', () => {
      expect(DOCUMENTATION_REQUIREMENTS['in-between-jobs']).toContain('Employment contract (signed)')
      expect(DOCUMENTATION_REQUIREMENTS['in-between-jobs']).toContain('Email from work email address (proof of employment)')
    })
  })
})
