"use client"

import React, { useRef, useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, AlertCircle, Loader2, RefreshCw } from "lucide-react"

interface SentimentResult {
  success: boolean
  sentiment?: string
  confidence?: number
  message?: string
  error?: string
}

interface SentimentDetectorProps {
  isVisible: boolean
  onSentimentDetected: (result: SentimentResult) => void
}

export default function SentimentDetector({ isVisible, onSentimentDetected }: SentimentDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [captureAttempts, setCaptureAttempts] = useState(0)

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4009"

  useEffect(() => {
    if (isVisible) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isVisible])

  const startCamera = async () => {
    try {
      setError(null)
      setIsLoading(true)
      setCameraReady(false)
      setCaptureAttempts(0)

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true)
          setIsLoading(false)
        }

        videoRef.current.onerror = () => {
          setError("Failed to load camera feed")
          setIsLoading(false)
        }
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setError("Camera access denied. Please allow camera permissions and try again.")
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setCameraReady(false)
    setIsLoading(false)
  }

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      setError("Camera not ready. Please wait a moment and try again.")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) {
        throw new Error("Failed to get canvas context")
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8)

      // Send to backend
      const response = await fetch(`${BACKEND_URL}/api/detect-sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: SentimentResult = await response.json()
      
      if (result.success) {
        onSentimentDetected(result)
      } else {
        setError(result.error || "Failed to detect sentiment")
        setCaptureAttempts(prev => prev + 1)
      }
    } catch (err) {
      console.error('Capture error:', err)
      setError("Failed to capture image. Please try again.")
      setCaptureAttempts(prev => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  const retryCamera = () => {
    stopCamera()
    setTimeout(() => {
      startCamera()
    }, 1000)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Sentiment Detection</span>
          </CardTitle>
          <CardDescription>
            Position your face in the camera and capture your expression
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Camera Feed */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            {isLoading && !cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-white" />
                  <p className="text-white text-sm">Starting camera...</p>
                </div>
              </div>
            )}
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
            />
            
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
              </div>
              {captureAttempts > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Attempts: {captureAttempts}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={retryCamera}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Camera
            </Button>
            
            <Button
              onClick={captureImage}
              disabled={!cameraReady || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Sentiment
                </>
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>• Make sure your face is clearly visible</p>
            <p>• Ensure good lighting</p>
            <p>• Look directly at the camera</p>
            <p>• Allow camera permissions if prompted</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 