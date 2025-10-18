import { Clock, Users, Star } from './icons'

const HeroSection = () => {
  return (
    <section className="header-offset bg-nn-grey-light" id="hero" style={{
      paddingTop: '120px',
      paddingBottom: '64px'
    }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          {/* Left side content */}
          <div className="lg:w-1/2 mb-12 lg:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-gilda font-normal text-nn-grey-dark leading-tight mb-6">
              Singapore&apos;s <span className="text-nn-gold">Smartest</span>
              <br />
              Mortgage Intelligence
            </h1>
            <p className="text-xl text-nn-grey-medium mb-10 font-inter max-w-xl leading-relaxed">
              AI-powered analysis of 286 packages. Mathematical precision meets complete transparency.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <a
                href="#contact"
                className="btn-primary text-center"
              >
                See ALL Your Options - Free
              </a>
              <a
                href="/dashboard"
                className="btn-secondary self-start sm:self-auto"
              >
                Try Calculator
              </a>
            </div>

            <p className="text-sm text-nn-grey-medium font-inter opacity-75 max-w-md">
              We surface repricing, refinancing, or staying—the math decides.
            </p>
          </div>

          {/* Right side content */}
          <div className="lg:w-1/2 lg:pl-10">
            <div className="relative w-full max-w-md mx-auto transform rotate-3 hover:rotate-0 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-nn-blue/20 to-nn-grey-dark/10 rounded-3xl blur-xl transform -rotate-6 scale-95 z-0"></div>

              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-nn-grey-medium/20 z-10 relative">
                <div className="p-6">
                  <div className="bg-nn-grey-light rounded-xl p-5">
                    <h3 className="text-lg font-gilda font-normal text-nn-grey-dark mb-3">
                      Your mortgage overview
                    </h3>

                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-nn-grey-medium font-sans">Current rate</span>
                          <span className="font-medium text-nn-grey-dark font-sans">2.6%</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-nn-grey-medium font-sans">Recommended rate</span>
                          <span className="font-medium text-nn-green font-sans">1.4%</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-nn-grey-medium font-sans">Monthly savings</span>
                          <span className="font-medium text-nn-green font-sans">$480</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-nn-grey-medium font-sans">Lock-in period</span>
                          <span className="font-medium text-nn-grey-dark font-sans">2 years</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-5 border-t border-nn-grey-medium/30">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-nn-grey-dark font-sans">
                          Total savings over loan
                        </span>
                        <span className="font-bold text-lg text-nn-green font-gilda">$34,560</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2 items-center justify-center mt-6">
                    <div className="w-2 h-2 bg-nn-grey-medium/30 rounded-full"></div>
                    <div className="w-2 h-2 bg-nn-gold rounded-full"></div>
                    <div className="w-2 h-2 bg-nn-grey-medium/30 rounded-full"></div>
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
