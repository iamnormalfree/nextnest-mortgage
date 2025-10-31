// Global type declarations for the NextNest application

declare global {
  interface Window {
    // Analytics tools
    gtag?: (command: string, action: string, options?: any) => void
    fbq?: (...args: any[]) => void
    conversions?: any

    // Chatwoot
    $chatwoot?: any
    chatwootSettings?: any
    chatwootSDK?: any
  }
}

export {}