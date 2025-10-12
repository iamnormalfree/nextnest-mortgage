export interface MortgageInput {
  loanAmount: number
  interestRate: number
  loanTerm: number
  downPayment?: number
  propertyValue?: number
  propertyType?: string
  monthlyIncome?: number
  existingDebt?: number
}

export interface MortgageResult {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
  loanAmount: number
  interestRate: number
  loanTerm: number
}

export interface MortgageScenario {
  name: string
  loanAmount: number
  interestRate: number
  loanTerm: number
}

export interface LeadCaptureData {
  name: string
  email: string
  phone: string
  timeline: 'immediate' | 'soon' | 'planning' | 'exploring'
  consent?: boolean
}
