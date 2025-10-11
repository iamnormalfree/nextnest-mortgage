'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook for responsive design that tracks window size changes
 * @param query - CSS media query string (e.g., '(max-width: 767px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia(query)
    
    // Set initial value
    setMatches(mediaQuery.matches)

    // Create event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener
    mediaQuery.addEventListener('change', handleChange)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [query])

  return matches
}

// Mobile-specific media query hook
export function useMobileView(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

// Tablet view hook
export function useTabletView(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

// Desktop view hook
export function useDesktopView(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}