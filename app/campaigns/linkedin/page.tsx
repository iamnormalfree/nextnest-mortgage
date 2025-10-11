import type { Metadata } from 'next'
import SingaporeMortgageCalculator from '@/components/calculators/SingaporeMortgageCalculator'

export const metadata: Metadata = {
  title: 'Executive Mortgage Intelligence - Commercial Property Calculator | NextNest',
  description: 'Your Personal Mortgage Brain for sophisticated portfolio decisions. Commercial property mortgage analysis for Singapore business leaders and HNW individuals.',
  keywords: 'commercial property mortgage Singapore, executive mortgage calculator, business property loans, HNW mortgage analysis, commercial TDSR',
  openGraph: {
    title: 'Executive Mortgage Intelligence - Commercial Property Calculator',
    description: 'Sophisticated mortgage analysis for commercial properties and executive portfolio decisions. Trusted by Singapore business leaders.',
    images: [{
      url: '/api/og?title=Executive%20Mortgage%20Intelligence&subtitle=Commercial%20Property',
      width: 1200,
      height: 630,
    }],
  },
  alternates: {
    canonical: '/campaigns/linkedin',
  },
}

export default function LinkedInMortgageCalculator() {
  const linkedInConfig = {
    // LinkedIn B2B campaign attribution (exact mapping from implementation guide)
    source: 'linkedin_campaign',
    campaign: 'linkedin_b2b_commercial',
    utmParams: {
      utm_source: 'linkedin',
      utm_medium: 'social',
      utm_campaign: 'b2b_commercial',
      utm_content: 'linkedin_business_network'
    },
    
    // Executive positioning for LinkedIn professionals
    title: 'Executive Mortgage Intelligence',
    subtitle: 'Your Personal Mortgage Brain for sophisticated commercial property portfolio decisions',
    
    // LinkedIn focus: Commercial properties and high-value scenarios
    defaultScenario: 'COMMERCIAL' as const,
    showQuickScenarios: true,
    
    // High-value lead threshold for commercial focus
    savingsThreshold: 200,
    
    // Webhook URL for production
    webhookUrl: 'https://primary-production-1af6.up.railway.app/webhook-test/forms/submit'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-nn-grey-light">
      {/* LinkedIn Professional Badge */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
          </svg>
          <span className="font-medium">Trusted by Singapore Business Leaders • Executive-Grade Analysis</span>
        </div>
      </div>
      
      <SingaporeMortgageCalculator config={linkedInConfig} />
      
      {/* Executive Trust & Authority Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-gilda font-bold text-center mb-8">
              Why Singapore Executives Choose NextNest
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-nn-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-nn-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="font-semibold text-lg mb-2">Commercial Property Expertise</div>
                <div className="text-slate-300">
                  Specialized analysis for shophouses, office buildings, and investment properties
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-nn-purple-authority/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-nn-purple-authority" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="font-semibold text-lg mb-2">Portfolio Optimization</div>
                <div className="text-slate-300">
                  Multi-property portfolio analysis with leverage optimization strategies
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-nn-blue-trust/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-nn-blue-trust" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="font-semibold text-lg mb-2">Confidential Service</div>
                <div className="text-slate-300">
                  Private consultation with executive-level mortgage specialists
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <div className="inline-flex items-center space-x-4 bg-white/10 rounded-lg px-6 py-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-nn-gold">$2M+</div>
                  <div className="text-xs text-slate-300">Average loan size</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-nn-green">98%</div>
                  <div className="text-xs text-slate-300">Executive satisfaction</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-nn-blue-trust">24h</div>
                  <div className="text-xs text-slate-300">Priority response</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}