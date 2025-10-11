import React from 'react'
import { ArrowRight, TrendingUp, Shield, Calculator } from 'lucide-react'

// Example showing Tailwind classes with Bloomberg Terminal design
export default function BloombergHeroExample() {
  return (
    <section className="hero-gradient py-8 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-6 items-center">

          {/* Left: Content */}
          <div>
            <div className="inline-block px-3 py-1 bg-gold/10 text-gold text-xs uppercase tracking-wider font-medium mb-2">
              AI-Powered Intelligence
            </div>

            <h1 className="text-4xl md:text-5xl font-light text-ink leading-tight mb-2">
              Singapore&apos;s Smartest
              <br />
              Mortgage Platform
            </h1>

            <p className="text-lg text-charcoal mb-6">
              Real-time analysis of <span className="font-mono font-medium">286</span> packages.
              Complete transparency. Mathematical precision.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button className="h-12 px-8 bg-gold text-ink font-medium text-sm flex items-center justify-center gap-2 hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                Start Free Analysis
                <ArrowRight className="w-5 h-5" />
              </button>

              <button className="h-12 px-8 bg-transparent text-charcoal border border-fog font-medium text-sm hover:bg-mist transition-all duration-200">
                View Demo
              </button>
            </div>
          </div>

          {/* Right: Metric Card */}
          <div className="bg-white border border-fog p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs text-silver uppercase tracking-wider font-medium">
                Live Analysis
              </h3>
              <span className="px-3 py-1 bg-emerald text-white text-xs uppercase">
                Real-time
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-mist">
                <div className="text-xs text-silver mb-1">Current Rate</div>
                <div className="text-2xl font-mono font-medium text-ink">2.6%</div>
              </div>

              <div className="p-4 bg-mist">
                <div className="text-xs text-silver mb-1">Optimal Rate</div>
                <div className="text-2xl font-mono font-medium text-gold">1.4%</div>
              </div>

              <div className="p-4 bg-mist">
                <div className="text-xs text-silver mb-1">Monthly Savings</div>
                <div className="text-2xl font-mono font-medium text-ink">$480</div>
              </div>
            </div>

            <div className="text-center mt-6">
              <div className="text-xs text-silver mb-1">Lifetime Savings</div>
              <div className="text-3xl font-mono font-medium gradient-gold">$34,560</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// Example of using cn() from shadcn/ui for conditional classes
import { cn } from '@/lib/utils'

export function BloombergButton({
  variant = 'primary',
  className,
  children,
  ...props
}: {
  variant?: 'primary' | 'secondary'
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      className={cn(
        // Base styles
        "h-12 px-8 font-medium text-sm transition-all duration-200",
        // Variant styles
        variant === 'primary' && "bg-gold text-ink hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98]",
        variant === 'secondary' && "bg-transparent text-charcoal border border-fog hover:bg-mist",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}