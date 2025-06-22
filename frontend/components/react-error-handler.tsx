"use client"

import { useEffect } from 'react'

export function ReactErrorHandler() {
  useEffect(() => {
    // Patch React's internal DOM manipulation methods
    const patchReactDOM = () => {
      // Wait for React to be available
      if (typeof window !== 'undefined' && window.ReactDOM) {
        try {
          // Patch React's internal removeChildFromContainer if it exists
          const reactDOM = (window as any).ReactDOM
          if (reactDOM && reactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
            const internals = reactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
            if (internals.ReactDOMComponentTree) {
              const originalRemoveChildFromContainer = internals.ReactDOMComponentTree.removeChildFromContainer
              if (originalRemoveChildFromContainer) {
                internals.ReactDOMComponentTree.removeChildFromContainer = function(container: any, child: any) {
                  try {
                    if (child && container && container.contains && container.contains(child)) {
                      return originalRemoveChildFromContainer.call(this, container, child)
                    } else {
                      console.warn('React removeChildFromContainer: child not in container, skipping')
                      return child
                    }
                  } catch (error) {
                    console.warn('Error in React removeChildFromContainer, gracefully handling:', error)
                    return child
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn('Failed to patch React DOM methods:', error)
        }
      }
    }

    // Try to patch immediately
    patchReactDOM()

    // Also try after a delay in case React loads later
    const timeoutId = setTimeout(patchReactDOM, 1000)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  return null
}

// Global error handler for React-specific errors
export function setupReactErrorHandling() {
  if (typeof window === 'undefined') return

  // Override console.error to catch React errors
  const originalConsoleError = console.error
  console.error = (...args: any[]) => {
    const message = args.join(' ')
    
    // Check if it's a React DOM error
    if (message.includes('removeChild') || 
        message.includes('Failed to execute') ||
        message.includes('NotFoundError')) {
      console.warn('React DOM error intercepted:', message)
      // Don't call original console.error for these errors
      return
    }
    
    // Call original for other errors
    originalConsoleError.apply(console, args)
  }

  // Handle React error boundaries
  const originalErrorBoundary = (window as any).React?.Component?.prototype?.componentDidCatch
  if (originalErrorBoundary) {
    (window as any).React.Component.prototype.componentDidCatch = function(error: Error, errorInfo: any) {
      // Check if it's a DOM manipulation error
      const isDOMError = error.message.includes('removeChild') || 
                        error.message.includes('Failed to execute') ||
                        error.name === 'NotFoundError'
      
      if (isDOMError) {
        console.warn('React DOM error in componentDidCatch, attempting recovery...')
        // Try to recover by forcing a re-render
        setTimeout(() => {
          if (this.setState) {
            this.setState({ hasError: false })
          }
        }, 100)
        return
      }
      
      // Call original for other errors
      if (originalErrorBoundary) {
        originalErrorBoundary.call(this, error, errorInfo)
      }
    }
  }
} 