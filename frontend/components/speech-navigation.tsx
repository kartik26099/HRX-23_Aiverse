"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, VolumeX, HelpCircle, Sparkles } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

interface SpeechNavigationProps {
  className?: string
}

export default function SpeechNavigation({ className = '' }: SpeechNavigationProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const recognitionRef = useRef<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Navigation commands mapping
  const navigationCommands = {
    'go home': '/',
    'home page': '/',
    'main page': '/',
    'go to scheduler': '/scheduler',
    'timecrafter': '/scheduler',
    'diy scheduler': '/scheduler',
    'go to LearnLens': '/ai-advisor',
    'ai advisor': '/ai-advisor',
    'go to edumentor': '/ai-faculty',
    'edumentor': '/ai-faculty',
    'ai faculty': '/ai-faculty',
    'go to courseweaver': '/course-generator',
    'courseweaver': '/course-generator',
    'go to evaluator': '/diy-evaluator',
    'diy evaluator': '/diy-evaluator',
    'go to diy generator': '/diy-generator',
    'diy generator': '/diy-generator',
    'go to knowvault': '/library',
    'knowvault': '/library',
    'ai library': '/library',
    'go to researchmate': '/research-helper',
    'researchmate': '/research-helper',
    'go to test translate': '/test-translate',
    'test translate': '/test-translate',
    'translate': '/test-translate',
  }

  // Page-specific commands
  const getPageSpecificCommands = () => {
    if (pathname === '/scheduler') {
      return {
        'add task': () => {
          // Try multiple selectors to find the Add Task button
          const addButton = 
            document.querySelector('button:has-text("Add Task")') ||
            document.querySelector('[aria-label*="Add Task"]') ||
            document.querySelector('button:contains("Add Task")') ||
            Array.from(document.querySelectorAll('button')).find(btn => 
              btn.textContent?.toLowerCase().includes('add task')
            )
          
          if (addButton) {
            (addButton as HTMLElement).click()
            speakFeedback('Opening add task dialog')
          } else {
            speakFeedback('Add task button not found')
          }
        },
        'generate schedule': () => {
          const generateButton = 
            document.querySelector('button:has-text("Auto Schedule")') ||
            document.querySelector('button:has-text("Generate Schedule")') ||
            Array.from(document.querySelectorAll('button')).find(btn => 
              btn.textContent?.toLowerCase().includes('auto schedule') ||
              btn.textContent?.toLowerCase().includes('generate schedule')
            )
          
          if (generateButton) {
            (generateButton as HTMLElement).click()
            speakFeedback('Generating schedule')
          } else {
            speakFeedback('Generate schedule button not found')
          }
        },
        'export calendar': () => {
          const exportButton = 
            document.querySelector('button:has-text("Export Calendar")') ||
            Array.from(document.querySelectorAll('button')).find(btn => 
              btn.textContent?.toLowerCase().includes('export calendar')
            )
          
          if (exportButton) {
            (exportButton as HTMLElement).click()
            speakFeedback('Exporting calendar')
          } else {
            speakFeedback('Export calendar button not found')
          }
        },
        'set reminders': () => {
          const reminderButton = 
            document.querySelector('button:has-text("Set Reminders")') ||
            Array.from(document.querySelectorAll('button')).find(btn => 
              btn.textContent?.toLowerCase().includes('set reminders')
            )
          
          if (reminderButton) {
            (reminderButton as HTMLElement).click()
            speakFeedback('Setting reminders')
          } else {
            speakFeedback('Set reminders button not found')
          }
        },
        'previous week': () => {
          const prevButton = 
            document.querySelector('button:has-text("Previous")') ||
            Array.from(document.querySelectorAll('button')).find(btn => 
              btn.textContent?.toLowerCase().includes('previous')
            )
          
          if (prevButton) {
            (prevButton as HTMLElement).click()
            speakFeedback('Going to previous week')
          } else {
            speakFeedback('Previous week button not found')
          }
        },
        'next week': () => {
          const nextButton = 
            document.querySelector('button:has-text("Next")') ||
            Array.from(document.querySelectorAll('button')).find(btn => 
              btn.textContent?.toLowerCase().includes('next')
            )
          
          if (nextButton) {
            (nextButton as HTMLElement).click()
            speakFeedback('Going to next week')
          } else {
            speakFeedback('Next week button not found')
          }
        }
      }
    }
    return {}
  }

  // Action commands
  const actionCommands = {
    'scroll up': () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    'scroll down': () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }),
    'scroll to top': () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    'scroll to bottom': () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }),
    'go back': () => window.history.back(),
    'go forward': () => window.history.forward(),
    'refresh page': () => window.location.reload(),
    'reload': () => window.location.reload(),
    'stop listening': () => stopListening(),
    'turn off microphone': () => stopListening(),
    'help': () => speakHelp(),
    'what can i say': () => speakHelp(),
    'show commands': () => speakHelp(),
    'toggle help': () => setShowHelp(!showHelp),
    'close help': () => setShowHelp(false),
    'open help': () => setShowHelp(true),
  }

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript) {
            setTranscript(finalTranscript.toLowerCase().trim())
            processCommand(finalTranscript.toLowerCase().trim())
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          
          let errorMessage = 'Speech recognition error'
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected'
              break
            case 'audio-capture':
              errorMessage = 'Microphone not found'
              break
            case 'not-allowed':
              errorMessage = 'Microphone access denied'
              break
            case 'network':
              errorMessage = 'Network error'
              break
            default:
              errorMessage = `Error: ${event.error}`
          }
          
          toast({
            title: "Speech Recognition Error",
            description: errorMessage,
            variant: "destructive",
          })
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    // Keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault()
        toggleListening()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        setTranscript('')
        toast({
          title: "Listening...",
          description: "Speak your command or say 'help' for available commands",
        })
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        toast({
          title: "Error",
          description: "Failed to start speech recognition",
          variant: "destructive",
        })
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      setTranscript('')
    }
  }

  const processCommand = (command: string) => {
    console.log('Processing command:', command)
    
    // Check navigation commands
    if (navigationCommands[command as keyof typeof navigationCommands]) {
      const path = navigationCommands[command as keyof typeof navigationCommands]
      router.push(path)
      speakFeedback(`Navigating to ${command}`)
      return
    }
    
    // Check page-specific commands
    const pageCommands = getPageSpecificCommands()
    const pageCommand = pageCommands[command as keyof typeof pageCommands]
    if (pageCommand) {
      pageCommand()
      return
    }
    
    // Check action commands
    if (actionCommands[command as keyof typeof actionCommands]) {
      actionCommands[command as keyof typeof actionCommands]()
      return
    }
    
    // No command found
    speakFeedback(`Command not recognized: ${command}. Say 'help' for available commands`)
  }

  const speakFeedback = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      
      window.speechSynthesis.speak(utterance)
    }
  }

  const speakHelp = () => {
    const helpText = `
      Available commands: 
      Navigation: go home, go to scheduler, go to ai advisor
      Actions: scroll up, scroll down, go back, go forward, refresh page, stop listening, help
      Say 'help' anytime to hear this list again
    `
    speakFeedback(helpText)
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="flex flex-col items-end space-y-2">
        {/* Help Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowHelp(!showHelp)}
          className="ai-button hover:bg-ai-neural/10 hover:text-ai-neural transition-all duration-300"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* Main Speech Button */}
        <Button
          onClick={toggleListening}
          disabled={!isSupported}
          className={`ai-button relative overflow-hidden transition-all duration-300 ${
            isListening 
              ? 'bg-gradient-to-r from-ai-error to-ai-warning text-white shadow-lg hover:shadow-xl animate-pulse-glow' 
              : 'bg-gradient-to-r from-ai-primary to-ai-secondary text-white shadow-lg hover:shadow-xl hover:scale-110'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="h-5 w-5" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-white animate-pulse" />
            </>
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>

        {/* Volume Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (isSpeaking) {
              window.speechSynthesis.cancel()
              setIsSpeaking(false)
            }
          }}
          className={`ai-button transition-all duration-300 ${
            isSpeaking 
              ? 'bg-ai-quantum/10 text-ai-quantum animate-pulse' 
              : 'hover:bg-ai-quantum/10 hover:text-ai-quantum'
          }`}
        >
          {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>

        {/* Help Panel */}
        {showHelp && (
          <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg p-4 shadow-xl max-w-sm animate-fade-in-up">
            <h3 className="font-semibold text-ai-primary mb-2">Voice Commands</h3>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p><strong>Navigation:</strong> "go home", "go to scheduler", "ai advisor"</p>
              <p><strong>Actions:</strong> "scroll up", "scroll down", "help"</p>
              <p><strong>Shortcut:</strong> Ctrl+K to toggle listening</p>
            </div>
          </div>
        )}

        {/* Transcript Display */}
        {transcript && (
          <div className="bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg p-3 shadow-lg max-w-xs animate-fade-in-up">
            <p className="text-sm text-muted-foreground">Heard: "{transcript}"</p>
          </div>
        )}
      </div>
    </div>
  )
} 