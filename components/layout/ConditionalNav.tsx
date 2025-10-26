'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Image from 'next/image'
import Logo from '@/public/images/logos/nn-logo-nobg-img.png'
import { FEATURE_FLAGS } from '@/lib/features/feature-flags'

export function ConditionalNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Hide navigation for internal tools, redesign pages, and chat page
  if (pathname?.startsWith('/validation-dashboard') ||
      pathname?.startsWith('/redesign/') ||
      pathname?.startsWith('/chat')) {
    return null
  }

  // Hide navigation when sophisticated flow is active on homepage
  if (pathname === '/' && FEATURE_FLAGS.USE_SOPHISTICATED_FLOW) {
    return null
  }

  // Minimal header (logo only) for form flow - maximize focus & conversion
  if (pathname?.startsWith('/apply')) {
    return (
      <nav className="fixed top-0 w-full h-14 sm:h-16 bg-white border-b border-fog z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center">
          <a href="/" className="flex items-center">
            <Image
              src={Logo}
              alt="NextNest Logo"
              className="h-5 sm:h-10 w-auto max-w-[200px]"
              priority
            />
          </a>
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed top-0 w-full h-14 sm:h-16 bg-white border-b border-fog z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
        <div className="flex items-center">
          <a href="/" className="flex items-center">
            <Image
              src={Logo}
              alt="NextNest Logo"
              className="h-5 sm:h-10 w-auto max-w-[200px]"
              priority
            />
          </a>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#hero" className="text-sm font-medium text-charcoal hover:text-gold transition-colors duration-200">Home</a>
          <a href="#services" className="text-sm font-medium text-charcoal hover:text-gold transition-colors duration-200">Services</a>
          <a href="/apply?loanType=new_purchase" className="text-sm font-medium text-charcoal hover:text-gold transition-colors duration-200">Apply</a>

          <a href="/apply?loanType=new_purchase" className="btn-primary inline-flex items-center justify-center">
            Get Started →
          </a>
        </div>
        {/* Mobile menu */}
        <div className="md:hidden relative">
          <button
            onClick={() => setOpen(!open)}
            className="h-10 w-10 flex items-center justify-center text-charcoal hover:bg-mist transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Mobile menu dropdown */}
          {open && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setOpen(false)}
              />

              {/* Menu panel */}
              <div className="fixed top-16 right-4 w-64 bg-white border border-fog shadow-lg z-50 rounded-lg">
                <nav className="flex flex-col p-4">
                  <a
                    href="#hero"
                    onClick={() => setOpen(false)}
                    className="text-base font-medium text-charcoal hover:text-gold py-3 border-b border-mist"
                  >
                    Home
                  </a>
                  <a
                    href="#services"
                    onClick={() => setOpen(false)}
                    className="text-base font-medium text-charcoal hover:text-gold py-3 border-b border-mist"
                  >
                    Services
                  </a>
                  <a
                    href="/apply?loanType=new_purchase"
                    onClick={() => setOpen(false)}
                    className="text-base font-medium text-charcoal hover:text-gold py-3 border-b border-mist"
                  >
                    Apply
                  </a>
                  <a
                    href="/apply?loanType=new_purchase"
                    onClick={() => setOpen(false)}
                    className="h-12 px-6 bg-gold text-ink font-medium hover:bg-gold-dark flex items-center justify-center mt-4"
                  >
                    Get Started →
                  </a>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}