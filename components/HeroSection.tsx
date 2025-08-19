import { Clock, Users, Star } from './icons'

const HeroSection = () => {
  return (
    <section className="header-offset bg-[#FAF9F8]" id="hero" style={{
      paddingTop: '120px',
      paddingBottom: '64px'
    }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          {/* Left side content */}
          <div className="lg:w-1/2 mb-12 lg:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-gilda font-bold text-[#0D1B2A] leading-tight mb-6">
              Mortgages work
              <br />
              better here.
            </h1>

            <div className="flex flex-col sm:flex-row items-start space-y-8 sm:space-y-0 sm:space-x-10 mb-10">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full bg-[#F0F4FA] flex items-center justify-center">
                    <Clock className="h-5 w-5 text-[#4A90E2]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-gilda font-semibold text-[#0D1B2A]">Save 1.5% APR*</h3>
                  <p className="text-gray-600 text-sm mt-1 font-sans">
                    on your HDB or private property loan.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-10 h-10 rounded-full bg-[#F0F4FA] flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#4A90E2]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-gilda font-semibold text-[#0D1B2A]">Expert-backed advice</h3>
                  <p className="text-gray-600 text-sm mt-1 font-sans">with personalized loan analysis.</p>
                </div>
              </div>
            </div>

            <a
              href="#contact"
              className="inline-block bg-[#4A90E2] hover:bg-[#3A80D2] text-white font-medium py-3 px-8 rounded-md text-center transition font-sans"
            >
              Get started
            </a>

            <p className="text-xs text-gray-500 mt-4 font-sans">
              *Rates subject to change. Average customer savings compared to standard bank rates.
            </p>

            <div className="flex flex-wrap items-center space-x-8 mt-12">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-gilda font-normal text-[#0D1B2A]">500+</span>
                <span className="text-sm text-gray-500 font-sans">Happy clients</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-2xl font-gilda font-normal text-[#0D1B2A]">$500M+</span>
                <span className="text-sm text-gray-500 font-sans">In total loans</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-2xl font-gilda font-normal text-[#0D1B2A] flex items-center">
                  4.9 <Star className="h-4 w-4 ml-1" />
                </span>
                <span className="text-sm text-gray-500 font-sans">Google Reviews</span>
              </div>
            </div>
          </div>

          {/* Right side content */}
          <div className="lg:w-1/2 lg:pl-10">
            <div className="relative w-full max-w-md mx-auto transform rotate-3 hover:rotate-0 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#4A90E2]/20 to-[#0D1B2A]/10 rounded-3xl blur-xl transform -rotate-6 scale-95 z-0"></div>

              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 z-10 relative">
                <div className="p-6">
                  <div className="bg-[#F5F7FA] rounded-xl p-5">
                    <h3 className="text-lg font-gilda font-normal text-[#0D1B2A] mb-3">
                      Your mortgage overview
                    </h3>

                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-sans">Current rate</span>
                          <span className="font-medium text-[#0D1B2A] font-sans">2.6%</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-sans">Recommended rate</span>
                          <span className="font-medium text-green-600 font-sans">1.4%</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-sans">Monthly savings</span>
                          <span className="font-medium text-green-600 font-sans">$480</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-sans">Lock-in period</span>
                          <span className="font-medium text-[#0D1B2A] font-sans">2 years</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-5 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-[#0D1B2A] font-sans">
                          Total savings over loan
                        </span>
                        <span className="font-bold text-lg text-green-600 font-gilda">$34,560</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 items-center justify-center mt-6">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-[#4A90E2] rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
