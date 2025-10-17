import type { Metadata } from 'next'
import SingaporeMortgageCalculator from '@/components/calculators/archive/2025-10/SingaporeMortgageCalculator'

export const metadata: Metadata = {
  title: 'Commercial Property Mortgage Calculator - LinkedIn | NextNest',
  description: 'Singapore commercial property mortgage calculator designed for LinkedIn professionals. Compare 286 bank packages with AI-powered analysis. TDSR/MSR calculations included.',
  keywords: 'commercial property mortgage, Singapore business loan, LinkedIn professionals, TDSR calculator',
  openGraph: {
    title: 'Commercial Property Mortgage Calculator for Professionals',
    description: 'AI-powered commercial mortgage analysis for Singapore professionals. Compare all bank packages with instant TDSR/MSR calculations.',
    images: [{
      url: '/api/og?title=Commercial%20Mortgage%20Calculator&subtitle=LinkedIn%20Professionals',
      width: 1200,
      height: 630,
    }],
  },
}

export default function LinkedInMortgageCalculator() {
  const linkedInConfig = {
    // Campaign attribution
    source: 'linkedin',
    campaign: 'commercial_property_professionals',
    utmParams: {
      utm_source: 'linkedin',
      utm_medium: 'organic_social',
      utm_campaign: 'commercial_mortgage_calculator',
      utm_content: 'calculator_page'
    },
    
    // LinkedIn-specific customization
    title: 'Commercial Property Mortgage Calculator',
    subtitle: 'AI-powered mortgage analysis designed for Singapore business professionals',
    defaultScenario: 'COMMERCIAL' as const,
    showQuickScenarios: true,
    
    // Behavioral customization for LinkedIn professionals
    savingsThreshold: 200, // Higher threshold for commercial properties
  }

  return <SingaporeMortgageCalculator config={linkedInConfig} />
}