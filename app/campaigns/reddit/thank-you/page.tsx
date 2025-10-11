import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Thanks r/PersonalFinanceSG! Your Analysis is Ready | NextNest',
  description: 'Thank you for using the Reddit community mortgage calculator. Your personalized analysis is being prepared.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function RedditThankYouPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-nn-grey-light">
      {/* Reddit Community Badge */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 text-center text-sm">
        📍 r/PersonalFinanceSG Community Calculator • Analysis Complete!
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-lg border p-8">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-gilda font-bold text-nn-grey-dark mb-4">
              Thanks r/PersonalFinanceSG! 🎉
            </h1>
            
            <p className="text-lg text-nn-grey-medium mb-6">
              Your Personal Mortgage Brain analysis is being processed with the mathematical precision 
              the Reddit community expects.
            </p>

            <div className="bg-orange-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-gilda font-semibold text-nn-grey-dark mb-3">
                Community Promise - What&apos;s Next:
              </h2>
              <div className="space-y-2 text-left">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">1</div>
                  <p className="text-nn-grey-medium">Mathematical analysis of all 286 Singapore bank packages (no approximations)</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">2</div>
                  <p className="text-nn-grey-medium">Transparent calculation methodology (as promised to the community)</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">3</div>
                  <p className="text-nn-grey-medium">Complete analysis delivered within 24 hours, guaranteed</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 rounded-lg p-4 mb-8">
              <p className="text-sm text-nn-grey-medium">
                <strong>Reddit Community Commitment:</strong> If our analysis doesn&apos;t live up to r/PersonalFinanceSG standards, 
                we&apos;ll connect you directly with your bank&apos;s repricing team - completely free.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/campaigns/reddit"
                className="bg-nn-grey-medium/20 text-nn-grey-dark px-6 py-3 rounded-lg font-medium hover:bg-nn-grey-medium/30 transition"
              >
                Calculate Another Scenario
              </a>
              <a
                href="/"
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition"
              >
                Return to NextNest
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}