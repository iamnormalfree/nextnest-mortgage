export default function Footer() {
  return (
    <footer className="bg-white border-t border-fog py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-center sm:justify-between">
          <div className="text-xs sm:text-sm text-graphite text-center sm:text-left">
            © 2024 NextNest. Singapore&apos;s most transparent mortgage advisor.
          </div>
          <div className="flex gap-4 sm:gap-6">
            <a href="#" className="text-sm font-medium text-charcoal hover:text-gold transition-colors duration-200">
              Privacy
            </a>
            <a href="#" className="text-sm font-medium text-charcoal hover:text-gold transition-colors duration-200">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}