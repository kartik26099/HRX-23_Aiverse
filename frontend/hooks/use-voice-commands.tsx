"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"

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
  aliases?: string[]
}

const findButtonByText = (text: string): HTMLButtonElement | null => {
  const buttons = Array.from(document.querySelectorAll('button'))
  return buttons.find(btn => btn.textContent?.trim().toLowerCase() === text.toLowerCase()) as HTMLButtonElement | null
}

export function useVoiceCommands() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<{ message: string; severity: 'warning' | 'error' } | null>(null)
  const [lastCommand, setLastCommand] = useState("")
  
  const recognitionRef = useRef<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  const globalCommands: VoiceCommand[] = [
    {
      command: "go to home",
      action: () => router.push("/"),
      description: "Navigate to home page",
      category: "Navigation",
      aliases: ["home", "main page", "landing page"]
    },
    {
      command: "go to ai advisor",
      action: () => router.push("/ai-advisor"),
      description: "Navigate to AI Advisor",
      category: "Navigation",
      aliases: ["ai advisor", "advisor", "career advisor"]
    },
    {
      command: "go to ai faculty",
      action: () => router.push("/ai-faculty"),
      description: "Navigate to AI Faculty",
      category: "Navigation",
      aliases: ["ai faculty", "faculty", "learning platform"]
    },
    {
      command: "go to course generator",
      action: () => router.push("/course-generator"),
      description: "Navigate to Course Generator",
      category: "Navigation",
      aliases: ["course generator", "generate course", "create course"]
    },
    {
      command: "go back",
      action: () => router.back(),
      description: "Go back to previous page",
      category: "Navigation",
      aliases: ["back", "previous", "return"]
    },
    {
      command: "go forward",
      action: () => router.forward(),
      description: "Go forward to next page",
      category: "Navigation",
      aliases: ["forward", "next"]
    }
  ]

  const uiCommands: VoiceCommand[] = [
    {
      command: "scroll up",
      action: () => window.scrollTo({ top: 0, behavior: "smooth" }),
      description: "Scroll to top of page",
      category: "UI Control",
      aliases: ["top", "scroll to top", "go to top"]
    },
    {
      command: "scroll down",
      action: () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
      description: "Scroll to bottom of page",
      category: "UI Control",
      aliases: ["bottom", "scroll to bottom", "go to bottom"]
    },
    {
      command: "stop listening",
      action: () => stopListening(),
      description: "Stop voice recognition",
      category: "UI Control",
      aliases: ["stop", "pause", "quiet"]
    },
    {
      command: "start listening",
      action: () => startListening(),
      description: "Start voice recognition",
      category: "UI Control",
      aliases: ["listen", "start", "activate"]
    },
    {
      command: "show help",
      action: () => {}, // Handled by component state
      description: "Show voice commands help",
      category: "UI Control",
      aliases: ["help", "commands", "what can I say"]
    },
    {
      command: "hide help",
      action: () => {}, // Handled by component state
      description: "Hide voice commands help",
      category: "UI Control",
      aliases: ["close help", "hide commands"]
    }
  ]

  const getFacultyCommands = (): VoiceCommand[] => {
    if (!pathname.includes("/ai-faculty")) return []
    return [
      {
        command: "upload document",
        action: () => {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
          if (fileInput) fileInput.click()
        },
        description: "Trigger document upload",
        category: "AI Faculty",
        aliases: ["upload file", "add document"]
      },
      {
        command: "generate quiz",
        action: () => findButtonByText("Generate Quiz")?.click(),
        description: "Generate a quiz",
        category: "AI Faculty",
        aliases: ["create quiz", "make quiz"]
      },
      {
        command: "next question",
        action: () => findButtonByText("Next")?.click(),
        description: "Go to the next question",
        category: "AI Faculty",
        aliases: ["next"]
      },
    ]
  }

  const getAllCommands = (): VoiceCommand[] => {
    return [
      ...globalCommands,
      ...uiCommands,
      ...getFacultyCommands(),
    ]
  }

  useEffect(() => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    if (!SpeechRecognition) {
      setError({ message: "Speech recognition not supported in this browser.", severity: 'error'})
      return
    }

    recognitionRef.current = new SpeechRecognition()
    const recognition = recognitionRef.current

    recognition.continuous = false
    recognition.interimResults = false // Set to false to only get final results
    recognition.lang = "en-US"
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event: any) => {
      const finalTranscript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim()
      const confidence = event.results[event.results.length - 1][0].confidence
      
      if (finalTranscript) {
        setTranscript(finalTranscript)
        setConfidence(confidence)
        processCommand(finalTranscript)
      }
    }

    recognition.onerror = (event: any) => {
      let newError: { message: string; severity: 'warning' | 'error' };
      switch (event.error) {
        case 'no-speech':
          newError = { message: "I didn't hear you. Please try again.", severity: 'warning' };
          break;
        case 'audio-capture':
          newError = { message: "Microphone not found. Please check your settings.", severity: 'error' };
          break;
        case 'not-allowed':
          newError = { message: "Microphone access denied. Please check permission.", severity: 'error' };
          break;
        default:
          newError = { message: `An error occurred: ${event.error}`, severity: 'error' };
      }
      setError(newError);
      setIsListening(false);
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    return () => {
      if(recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [pathname])

  const processCommand = (command: string) => {
    setLastCommand(command)
    const allCommands = getAllCommands()

    const matchedCommand = allCommands.find(cmd => {
      const allPhrases = [cmd.command, ...(cmd.aliases || [])].map(p => p.toLowerCase())
      return allPhrases.some(p => command.includes(p))
    })

    if (matchedCommand) {
      try {
        matchedCommand.action()
        setError(null)
      } catch (e) {
        console.error("Error executing command action:", e)
        setError({ message: "Failed to execute command.", severity: 'error' })
      }
    } else {
      setError({ message: "Command not recognized.", severity: 'warning' })
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  }

  return {
    isListening,
    transcript,
    confidence,
    error,
    lastCommand,
    toggleListening,
    getAllCommands,
    clearError: () => setError(null),
  }
} 