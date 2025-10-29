// ABOUTME: Standardized navigation component for form flow pages
// ABOUTME: Provides consistent "Back to Home" and "Get Started" CTAs across loan selector and form steps

'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Logo from '@/public/images/logos/nn-logo-nobg-img.png'

interface FormNavProps {
  /**
   * Show "Get Started" button (yellow CTA)
   * - true: Show button (for loan selector page)
   * - false: Hide button (for form steps - user is already in form)
   */
  showGetStarted?: boolean
  /**
   * Override "Get Started" button behavior
   * - Default: Scrolls to #loan-selector or stays on page
   * - Custom: Provide onClick handler
   */
  onGetStartedClick?: () => void
  /**
   * Current form step (1-4) for context
   * - Used for analytics/tracking
   * - Optional: Only provide if on actual form step
   */
  currentStep?: number
}

export function FormNav({
  showGetStarted = false,
  onGetStartedClick,
  currentStep
}: FormNavProps) {
  const router = useRouter()

  const handleGetStartedClick = () => {
    if (onGetStartedClick) {
      onGetStartedClick()
    } else {
      // Default: Scroll to loan selector if on /apply page
      const loanSelector = document.getElementById('loan-selector')
      if (loanSelector) {
        loanSelector.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <nav className="fixed top-0 w-full h-14 sm:h-16 bg-white border-b border-[#E5E5E5] z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">

        {/* Left: Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={Logo}
            alt="NextNest Logo"
            className="h-5 sm:h-10 w-auto max-w-[200px]"
            priority
          />
        </Link>

        {/* Right: Back to Home + Optional Get Started */}
        <div className="flex items-center gap-4">
          {/* Back to Home - Always visible */}
          <Link
            href="/"
            className="min-h-[44px] flex items-center text-sm text-[#666666] hover:text-[#000000] transition-colors"
          >
            Back to Home
          </Link>

          {/* Get Started CTA - Conditional */}
          {showGetStarted && (
            <button
              onClick={handleGetStartedClick}
              className="min-h-[44px] px-6 flex items-center bg-[#FCD34D] text-[#000000] text-sm font-semibold hover:bg-[#FBB614] transition-colors"
            >
              Get Started →
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
