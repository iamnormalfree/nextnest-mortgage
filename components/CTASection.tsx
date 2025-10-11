export default function CTASection() {
  return (
    <section className="py-16 bg-white border-t border-fog">
      <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
        <h2 className="text-2xl font-light text-ink mb-2">
          Ready to optimize?
        </h2>
        <p className="text-base text-graphite mb-8">
          Join thousands who&apos;ve saved with intelligent mortgage analysis
        </p>
        <a
          href="/apply?loanType=new_purchase"
          className="h-12 px-8 bg-gold text-ink font-medium hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98] inline-flex items-center justify-center transition-all duration-200"
        >
          Get Your Free Analysis →
        </a>
      </div>
    </section>
  )
}