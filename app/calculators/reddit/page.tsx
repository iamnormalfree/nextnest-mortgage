import type { Metadata } from 'next'
import SingaporeMortgageCalculator from '@/components/calculators/SingaporeMortgageCalculator'

export const metadata: Metadata = {
  title: 'Singapore Mortgage Calculator - Reddit Community | NextNest',
  description: 'Transparent mortgage calculator shared on r/PersonalFinanceSG. No BS, just real mortgage analysis with TDSR/MSR calculations for all property types.',
  keywords: 'Singapore mortgage calculator, HDB mortgage, private property mortgage, Reddit PersonalFinanceSG, mortgage comparison',
  openGraph: {
    title: 'Singapore Mortgage Calculator - Reddit Community',
    description: 'Honest mortgage analysis tool shared by the Singapore Reddit community. Compare all 286 bank packages with transparent calculations.',
    images: [{
      url: '/api/og?title=Singapore%20Mortgage%20Calculator&subtitle=Reddit%20Community',
      width: 1200,
      height: 630,
    }],
  },
}

export default function RedditMortgageCalculator() {
  const redditConfig = {
    // Campaign attribution
    source: 'reddit',
    campaign: 'personalfinancesg_community',
    utmParams: {
      utm_source: 'reddit',
      utm_medium: 'social',
      utm_campaign: 'personalfinancesg_calculator',
      utm_content: 'community_shared'
    },
    
    // Reddit-specific customization (more casual, transparent tone)
    title: 'Singapore Mortgage Calculator',
    subtitle: 'Shared by r/PersonalFinanceSG community - No BS, just transparent mortgage analysis',
    defaultScenario: 'HDB_FLAT' as const, // Reddit users likely start with HDB
    showQuickScenarios: true,
    
    // Behavioral customization for Reddit community
    savingsThreshold: 50, // Lower threshold to capture more leads from diverse backgrounds
  }

  return <SingaporeMortgageCalculator config={redditConfig} />
}