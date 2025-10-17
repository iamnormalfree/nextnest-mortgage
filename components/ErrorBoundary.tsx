// ABOUTME: React error boundary for graceful error handling in production
// ABOUTME: Prevents white screen of death and provides user-friendly fallback UI

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

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught error:', error, errorInfo)

    // Log to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-[#F8F8F8]">
          <div className="max-w-md w-full bg-white p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-black mb-2">
              Something went wrong
            </h2>
            <p className="text-[#666666] mb-6">
              We encountered an unexpected error. Please try again.
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full h-12 bg-[#FCD34D] hover:bg-[#FBB614] text-black font-semibold transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full h-12 border-2 border-[#E5E5E5] hover:border-[#666666] text-black font-semibold transition-colors"
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-[#666666] hover:text-black">
                  Error Details
                </summary>
                <pre className="mt-2 p-3 bg-[#F8F8F8] text-xs overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
