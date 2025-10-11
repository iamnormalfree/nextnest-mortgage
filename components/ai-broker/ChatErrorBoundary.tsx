'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Chat Error Boundary caught error:', error, errorInfo)
    }

    // In production, you might want to send this to an error reporting service
    // Example: sendToErrorReporting(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI or provided fallback
      return this.props.fallback || (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-white border border-fog rounded-lg p-6 max-w-md w-full text-center">
            <div className="mb-4">
              <svg className="w-12 h-12 text-ruby mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-ink mb-2">Chat Temporarily Unavailable</h3>
            <p className="text-sm text-silver mb-4">
              We&apos;re experiencing technical difficulties with the chat system. Please try refreshing the page or continue with the form.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gold text-ink hover:bg-yellow-500 transition-all duration-200 text-sm font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}