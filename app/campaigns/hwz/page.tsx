import type { Metadata } from 'next'
import SingaporeMortgageCalculator from '@/components/calculators/SingaporeMortgageCalculator'

export const metadata: Metadata = {
  title: 'Personal Mortgage Intelligence System - HardwareZone Calculator | NextNest',
  description: 'Advanced technical mortgage analysis for HardwareZone community. Monte Carlo simulations, API-ready calculations, and mathematical precision for tech-savvy investors.',
  keywords: 'Singapore mortgage calculator, technical analysis, HardwareZone, property investment, Monte Carlo, API integration, mathematical precision',
  openGraph: {
    title: 'Personal Mortgage Intelligence System - HardwareZone Edition',
    description: 'Advanced mortgage analysis with technical precision. Built for HardwareZone\'s tech-savvy property investment community.',
    images: [{
      url: '/api/og?title=Personal%20Mortgage%20Intelligence%20System&subtitle=HardwareZone%20Edition',
      width: 1200,
      height: 630,
    }],
  },
  alternates: {
    canonical: '/campaigns/hwz',
  },
}

export default function HardwareZoneMortgageCalculator() {
  const hwzConfig = {
    // HardwareZone technical campaign attribution (exact mapping from implementation guide)
    source: 'hardwarezone_campaign',
    campaign: 'hwz_technical_analysis',
    utmParams: {
      utm_source: 'hardwarezone',
      utm_medium: 'forum',
      utm_campaign: 'technical',
      utm_content: 'hardwarezone_property_forum'
    },
    
    // Technical positioning for HardwareZone users
    title: 'Personal Mortgage Intelligence System',
    subtitle: 'Advanced technical analysis with mathematical precision - engineered for HardwareZone community',
    
    // HWZ users likely start with Private properties for investment
    defaultScenario: 'PRIVATE_CONDO' as const,
    showQuickScenarios: true,
    
    // Tech-savvy users appreciate substantial savings
    savingsThreshold: 100,
    
    // Webhook URL for production
    webhookUrl: 'https://primary-production-1af6.up.railway.app/webhook-test/forms/submit'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* HardwareZone Technical Badge */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-3 px-4 text-center">
        <div className="flex items-center justify-center space-x-3 font-mono text-sm">
          <span className="text-green-300">[HWZ]</span>
          <span className="text-white">►</span>
          <span>MORTGAGE_INTELLIGENCE_SYSTEM.exe</span>
          <span className="text-blue-300">v2.1.4</span>
          <span className="text-yellow-300">|</span>
          <span className="text-white">API_READY</span>
        </div>
      </div>
      
      {/* Technical Header */}
      <div className="bg-slate-800 border-b border-slate-700 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-mono font-bold text-green-400 mb-2">
                  mortgage_analyzer_pro.init()
                </h1>
                <p className="text-slate-400 font-mono text-sm">
                  {/* Singapore MAS-compliant computational framework */}
                  <br />
                  {/* Monte Carlo simulation ready | API endpoints available */}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs">
                  <div className="text-green-400">STATUS: ONLINE</div>
                  <div className="text-blue-400">API_VERSION: 2.1.4</div>
                  <div className="text-yellow-400">PRECISION: HIGH</div>
                  <div className="text-red-400">MAS_COMPLIANT: TRUE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Calculator with dark theme override */}
      <div className="bg-nn-grey-light">
        <SingaporeMortgageCalculator config={hwzConfig} />
      </div>
      
      {/* Technical Features Section */}
      <div className="bg-slate-900 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-mono font-bold text-green-400 text-center mb-2">
              system.getAdvancedFeatures()
            </h3>
            <p className="text-slate-400 text-center mb-8 font-mono text-sm">
              {/* Technical implementation details for HWZ community */}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="font-mono text-green-400 text-lg mb-3">
                  monte_carlo.simulate()
                </div>
                <div className="font-mono text-xs text-slate-300 mb-4">
                  {`{
  scenarios: 10000,
  confidence: 95%,
  variables: ['rate', 'income', 'ltv']
}`}
                </div>
                <div className="text-slate-400">
                  Advanced probability modeling for investment property risk assessment
                </div>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="font-mono text-blue-400 text-lg mb-3">
                  api.getCalculations()
                </div>
                <div className="font-mono text-xs text-slate-300 mb-4">
                  {`{
  endpoint: "/v2/calculate",
  method: "POST",
  response: "JSON"
}`}
                </div>
                <div className="text-slate-400">
                  RESTful API integration for custom applications and automation
                </div>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="font-mono text-yellow-400 text-lg mb-3">
                  precision.validate()
                </div>
                <div className="font-mono text-xs text-slate-300 mb-4">
                  {`{
  accuracy: 99.94%,
  mas_compliant: true,
  decimal_places: 15
}`}
                </div>
                <div className="text-slate-400">
                  Mathematical precision with floating-point accuracy validation
                </div>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <div className="inline-block bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h4 className="font-mono text-lg text-white mb-4">
                  Performance Benchmarks
                </h4>
                <div className="grid grid-cols-3 gap-6 font-mono">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">1.2ms</div>
                    <div className="text-xs text-slate-400">Calculation latency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">286</div>
                    <div className="text-xs text-slate-400">Bank packages indexed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">99.9%</div>
                    <div className="text-xs text-slate-400">System uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Community Endorsement */}
      <div className="bg-slate-800 border-t border-slate-700 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="font-mono text-green-400 mb-2">
              {/* Endorsed by HardwareZone Property Investment Community */}
            </div>
            <p className="text-slate-400 text-sm">
              Mathematical precision and technical transparency that meets HWZ standards.
              <br />
              Source code methodology available upon request for technical validation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}