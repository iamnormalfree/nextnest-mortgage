import { CheckCircle, Shield, TrendingUp } from './icons'

const ServicesSection = () => {
  return (
    <section id="services" className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-gilda font-bold text-[#0D1B2A] mb-4">
            Transparent Hybrid Intelligence System
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI efficiency and speed combined with human insight and complete transparency about incentives and options.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#F0F4FA] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-[#4A90E2]" />
            </div>
            <h3 className="text-xl font-gilda font-semibold text-[#0D1B2A] mb-3">
              Complete Transparency
            </h3>
            <p className="text-gray-600">
              We show you ALL options including repricing and staying put - even the ones that make us nothing.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#F0F4FA] rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-[#4A90E2]" />
            </div>
            <h3 className="text-xl font-gilda font-semibold text-[#0D1B2A] mb-3">
              AI Analysis of All 286 Packages
            </h3>
            <p className="text-gray-600">
              Mathematical precision and speed - comprehensive market coverage with transparent recommendations.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#F0F4FA] rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-[#4A90E2]" />
            </div>
            <h3 className="text-xl font-gilda font-semibold text-[#0D1B2A] mb-3">
              24-Hour Response Guarantee
            </h3>
            <p className="text-gray-600">
              Complete analysis within 48 hours - your lifetime mortgage optimization partner.
            </p>
          </div>
        </div>

        <div className="mt-16 bg-[#F5F7FA] rounded-2xl p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-gilda font-bold text-[#0D1B2A] mb-4">
                Mathematical Analysis Without Broker Bias
              </h3>
              <p className="text-gray-600 mb-6">
                We earn referral fees only when you switch banks, but we&apos;ll recommend repricing or staying put if that&apos;s your best option.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#contact"
                  className="bg-[#4A90E2] hover:bg-[#3A80D2] text-white px-6 py-3 rounded-md font-medium transition text-center"
                >
                  See ALL Your Options - Free
                </a>
                <a
                  href="/dashboard"
                  className="border border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2] hover:text-white px-6 py-3 rounded-md font-medium transition text-center"
                >
                  Try Calculator
                </a>
              </div>
            </div>
            <div className="text-center lg:text-right">
              <div className="inline-block bg-white rounded-xl p-6 shadow-lg">
                <div className="text-3xl font-gilda font-bold text-[#4A90E2] mb-2">$34,560</div>
                <div className="text-sm text-gray-600">Average savings per customer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ServicesSection
