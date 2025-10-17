'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'

// Inline type declarations for Railway build environment
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    $chatwoot?: any
    chatwootSettings?: any
  }
}

interface ChatWidgetConfig {
  baseUrl: string
  websiteToken: string
  conversationId: number
  locale: 'en'
  position: 'right' | 'left'
  hideMessageBubble: boolean
  customAttributes: Record<string, any>
}

interface ChatWidgetLoaderProps {
  config: ChatWidgetConfig
  autoOpen?: boolean
  onLoad: () => void
  onError: (error: Error) => void
}

export default function ChatWidgetLoader({
  config,
  autoOpen = true,
  onLoad,
  onError
}: ChatWidgetLoaderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const scriptLoadedRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const isDevelopment = process.env.NODE_ENV === 'development'

  // All useCallback hooks must be defined BEFORE useEffect to avoid "used before declaration" errors
  const handleWidgetReady = useCallback(() => {
    setIsLoading(false)
    setHasError(false)

    // Track successful load
    if (window.gtag) {
      window.gtag('event', 'chat_widget_loaded', {
        event_category: 'engagement',
        event_label: 'chatwoot',
        value: 1
      })
    }

    onLoad()
  }, [onLoad])

  const cleanup = useCallback(() => {
    console.log('Cleaning up Chatwoot widget...')

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Remove Chatwoot elements
    const chatwootContainer = document.getElementById('chatwoot_live_chat_widget')
    if (chatwootContainer) {
      chatwootContainer.remove()
    }

    // Remove Chatwoot bubble
    const chatwootBubble = document.querySelector('.woot-widget-bubble')
    if (chatwootBubble) {
      chatwootBubble.remove()
    }

    // Remove script element
    const scriptElement = document.querySelector(`script[src*="${config.baseUrl}/packs/js/sdk.js"]`)
    if (scriptElement) {
      scriptElement.remove()
    }

    // Clear global objects
    if (window.$chatwoot) {
      delete window.$chatwoot
    }
    if (window.chatwootSettings) {
      delete window.chatwootSettings
    }

    scriptLoadedRef.current = false
  }, [config.baseUrl])

  const handleLoadError = useCallback((error: Error) => {
    console.error('Chat widget load error:', error)
    console.error('Config being used:', {
      baseUrl: config.baseUrl,
      websiteToken: config.websiteToken,
      conversationId: config.conversationId
    })
    setIsLoading(false)
    setHasError(true)

    // Clear timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Retry logic with exponential backoff
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current++
      const retryDelay = Math.min(2000 * Math.pow(2, retryCountRef.current - 1), 10000)
      console.log(`Retrying widget load (attempt ${retryCountRef.current}/${maxRetries}) in ${retryDelay}ms...`)

      setTimeout(() => {
        cleanup()
        const cancelled = { value: false }
        loadChatwootScript(cancelled)
      }, retryDelay)
    } else {
      // Track failed load
      if (window.gtag) {
        window.gtag('event', 'chat_widget_error', {
          event_category: 'errors',
          event_label: error.message,
          value: 0
        })
      }

      onError(error)
    }
  }, [config, cleanup, onError]) // loadChatwootScript will be added when it's defined

  const loadChatwootScript = useCallback(async (cancelled: { value: boolean }) => {
    try {
      console.log('Loading Chatwoot widget script...')

      // Early exit if already cancelled
      if (cancelled.value) {
        console.log('Load cancelled before start')
        return
      }

      setIsLoading(true)
      setHasError(false)

      // First, do a quick health check to see if the server is reachable
      if (!isDevelopment || config.baseUrl.includes('localhost')) {
        try {
          const healthCheckUrl = `${config.baseUrl}/api/v1/widget/config?website_token=${config.websiteToken}`
          console.log('Checking Chatwoot server availability...')
          const controller = new AbortController()
          const healthTimeout = setTimeout(() => controller.abort(), 5000)

          const healthResponse = await fetch(healthCheckUrl, {
            signal: controller.signal,
            mode: 'no-cors' // Use no-cors to avoid CORS issues during health check
          })
          clearTimeout(healthTimeout)
          console.log('Chatwoot server appears to be reachable')
        } catch (healthError) {
          console.warn('Chatwoot server health check failed:', healthError)
          if (isDevelopment) {
            console.warn('In development mode - showing fallback UI')
            // In development, fail fast if server is not reachable
            handleLoadError(new Error(`Development: Chatwoot server at ${config.baseUrl} is not reachable`))
            return
          }
          // In production, continue anyway - the widget might still load
        }
      }

      // Set timeout for widget loading (increased to 30 seconds for slower connections)
      timeoutRef.current = setTimeout(() => {
        if (!scriptLoadedRef.current) {
          handleLoadError(new Error(`Widget loading timeout - unable to reach ${config.baseUrl}`))
        }
      }, 30000)

      // Configure Chatwoot before script loads
      window.chatwootSettings = {
        hideMessageBubble: config.hideMessageBubble,
        position: config.position,
        locale: config.locale,
        type: 'expanded_bubble',

        // Custom attributes for context
        customAttributes: {
          ...config.customAttributes,
          conversationId: config.conversationId,
          source: 'progressive_form'
        },

        // Event handlers
        onLoad: () => {
          console.log('Chatwoot widget loaded successfully')
          clearTimeout(timeoutRef.current!)
          scriptLoadedRef.current = true
          setIsLoading(false)

          // Auto-open chat if requested
          if (autoOpen && window.$chatwoot) {
            setTimeout(() => {
              try {
                window.$chatwoot.toggle('open')
                console.log('Chat widget opened automatically')
              } catch (err) {
                console.error('Failed to auto-open chat:', err)
              }
            }, 500)
          }

          handleWidgetReady()
        },

        onError: (error: any) => {
          console.error('Chatwoot widget error:', error)
          handleLoadError(new Error('Widget initialization failed'))
        }
      }

      // Check again if cancelled before DOM manipulation
      if (cancelled.value) {
        console.log('Load cancelled before script creation')
        return
      }

      // Check if script element already exists
      const existingScript = document.querySelector(`script[src*="${config.baseUrl}/packs/js/sdk.js"]`)
      if (existingScript) {
        console.log('Removing existing Chatwoot script')
        existingScript.remove()
      }

      // First check if the Chatwoot server is reachable
      console.log(`Attempting to load widget from: ${config.baseUrl}`)

      // Load Chatwoot script
      const script = document.createElement('script')
      script.src = `${config.baseUrl}/packs/js/sdk.js`
      script.defer = true
      script.async = true

      script.onerror = (e) => {
        clearTimeout(timeoutRef.current!)
        console.error('Script load error:', e)
        handleLoadError(new Error(`Failed to load chat widget script from ${config.baseUrl}/packs/js/sdk.js - Server may be unreachable`))
      }

      // Add website token as data attribute
      script.setAttribute('data-website-token', config.websiteToken)

      // Final check before adding to DOM
      if (!cancelled.value) {
        document.head.appendChild(script)
        console.log('Chatwoot script element added to DOM')
      } else {
        console.log('Load cancelled before adding script to DOM')
      }

    } catch (error) {
      handleLoadError(error as Error)
    }
  }, [config.baseUrl, config.websiteToken, isDevelopment, autoOpen, handleWidgetReady, handleLoadError])

  useEffect(() => {
    // Check if widget is already loaded
    if (window.$chatwoot && scriptLoadedRef.current) {
      console.log('Chatwoot widget already loaded')
      handleWidgetReady()
      return
    }

    // In development, check if we should use mock mode
    if (isDevelopment && config.baseUrl === 'https://chat.nextnest.sg') {
      console.warn('⚠️ Development Mode: Chatwoot server may not be accessible')
      console.warn('💡 Tip: Set up a local Chatwoot instance or use a staging server')
      console.warn('📧 Fallback contact: assist@nextnest.sg | 📱 +65 8334 1445')
    }

    // Add a flag to prevent double loading in StrictMode
    const cancelled = { value: false }

    const load = async () => {
      if (!cancelled.value) {
        await loadChatwootScript(cancelled)
      }
    }

    load()

    return () => {
      cancelled.value = true
      // Only cleanup if in production or if widget actually loaded
      if (!isDevelopment || scriptLoadedRef.current) {
        cleanup()
      }
    }
  }, [config.baseUrl, config.websiteToken, autoOpen, isDevelopment, handleWidgetReady, cleanup, loadChatwootScript])

  // Public methods exposed via ref
  const openChat = () => {
    if (window.$chatwoot && scriptLoadedRef.current) {
      try {
        window.$chatwoot.toggle('open')
        return true
      } catch (err) {
        console.error('Failed to open chat:', err)
        return false
      }
    }
    return false
  }

  const closeChat = () => {
    if (window.$chatwoot && scriptLoadedRef.current) {
      try {
        window.$chatwoot.toggle('close')
        return true
      } catch (err) {
        console.error('Failed to close chat:', err)
        return false
      }
    }
    return false
  }

  const sendMessage = (message: string) => {
    if (window.$chatwoot && scriptLoadedRef.current) {
      try {
        // This would require Chatwoot API support
        console.log('Sending message:', message)
        return true
      } catch (err) {
        console.error('Failed to send message:', err)
        return false
      }
    }
    return false
  }

  // Loading indicator (optional - widget loads in background)
  if (isLoading && !scriptLoadedRef.current) {
    return null // Hide loading indicator to prevent visual clutter
  }

  // Error state with more details
  if (hasError && retryCountRef.current >= maxRetries) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-amber-100 text-amber-700 shadow-lg p-4 max-w-sm">
          <div className="font-semibold mb-1">
            {isDevelopment ? 'Development: Chat Server Unreachable' : 'Chat temporarily unavailable'}
          </div>
          <div className="text-xs">
            {isDevelopment && (
              <div className="mb-2 text-amber-600">
                Chatwoot server at {config.baseUrl} is not accessible.
                <br />Check your .env.local configuration.
              </div>
            )}
            Please try refreshing the page or contact us at:
            <div className="mt-1">📞 +65 8334 1445</div>
            <div>✉️ assist@nextnest.sg</div>
          </div>
        </div>
      </div>
    )
  }

  // Widget loads invisibly in the page
  return null
}