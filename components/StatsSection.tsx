'use client'

import AnimatedCounter from './AnimatedCounter'

export default function StatsSection() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 space-y-6 md:space-y-0">
          {/* Package Analysis */}
          <div className="text-center">
            <div className="mb-1">
              <span className="font-mono text-3xl font-medium text-gradient-gold">
                <AnimatedCounter end={286} duration={2000} />
              </span>
            </div>
            <div className="text-sm font-medium text-graphite">Packages</div>
            <div className="text-xs text-silver">Analyzed Daily</div>
          </div>

          {/* Average Savings */}
          <div className="text-center">
            <div className="mb-1">
              <span className="font-mono text-3xl font-medium text-gradient-gold">
                <AnimatedCounter end={34560} duration={2000} prefix="$" />
              </span>
            </div>
            <div className="text-sm font-medium text-graphite">Average Savings</div>
            <div className="text-xs text-silver">Per Customer</div>
          </div>

          {/* Response Time */}
          <div className="text-center">
            <div className="mb-1">
              <span className="font-mono text-3xl font-medium text-gradient-gold">
                <AnimatedCounter end={24} duration={2000} />
              </span>
            </div>
            <div className="text-sm font-medium text-graphite">Hour Response</div>
            <div className="text-xs text-silver">Guaranteed</div>
          </div>
        </div>
      </div>
    </section>
  )
}