// ABOUTME: Responsive layout hook for mobile/tablet/desktop detection with SSR safety

'use client'

import { useState, useEffect } from 'react'

interface ResponsiveLayout {
  isMobile: boolean    // <768px
  isTablet: boolean    // 768-1023px
  isDesktop: boolean   // ≥1024px
  width: number
}

export function useResponsiveLayout(): ResponsiveLayout {
  const [layout, setLayout] = useState<ResponsiveLayout>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,  // Default to desktop for SSR
    width: typeof window !== 'undefined' ? window.innerWidth : 1024
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth

      setLayout({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width
      })
    }

    // Initial check on mount
    handleResize()

    // Listen for window resize events
    window.addEventListener('resize', handleResize)

    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return layout
}
