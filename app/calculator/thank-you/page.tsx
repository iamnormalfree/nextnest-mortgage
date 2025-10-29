import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Thank You - Your Mortgage Analysis is Being Prepared | NextNest',
  description: 'Thank you for your mortgage calculation request. Our team is preparing your personalized Singapore mortgage analysis.',
  robots: {
    index: false, // Don't index thank you pages
    follow: true,
  },
}

export default function ThankYouPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-nn-grey-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-lg border p-8">
            <div className="w-16 h-16 bg-nn-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-nn-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-sans font-bold text-nn-grey-dark mb-4">
              Analysis Request Submitted Successfully!
            </h1>
            
            <p className="text-lg text-nn-grey-medium mb-6">
              Our AI is now analyzing all 286 mortgage packages from Singapore banks to find your optimal solution.
            </p>

            <div className="bg-nn-blue-trust/10 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-sans font-semibold text-nn-grey-dark mb-3">
                What happens next:
              </h2>
              <div className="space-y-2 text-left">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-nn-gold rounded-full flex items-center justify-center text-xs font-bold text-nn-grey-dark">1</div>
                  <p className="text-nn-grey-medium">Our AI analyzes your profile against all available mortgage packages</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-nn-gold rounded-full flex items-center justify-center text-xs font-bold text-nn-grey-dark">2</div>
                  <p className="text-nn-grey-medium">We identify the top 3-5 options that match your requirements</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-nn-gold rounded-full flex items-center justify-center text-xs font-bold text-nn-grey-dark">3</div>
                  <p className="text-nn-grey-medium">You receive your complete analysis within 24 hours</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-nn-gold font-sans">24h</div>
                <div className="text-sm text-nn-grey-medium">Guaranteed response</div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-nn-green font-sans">$0</div>
                <div className="text-sm text-nn-grey-medium">Cost to you</div>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-nn-blue font-sans">286</div>
                <div className="text-sm text-nn-grey-medium">Packages compared</div>
              </div>
            </div>

            <p className="text-sm text-nn-grey-medium mb-6">
              <strong>Priority Support:</strong> For urgent enquiries, call us at{' '}
              <a href="tel:+6588888888" className="text-nn-gold font-medium hover:underline">
                +65 8888 8888
              </a>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/calculator"
                className="bg-nn-grey-medium/20 text-nn-grey-dark px-6 py-3 rounded-lg font-medium hover:bg-nn-grey-medium/30 transition"
              >
                Calculate Another Scenario
              </a>
              <a
                href="/"
                className="bg-gradient-to-r from-nn-gold to-nn-gold-soft text-nn-grey-dark px-6 py-3 rounded-lg font-medium hover:shadow-lg transition"
              >
                Return to Homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}