import type { Metadata } from 'next'
import SingaporeMortgageCalculator from '@/components/calculators/SingaporeMortgageCalculator'

export const metadata: Metadata = {
  title: 'Mortgage Calculator Singapore - NextNest Lead Generation Tool',
  description: 'Calculate your Singapore mortgage payments, TDSR, MSR, and LTV ratios. Get personalized mortgage optimization analysis from NextNest experts.',
  keywords: 'mortgage calculator Singapore, TDSR calculator, MSR calculator, HDB mortgage, private property mortgage, commercial property loans',
  openGraph: {
    title: 'Singapore Mortgage Calculator - Free Analysis',
    description: 'Calculate mortgage payments and get personalized optimization recommendations from NextNest mortgage experts.',
    type: 'website'
  },
  alternates: {
    canonical: '/calculator',
  },
}

export default function MortgageCalculatorPage() {
  const calculatorConfig = {
    // Primary calculator attribution
    source: 'website_calculator',
    campaign: 'general',
    
    // UI customization for main calculator
    title: 'Singapore Mortgage Calculator',
    subtitle: 'AI-powered analysis with TDSR/MSR calculations comparing all bank packages',
    defaultScenario: 'HDB_FLAT' as const, // Start with most common scenario
    showQuickScenarios: true,
    
    // Lead generation behavior
    savingsThreshold: 100, // Show lead form for $100+ monthly savings
  }

  return <SingaporeMortgageCalculator config={calculatorConfig} />
}