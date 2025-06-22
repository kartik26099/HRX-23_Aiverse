"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  isRecovering: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, isRecovering: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Check if it's a DOM manipulation error
    const isDOMError = error.message.includes('removeChild') || 
                      error.message.includes('Failed to execute') ||
                      error.name === 'NotFoundError'
    
    if (isDOMError) {
      console.warn('DOM manipulation error detected, attempting recovery...')
      // For DOM errors, try to recover automatically
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined, isRecovering: true })
        // Force a re-render after a short delay
        setTimeout(() => {
          this.setState({ isRecovering: false })
        }, 100)
      }, 100)
      return
    }
    
    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Check if it's a DOM manipulation error
      const isDOMError = this.state.error?.message.includes('removeChild') || 
                        this.state.error?.message.includes('Failed to execute') ||
                        this.state.error?.name === 'NotFoundError'

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {isDOMError ? 'Page Recovery' : 'Something went wrong'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isDOMError 
                ? 'The page encountered a display issue. Attempting to recover automatically...'
                : 'An unexpected error occurred. Please try refreshing the page.'
              }
            </p>
            
            {this.state.isRecovering && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  🔄 Recovering page state...
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Button onClick={this.handleReset} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
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

// Hook version for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled error caught:', event.error)
      
      // Check if it's a DOM manipulation error
      const isDOMError = event.error?.message?.includes('removeChild') || 
                        event.error?.message?.includes('Failed to execute') ||
                        event.error?.name === 'NotFoundError'
      
      if (isDOMError) {
        console.warn('DOM error detected, attempting to recover...')
        // For DOM errors, try to recover by forcing a re-render
        setTimeout(() => {
          setError(null)
        }, 100)
        return
      }
      
      setError(event.error)
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      setError(new Error(event.reason))
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return error
} 