export default function FeatureCards() {
  const features = [
    {
      title: 'Real-time Analysis',
      description: 'Market data updated every 15 minutes from 23 banks',
      metric: '99.9%',
      metricLabel: 'Accuracy'
    },
    {
      title: 'Complete Transparency',
      description: 'See all options including staying with your current bank',
      metric: '100%',
      metricLabel: 'Coverage'
    },
    {
      title: 'AI-Powered Insights',
      description: 'GPT-4 analyzes your unique situation for optimal timing',
      metric: '<3s',
      metricLabel: 'Processing'
    },
    {
      title: 'Lifetime Partnership',
      description: 'Continuous monitoring and optimization throughout your loan',
      metric: '4.9/5',
      metricLabel: 'Rating'
    }
  ]

  return (
    <section className="py-12 md:py-16 bg-mist">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xl sm:text-2xl font-light text-ink mb-2">
              Why Intelligence Matters
            </h2>
            <p className="text-sm sm:text-base text-graphite">
              Our AI analyzes market conditions 24/7 to find your perfect moment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white border border-fog p-5 md:p-6 space-y-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-ink mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-graphite">
                      {feature.description}
                    </p>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <div className="font-mono text-base sm:text-lg font-medium text-gold">
                      {feature.metric}
                    </div>
                    <div className="text-xs text-silver">
                      {feature.metricLabel}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}