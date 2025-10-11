/**
 * AI Broker Insights Page
 * Displays analysis results after form submission
 * Responsive: Shows mobile or desktop UI based on viewport
 */

import React from 'react'
import { headers } from 'next/headers'
import { InsightsPageClient } from './InsightsPageClient'

// Server-side mobile detection
function getServerSideMobileDetection(): boolean {
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || ''
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  return mobileRegex.test(userAgent)
}

export default function InsightsPage() {
  const isMobileSSR = getServerSideMobileDetection()

  return <InsightsPageClient initialMobileState={isMobileSSR} />
}