import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Executive Analysis Confirmed - Commercial Property Review | NextNest',
  description: 'Your executive mortgage intelligence analysis is being prepared by our commercial property specialists.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function LinkedInThankYouPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-b from-slate-50 to-nn-grey-light">
      {/* LinkedIn Professional Badge */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
          </svg>
          <span className="font-medium">Executive Analysis Confirmed • Priority Processing</span>
        </div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-xl shadow-lg border p-8">
            <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-gilda font-bold text-nn-grey-dark mb-4">
              Executive Analysis Confirmed
            </h1>
            
            <p className="text-lg text-nn-grey-medium mb-6">
              Your commercial property mortgage intelligence analysis is now being prepared 
              by our specialized executive team.
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-gilda font-semibold text-nn-grey-dark mb-3">
                Executive Service Promise:
              </h2>
              <div className="space-y-2 text-left">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">1</div>
                  <p className="text-nn-grey-medium">Priority analysis within 12 hours for commercial properties</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">2</div>
                  <p className="text-nn-grey-medium">Direct consultation with commercial property specialists</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">3</div>
                  <p className="text-nn-grey-medium">Portfolio optimization recommendations included</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 font-gilda">12h</div>
                <div className="text-sm text-nn-grey-medium">Priority response</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-nn-purple-authority font-gilda">$0</div>
                <div className="text-sm text-nn-grey-medium">Executive consultation</div>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-nn-green font-gilda">24/7</div>
                <div className="text-sm text-nn-grey-medium">Support access</div>
              </div>
            </div>

            <div className="bg-slate-800 text-white rounded-lg p-4 mb-8">
              <p className="text-sm">
                <strong>Executive Priority Line:</strong> For urgent commercial property enquiries, 
                call our executive team directly at{' '}
                <a href="tel:+6588888888" className="text-nn-gold font-medium hover:underline">
                  +65 8888 8888
                </a>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/campaigns/linkedin"
                className="bg-slate-100 text-nn-grey-dark px-6 py-3 rounded-lg font-medium hover:bg-slate-200 transition"
              >
                Analyze Another Property
              </a>
              <a
                href="/"
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition"
              >
                Executive Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}