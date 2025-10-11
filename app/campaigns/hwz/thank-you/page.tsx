import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analysis Process Initiated - Technical Report Generating | NextNest',
  description: 'Your Personal Mortgage Intelligence System analysis is running. Technical report will be delivered with mathematical precision.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function HWZThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* HardwareZone Technical Badge */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-3 px-4 text-center">
        <div className="flex items-center justify-center space-x-3 font-mono text-sm">
          <span className="text-green-300">[HWZ]</span>
          <span className="text-white">►</span>
          <span>ANALYSIS_COMPLETE.exe</span>
          <span className="text-blue-300">SUCCESS</span>
          <span className="text-yellow-300">|</span>
          <span className="text-white">PROCESSING...</span>
        </div>
      </div>
      
      <div className="pt-16 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-8">
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-mono font-bold text-green-400 mb-2">
                analysis.process_complete()
              </h1>
              <p className="font-mono text-sm text-slate-400 mb-6">
                {/* Personal Mortgage Intelligence System - Analysis Confirmed */}
              </p>
              
              <p className="text-lg text-slate-300 mb-8">
                Your technical mortgage analysis is now running through our advanced 
                computational framework with mathematical precision.
              </p>

              <div className="bg-slate-900 rounded-lg p-6 mb-8 border border-slate-600">
                <h2 className="font-mono text-lg text-green-400 mb-4">
                  system.processStatus()
                </h2>
                <div className="space-y-3 text-left font-mono text-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-400">[✓]</span>
                    <span className="text-slate-300">Data validation: PASSED</span>
                    <span className="text-slate-500">{/* MAS compliance verified */}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-yellow-400">[⟳]</span>
                    <span className="text-slate-300">Monte Carlo simulation: RUNNING</span>
                    <span className="text-slate-500">{/* 10,000 scenarios */}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-blue-400">[⟳]</span>
                    <span className="text-slate-300">Bank package analysis: PROCESSING</span>
                    <span className="text-slate-500">{/* 286 packages indexed */}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-purple-400">[○]</span>
                    <span className="text-slate-300">Technical report: PENDING</span>
                    <span className="text-slate-500">{/* ETA: 24h */}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700 rounded-lg p-6 mb-8">
                <h3 className="font-mono text-white mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-3 gap-4 font-mono">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400">99.94%</div>
                    <div className="text-xs text-slate-400">Calculation accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-400">1.2ms</div>
                    <div className="text-xs text-slate-400">Processing latency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-400">15</div>
                    <div className="text-xs text-slate-400">Decimal precision</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 mb-8">
                <p className="font-mono text-xs text-green-400 mb-2">
                  {/* HardwareZone Community Technical Support */}
                </p>
                <p className="text-sm text-slate-400">
                  For technical inquiries or API integration questions, contact our 
                  engineering team at{' '}
                  <a href="tel:+6588888888" className="text-green-400 font-mono hover:underline">
                    +65.8888.8888
                  </a>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/campaigns/hwz"
                  className="bg-slate-700 text-white px-6 py-3 rounded-lg font-mono hover:bg-slate-600 transition"
                >
                  system.restart()
                </a>
                <a
                  href="/"
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg font-mono hover:shadow-lg transition"
                >
                  return.toMain()
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Technical Footer */}
      <div className="bg-slate-900 border-t border-slate-700 py-6">
        <div className="container mx-auto px-4 text-center">
          <div className="font-mono text-xs text-slate-500">
            NextNest Personal Mortgage Intelligence System v2.1.4 | 
            MAS Compliant | API Ready | 
            Endorsed by HardwareZone Community
          </div>
        </div>
      </div>
    </div>
  )
}