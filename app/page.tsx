'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import HeroSection from '@/components/HeroSection'
import ServicesSection from '@/components/ServicesSection'
import ContactSection from '@/components/ContactSection'
import { FEATURE_FLAGS } from '@/lib/features/feature-flags'

// Dynamic import for sophisticated flow - code splitting for performance
const SophisticatedFlowPage = dynamic(
  () => import('@/app/redesign/sophisticated-flow/page'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent"></div>
          <p className="mt-4 text-sm text-graphite">Loading...</p>
        </div>
      </div>
    )
  }
)

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Show loading skeleton during hydration to prevent flash
  if (!isClient) {
    return (
      <main>
        <HeroSection />
        <ServicesSection />
        <ContactSection />
      </main>
    )
  }

  // Feature flag check happens on client side
  if (FEATURE_FLAGS.USE_SOPHISTICATED_FLOW) {
    return <SophisticatedFlowPage />
  }

  // Legacy UI (SSR-compatible)
  return (
    <main>
      <HeroSection />
      <ServicesSection />
      <ContactSection />
    </main>
  )
}
