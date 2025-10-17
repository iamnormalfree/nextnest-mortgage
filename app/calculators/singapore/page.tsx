import type { Metadata } from 'next'
import SingaporeMortgageCalculator from '@/components/calculators/archive/2025-10/SingaporeMortgageCalculator'

export const metadata: Metadata = {
  title: 'Singapore Mortgage Calculator 2025 - Compare All Bank Packages | NextNest',
  description: 'Official Singapore mortgage calculator comparing all 286 bank packages in 2025. TDSR, MSR, and LTV calculations for HDB, private, and commercial properties. Free AI analysis.',
  keywords: 'Singapore mortgage calculator 2025, mortgage comparison Singapore, TDSR calculator, MSR calculator, HDB mortgage rates, private property mortgage, Singapore bank packages',
  openGraph: {
    title: 'Singapore Mortgage Calculator 2025 - Compare All Banks',
    description: 'Compare all 286 Singapore bank mortgage packages with AI-powered analysis. TDSR/MSR calculations included for accurate affordability assessment.',
    images: [{
      url: '/api/og?title=Singapore%20Mortgage%20Calculator%202025&subtitle=Compare%20All%20Bank%20Packages',
      width: 1200,
      height: 630,
    }],
  },
  alternates: {
    canonical: '/calculators/singapore',
  },
}

export default function SingaporeMortgageCalculatorPage() {
  const singaporeConfig = {
    // Campaign attribution for local SEO
    source: 'organic_search',
    campaign: 'singapore_seo_2025',
    utmParams: {
      utm_source: 'google',
      utm_medium: 'organic',
      utm_campaign: 'singapore_mortgage_calculator',
      utm_content: 'seo_landing'
    },
    
    // Singapore SEO-optimized customization
    title: 'Singapore Mortgage Calculator 2025',
    subtitle: 'Compare all 286 bank packages with AI-powered TDSR/MSR analysis - completely transparent and free',
    defaultScenario: 'PRIVATE_CONDO' as const, // Balance between HDB and commercial
    showQuickScenarios: true,
    
    // Behavioral customization for organic traffic
    savingsThreshold: 75, // Balanced threshold for diverse organic traffic
  }

  return <SingaporeMortgageCalculator config={singaporeConfig} />
}