"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Smile, Frown, Meh, AlertCircle, X, Sparkles, Heart, Trophy, Zap, RefreshCw, Info } from 'lucide-react'

interface SentimentResult {
  success: boolean
  sentiment?: string
  confidence?: number
  message?: string
  error?: string
}

interface SentimentPopupProps {
  result: SentimentResult
  onClose: () => void
  onProjectChange?: () => void
  onDetailExplain?: () => void
  projectTitle?: string
  isProjectModified?: boolean
  modificationReason?: string
}

export default function SentimentPopup({ result, onClose, onProjectChange, onDetailExplain, projectTitle, isProjectModified, modificationReason }: SentimentPopupProps) {
  const sentimentIcons = {
    'Happy': <Smile className="h-8 w-8 text-green-500" />,
    'Sad': <Frown className="h-8 w-8 text-blue-500" />,
    'Neutral': <Meh className="h-8 w-8 text-gray-500" />,
    'Surprise': <AlertCircle className="h-8 w-8 text-yellow-500" />,
    'Fear': <AlertCircle className="h-8 w-8 text-orange-500" />,
    'Angry': <AlertCircle className="h-8 w-8 text-red-500" />,
    'Disgust': <Frown className="h-8 w-8 text-purple-500" />
  }

  const sentimentColors = {
    'Happy': 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    'Sad': 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    'Neutral': 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800',
    'Surprise': 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    'Fear': 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
    'Angry': 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    'Disgust': 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
  }

  const sentimentTextColors = {
    'Happy': 'text-green-800 dark:text-green-400',
    'Sad': 'text-blue-800 dark:text-blue-400',
    'Neutral': 'text-gray-800 dark:text-gray-400',
    'Surprise': 'text-yellow-800 dark:text-yellow-400',
    'Fear': 'text-orange-800 dark:text-orange-400',
    'Angry': 'text-red-800 dark:text-red-400',
    'Disgust': 'text-purple-800 dark:text-purple-400'
  }

  const getMotivationalIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Happy':
        return <Sparkles className="h-6 w-6 text-green-500" />
      case 'Sad':
        return <Heart className="h-6 w-6 text-blue-500" />
      case 'Neutral':
        return <Zap className="h-6 w-6 text-gray-500" />
      case 'Surprise':
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 'Fear':
        return <Heart className="h-6 w-6 text-orange-500" />
      case 'Angry':
        return <Zap className="h-6 w-6 text-red-500" />
      case 'Disgust':
        return <Sparkles className="h-6 w-6 text-purple-500" />
      default:
        return <Sparkles className="h-6 w-6 text-blue-500" />
    }
  }

  // Check if this sentiment should show project change options
  const shouldShowProjectOptions = result.sentiment === 'Sad' || result.sentiment === 'Surprise' || result.sentiment === 'Disgust' || result.sentiment === 'Angry' || result.sentiment === 'Fear'

  if (!result.success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Detection Failed</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              {result.error || 'Unable to detect your sentiment. Please try again.'}
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sentiment = result.sentiment || 'Neutral'
  const confidence = result.confidence || 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className={`w-full max-w-md mx-4 ${sentimentColors[sentiment as keyof typeof sentimentColors]}`}>
        <CardHeader className="text-center">
          <div className="flex justify-between items-start">
            <div></div>
            <CardTitle className={`text-xl font-bold ${sentimentTextColors[sentiment as keyof typeof sentimentTextColors]}`}>
              Sentiment Analysis
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-gray-600">
            {projectTitle && `How you feel about "${projectTitle}"`}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Sentiment Display */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {sentimentIcons[sentiment as keyof typeof sentimentIcons] || <Smile className="h-8 w-8 text-gray-500" />}
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${sentimentTextColors[sentiment as keyof typeof sentimentTextColors]}`}>
                {sentiment}
              </h3>
              {confidence > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Confidence: {Math.round(confidence * 100)}%
                </p>
              )}
            </div>
          </div>

          {/* Motivational Message */}
          {result.message && (
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border">
              <div className="flex items-start space-x-3">
                {getMotivationalIcon(sentiment)}
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Your Project Journey
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {result.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Project Change Options for Sad and Surprise */}
          {shouldShowProjectOptions && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-4">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                    Project Adjustment
                  </h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {sentiment === 'Sad' 
                      ? "You seem a bit down about this project. Would you like to try something different?"
                      : sentiment === 'Surprise'
                        ? "You look surprised! Would you like to adjust the project to better match your expectations?"
                        : sentiment === 'Disgust'
                          ? "You look disgusted! Would you like to adjust the project to better match your expectations?"
                          : sentiment === 'Angry'
                            ? "You seem frustrated with this project. Would you like to try a different approach?"
                            : "You look a bit overwhelmed! Would you like to simplify this project?"
                    }
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {onProjectChange && (
                  <Button 
                    onClick={onProjectChange}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Change Project
                  </Button>
                )}
                
                {onDetailExplain && (
                  <Button 
                    onClick={onDetailExplain}
                    variant="outline"
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Explain Project Details
                  </Button>
                )}
                
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="w-full"
                >
                  No Change - Continue
                </Button>
              </div>
            </div>
          )}

          {/* Regular Action Buttons for other sentiments */}
          {!shouldShowProjectOptions && (
            <div className="space-y-3">
              <Button 
                onClick={onClose} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Continue with Project
              </Button>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 