import { useState, useCallback, useEffect } from 'react'

interface UseDialogStateOptions {
  onOpenChange?: (open: boolean) => void
  cleanupOnUnmount?: boolean
}

export function useDialogState(initialState = false, options: UseDialogStateOptions = {}) {
  const [isOpen, setIsOpen] = useState(initialState)
  const [data, setData] = useState<any>(null)

  const open = useCallback((newData?: any) => {
    try {
      setIsOpen(true)
      if (newData !== undefined) {
        setData(newData)
      }
      options.onOpenChange?.(true)
    } catch (error) {
      console.warn('Error opening dialog:', error)
    }
  }, [options])

  const close = useCallback(() => {
    try {
      setIsOpen(false)
      setData(null)
      options.onOpenChange?.(false)
    } catch (error) {
      console.warn('Error closing dialog:', error)
    }
  }, [options])

  const toggle = useCallback(() => {
    if (isOpen) {
      close()
    } else {
      open()
    }
  }, [isOpen, open, close])

  // Cleanup on unmount if requested
  useEffect(() => {
    if (options.cleanupOnUnmount) {
      return () => {
        try {
          setIsOpen(false)
          setData(null)
        } catch (error) {
          console.warn('Error during dialog cleanup:', error)
        }
      }
    }
  }, [options.cleanupOnUnmount])

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData
  }
} 