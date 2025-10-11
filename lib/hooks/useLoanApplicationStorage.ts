'use client'

import { useEffect } from 'react'
import { LoanApplicationData } from './useLoanApplicationContext'

const STORAGE_KEY = 'nextnest_loan_application'
const STORAGE_VERSION = '1.0'

export interface StoredApplicationData extends LoanApplicationData {
  version: string
  lastUpdated: string
}

/**
 * Persists loan application data to localStorage
 * Ensures data survives page refreshes and viewport changes
 */
export function useLoanApplicationStorage(
  data: LoanApplicationData,
  sessionId: string
) {
  // Save to localStorage whenever data changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedData: StoredApplicationData = {
      ...data,
      version: STORAGE_VERSION,
      lastUpdated: new Date().toISOString()
    }

    try {
      localStorage.setItem(
        `${STORAGE_KEY}_${sessionId}`,
        JSON.stringify(storedData)
      )
    } catch (error) {
      console.error('Failed to save loan application data:', error)
    }
  }, [data, sessionId])

  // Clean up old sessions (older than 7 days)
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const now = Date.now()
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_KEY)) {
          const item = localStorage.getItem(key)
          if (item) {
            try {
              const parsed = JSON.parse(item) as StoredApplicationData
              const lastUpdated = new Date(parsed.lastUpdated).getTime()
              if (lastUpdated < sevenDaysAgo) {
                localStorage.removeItem(key)
              }
            } catch {
              // Invalid data, remove it
              localStorage.removeItem(key)
            }
          }
        }
      })
    } catch (error) {
      console.error('Failed to clean up old sessions:', error)
    }
  }, [])
}

/**
 * Retrieves loan application data from localStorage
 */
export function retrieveLoanApplicationData(
  sessionId: string
): LoanApplicationData | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${sessionId}`)
    if (!stored) return null

    const parsed = JSON.parse(stored) as StoredApplicationData

    // Check version compatibility
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('Stored data version mismatch, ignoring cached data')
      return null
    }

    // Remove storage metadata before returning
    const { version, lastUpdated, ...applicationData } = parsed
    return applicationData as LoanApplicationData
  } catch (error) {
    console.error('Failed to retrieve loan application data:', error)
    return null
  }
}

/**
 * Clears loan application data from localStorage
 */
export function clearLoanApplicationData(sessionId: string) {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(`${STORAGE_KEY}_${sessionId}`)
  } catch (error) {
    console.error('Failed to clear loan application data:', error)
  }
}