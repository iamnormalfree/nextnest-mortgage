'use client'

import { useEffect, useRef } from 'react'

// Global Window interface declarations moved to types/global.d.ts

interface ChatwootWidgetProps {
  websiteToken?: string
  baseUrl?: string
  locale?: string
  position?: 'left' | 'right'
  hideMessageBubble?: boolean
  autoOpen?: boolean
}

export default function ChatwootWidget({
  websiteToken = 'SBSfsRrvWSyzfVUXv7QKjoa2',
  baseUrl = 'https://chat.nextnest.sg',
  locale = 'en',
  position = 'right',
  hideMessageBubble = false,
  autoOpen = false
}: ChatwootWidgetProps = {}) {
  const scriptLoadedRef = useRef(false)

  useEffect(() => {
    // Check if already loaded
    if (scriptLoadedRef.current || window.$chatwoot) {
      console.log('Chatwoot already loaded')
      if (autoOpen && window.$chatwoot) {
        setTimeout(() => {
          window.$chatwoot.toggle('open')
        }, 500)
      }
      return
    }

    // Configure Chatwoot settings
    window.chatwootSettings = {
      hideMessageBubble,
      position,
      locale,
      type: 'standard',
    }

    // Create the initialization function
    const initChatwoot = () => {
      const d = document
      const t = 'script'
      const BASE_URL = baseUrl
      const g = d.createElement(t) as HTMLScriptElement
      const s = d.getElementsByTagName(t)[0]
      
      g.src = BASE_URL + '/packs/js/sdk.js'
      g.defer = true
      g.async = true
      
      if (s && s.parentNode) {
        s.parentNode.insertBefore(g, s)
      }
      
      g.onload = () => {
        console.log('Chatwoot SDK loaded')
        scriptLoadedRef.current = true
        
        if (window.chatwootSDK) {
          window.chatwootSDK.run({
            websiteToken,
            baseUrl: BASE_URL
          })
          console.log('Chatwoot initialized with token:', websiteToken)
          
          // Auto-open if requested
          if (autoOpen) {
            setTimeout(() => {
              if (window.$chatwoot) {
                window.$chatwoot.toggle('open')
                console.log('Chatwoot opened automatically')
              }
            }, 1000)
          }
        }
      }
      
      g.onerror = () => {
        console.error('Failed to load Chatwoot SDK')
      }
    }

    // Initialize Chatwoot
    console.log('Initializing Chatwoot widget...')
    initChatwoot()

    // Cleanup function
    return () => {
      // Only cleanup if we're unmounting (not on re-renders)
      if (scriptLoadedRef.current) {
        const scripts = document.querySelectorAll(`script[src*="${baseUrl}/packs/js/sdk.js"]`)
        scripts.forEach(s => s.remove())
        
        const widgetBubble = document.querySelector('.woot-widget-bubble')
        if (widgetBubble) widgetBubble.remove()
        
        const widgetHolder = document.querySelector('.woot-widget-holder')
        if (widgetHolder) widgetHolder.remove()
        
        const widgetContainer = document.querySelector('.woot--bubble-holder')
        if (widgetContainer) widgetContainer.remove()
        
        delete window.$chatwoot
        delete window.chatwootSDK
        delete window.chatwootSettings
        
        scriptLoadedRef.current = false
        console.log('Chatwoot cleaned up')
      }
    }
  }, [websiteToken, baseUrl, locale, position, hideMessageBubble, autoOpen])

  return null
}