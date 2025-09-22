"use client"

import React, { useState } from "react"
import { Mic, MicOff, Volume2, X, HelpCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useVoiceCommands } from "@/hooks/use-voice-commands"

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

interface VoiceCommand {
  command: string
  action: () => void
  description: string
  category: string
}

export default function VoiceAssistant() {
  const [isActive, setIsActive] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  
  const router = useRouter()
  const {
    isListening,
    transcript,
    confidence,
    error,
    lastCommand,
    toggleListening,
    getAllCommands,
    clearError,
  } = useVoiceCommands()

  const allCommands = getAllCommands()

  const helpCommands = allCommands.map(cmd => ({
    ...cmd,
    action: cmd.command.includes("show help") ? () => setShowHelp(true) : 
            cmd.command.includes("hide help") ? () => setShowHelp(false) : cmd.action
  }))

  if (!isActive) {
    return (
      <Button
        onClick={() => setIsActive(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        size="icon"
      >
        <Mic className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <>
      <Card className="fixed bottom-6 right-6 z-50 w-80 bg-white/95 backdrop-blur-sm border-2 border-blue-200 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Voice Assistant</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowHelp(!showHelp)} variant="ghost" size="sm" className="h-8 w-8 p-0">
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button onClick={() => setIsActive(false)} variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", isListening ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
              <span className="text-sm text-gray-600">{isListening ? "Listening..." : "Ready"}</span>
              {confidence > 0 && (
                <Badge variant="secondary" className="text-xs">{Math.round(confidence * 100)}%</Badge>
              )}
            </div>

            {transcript && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700"><span className="font-medium">Said:</span> {transcript}</p>
              </div>
            )}
            
            {lastCommand && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700"><span className="font-medium">Ran:</span> {lastCommand}</p>
              </div>
            )}

            {error && (
              <div className={cn(
                "border rounded-lg p-3 flex items-start gap-2",
                error.severity === 'error' ? "bg-red-50 border-red-200 text-red-700" : "bg-yellow-50 border-yellow-200 text-yellow-800"
              )}>
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-grow">
                  <p className="text-sm font-medium">{error.message}</p>
                </div>
                <Button onClick={clearError} variant="ghost" size="sm" className="h-6 w-6 p-0 -mr-1 -mt-1">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={toggleListening} className={cn("flex-1", isListening ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700")} size="sm">
                {isListening ? (<><MicOff className="h-4 w-4 mr-2" />Stop</>) : (<><Mic className="h-4 w-4 mr-2" />Start</>)}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Voice Commands</h2>
                <Button onClick={() => setShowHelp(false)} variant="ghost" size="sm"><X className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-4">
                {["Navigation", "UI Control", "AI Faculty"].map(category => {
                  const categoryCommands = helpCommands.filter(cmd => cmd.category === category)
                  if (categoryCommands.length === 0) return null
                  return (
                    <div key={category}>
                      <h3 className="font-semibold text-gray-800 mb-2">{category}</h3>
                      <div className="grid gap-2">
                        {categoryCommands.map((cmd, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium">"{cmd.command}"</span>
                              <span className="text-xs text-gray-600">{cmd.description}</span>
                            </div>
                            {cmd.aliases && (<div className="mt-1"><span className="text-xs text-gray-500">Aliases: </span><span className="text-xs text-blue-600">{cmd.aliases.join(", ")}</span></div>)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
} 