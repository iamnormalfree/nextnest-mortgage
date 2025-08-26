import { CheckCircle, Shield, TrendingUp } from './icons'

const ServicesSection = () => {
  return (
    <section id="services" className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-gilda font-normal text-nn-grey-dark mb-4">
            Transparent Hybrid Intelligence System
          </h2>
          <p className="text-lg text-nn-grey-medium max-w-2xl mx-auto font-inter">
            AI efficiency and speed combined with human insight and complete transparency about incentives and options.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{background: 'rgba(15, 76, 117, 0.1)'}}>
              <CheckCircle className="h-8 w-8 text-nn-blue" />
            </div>
            <h3 className="text-xl font-gilda font-normal text-nn-grey-dark mb-3">
              Complete Transparency
            </h3>
            <p className="text-nn-grey-medium font-inter">
              We show you ALL options including repricing and staying put - even the ones that make us nothing.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{background: 'rgba(255, 184, 0, 0.1)'}}>
              <Shield className="h-8 w-8 text-nn-gold" />
            </div>
            <h3 className="text-xl font-gilda font-normal text-nn-grey-dark mb-3">
              AI Analysis of All 286 Packages
            </h3>
            <p className="text-nn-grey-medium font-inter">
              Mathematical precision and speed - comprehensive market coverage with transparent recommendations.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{background: 'rgba(107, 70, 193, 0.1)'}}>
              <TrendingUp className="h-8 w-8 text-nn-purple" />
            </div>
            <h3 className="text-xl font-gilda font-normal text-nn-grey-dark mb-3">
              24-Hour Response Guarantee
            </h3>
            <p className="text-nn-grey-medium font-inter">
              Complete analysis within 48 hours - your lifetime mortgage optimization partner.
            </p>
          </div>
        </div>

        <div className="mt-16 calculation-highlight p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-gilda font-normal text-nn-grey-dark mb-4">
                Mathematical Analysis Without Broker Bias
              </h3>
              <p className="text-nn-grey-medium font-inter mb-6">
                We earn referral fees only when you switch banks, but we&apos;ll recommend repricing or staying put if that&apos;s your best option.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#contact"
                  className="btn-primary"
                >
                  See ALL Your Options - Free
                </a>
                <a
                  href="/dashboard"
                  className="border-2 border-nn-gold text-nn-gold hover:bg-nn-gold hover:text-nn-grey-dark px-6 py-3 rounded-md font-medium transition text-center font-inter"
                >
                  Try Calculator
                </a>
              </div>
            </div>
            <div className="text-center lg:text-right">
              <div className="inline-block bg-white rounded-xl p-6 shadow-lg">
                <div className="text-3xl font-gilda font-normal text-nn-gold mb-2">$34,560</div>
                <div className="text-sm text-nn-grey-medium font-inter">Average savings per customer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ServicesSection
