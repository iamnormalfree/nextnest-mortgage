import type { Metadata } from 'next'
import SingaporeMortgageCalculator from '@/components/calculators/archive/2025-10/SingaporeMortgageCalculator'

export const metadata: Metadata = {
  title: 'Your Personal Mortgage Brain - r/PersonalFinanceSG Calculator | NextNest',
  description: 'The mortgage calculator that thinks like you do. Shared on r/PersonalFinanceSG - sophisticated analysis with TDSR/MSR calculations. No BS, just transparency.',
  keywords: 'Singapore mortgage calculator, HDB mortgage, private property mortgage, Reddit PersonalFinanceSG, TDSR calculator, MSR calculator',
  openGraph: {
    title: 'Your Personal Mortgage Brain - Reddit Community Calculator',
    description: 'The only mortgage calculator with sophisticated analysis that thinks like you do. Transparent calculations trusted by r/PersonalFinanceSG.',
    images: [{
      url: '/api/og?title=Your%20Personal%20Mortgage%20Brain&subtitle=Reddit%20Community',
      width: 1200,
      height: 630,
    }],
  },
  alternates: {
    canonical: '/campaigns/reddit',
  },
}

export default function RedditMortgageCalculator() {
  const redditConfig = {
    // Reddit campaign attribution (exact mapping from implementation guide)
    source: 'reddit_campaign',
    campaign: 'reddit_mathematical',
    utmParams: {
      utm_source: 'reddit',
      utm_medium: 'organic',
      utm_campaign: 'mathematical',
      utm_content: 'r_personalfinancesg'
    },
    
    // Reddit-specific positioning: "Your Personal Mortgage Brain"
    title: 'Your Personal Mortgage Brain',
    subtitle: 'Sophisticated analysis that thinks like you do - trusted by r/PersonalFinanceSG community',
    
    // Reddit user behavior: Start with HDB → Private progression
    defaultScenario: 'HDB_FLAT' as const,
    showQuickScenarios: true,
    
    // Community-driven conversion (lower threshold for trust-based leads)
    savingsThreshold: 75,
    
    // Webhook URL for production
    webhookUrl: 'https://primary-production-1af6.up.railway.app/webhook-test/forms/submit'
  }

  return (
    <div className="min-h-screen bg-nn-grey-light">
      {/* Reddit Community Badge */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 text-center text-sm">
        📍 Shared by r/PersonalFinanceSG Community • Transparent Analysis • No Hidden Agenda
      </div>
      
      <SingaporeMortgageCalculator config={redditConfig} />
      
      {/* Reddit Community Trust Indicators */}
      <div className="bg-white border-t border-nn-grey-medium/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-lg font-sans font-semibold text-nn-grey-dark mb-4">
              Why r/PersonalFinanceSG Trusts This Calculator
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl mb-2">🔍</div>
                <div className="font-semibold text-nn-grey-dark">Mathematical Precision</div>
                <div className="text-sm text-nn-grey-medium">
                  Uses actual MAS regulations, not simplified approximations
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold text-nn-grey-dark">Community Validated</div>
                <div className="text-sm text-nn-grey-medium">
                  Calculation methodology reviewed by r/PersonalFinanceSG members
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <div className="font-semibold text-nn-grey-dark">No Hidden Fees</div>
                <div className="text-sm text-nn-grey-medium">
                  Banks pay us, you get transparent analysis at no cost
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}