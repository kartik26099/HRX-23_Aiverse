"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Download, Share2, Eye, ExternalLink } from 'lucide-react'

interface ExcalidrawDiagramProps {
  diagramData: any
  projectTitle: string
  onClose?: () => void
}

export default function ExcalidrawDiagram({ diagramData, projectTitle, onClose }: ExcalidrawDiagramProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create a data URL for the diagram
  const createExcalidrawURL = () => {
    try {
      // Convert our diagram data to Excalidraw format
      const excalidrawData = {
        type: "excalidraw",
        version: 2,
        source: "DIY Project Generator",
        elements: diagramData.elements || [],
        appState: {
          viewBackgroundColor: "#ffffff",
          gridSize: 20,
          theme: "light",
          ...diagramData.appState
        }
      }

      // Encode the data for URL
      const encodedData = encodeURIComponent(JSON.stringify(excalidrawData))
      return `https://excalidraw.com/#json=${encodedData}`
    } catch (err) {
      console.error('Error creating Excalidraw URL:', err)
      setError('Failed to create diagram URL')
      return null
    }
  }

  const excalidrawURL = createExcalidrawURL()

  const handleExport = () => {
    if (excalidrawURL) {
      window.open(excalidrawURL, '_blank')
    }
  }

  const handleShare = () => {
    if (excalidrawURL) {
      navigator.clipboard.writeText(excalidrawURL)
      // You could add a toast notification here
    }
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Diagram</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Project Workflow Diagram
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!excalidrawURL}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Excalidraw
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={!excalidrawURL}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          {onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading diagram...</span>
          </div>
        )}
        
        {excalidrawURL ? (
          <div className="w-full h-96 border rounded-lg overflow-hidden">
            <iframe
              src={excalidrawURL}
              className="w-full h-full"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setError('Failed to load diagram')
                setIsLoading(false)
              }}
              title="Project Workflow Diagram"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Diagram not available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 