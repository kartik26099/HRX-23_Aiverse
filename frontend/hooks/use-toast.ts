"use client"

import { toast as sonnerToast } from "sonner"

// Simple toast function that uses sonner
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  warning: (message: string) => sonnerToast.warning(message),
  info: (message: string) => sonnerToast.info(message),
      }

// Fallback toast function if sonner is not available
export const fallbackToast = {
  success: (message: string) => {
    console.log("✅ Success:", message)
    // You can implement a custom toast here if needed
  },
  error: (message: string) => {
    console.error("❌ Error:", message)
    // You can implement a custom toast here if needed
  },
  warning: (message: string) => {
    console.warn("⚠️ Warning:", message)
    // You can implement a custom toast here if needed
  },
  info: (message: string) => {
    console.info("ℹ️ Info:", message)
    // You can implement a custom toast here if needed
  },
}

// Export the appropriate toast function
export default toast 