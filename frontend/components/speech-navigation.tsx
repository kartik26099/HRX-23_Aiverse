"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2, VolumeX, HelpCircle } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

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
    'scheduler': '/scheduler',
    'diy scheduler': '/scheduler',
    'go to ai advisor': '/ai-advisor',
    'ai advisor': '/ai-advisor',
    'go to faculty': '/ai-faculty',
    'faculty': '/ai-faculty',
    'ai faculty': '/ai-faculty',
    'go to course generator': '/course-generator',
    'course generator': '/course-generator',
    'go to diy evaluator': '/diy-evaluator',
    'diy evaluator': '/diy-evaluator',
    'go to diy generator': '/diy-generator',
    'diy generator': '/diy-generator',
    'go to library': '/library',
    'library': '/library',
    'ai library': '/library',
    'go to research helper': '/research-helper',
    'research helper': '/research-helper',
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
              errorMessage = 'No speech detected. Please try again.'
              break
            case 'audio-capture':
              errorMessage = 'Microphone not found or not accessible.'
              break
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please allow microphone access.'
              break
            case 'network':
              errorMessage = 'Network error. Please check your connection.'
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

    // Add keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + M to toggle microphone
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'M') {
        event.preventDefault()
        toggleListening()
      }
      
      // Ctrl/Cmd + Shift + H to show help
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
        event.preventDefault()
        setShowHelp(!showHelp)
      }
      
      // Escape to close help
      if (event.key === 'Escape' && showHelp) {
        setShowHelp(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [pathname, showHelp])

  const startListening = () => {
    if (recognitionRef.current && isSupported) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        setTranscript('')
        speakFeedback('Listening. Speak your command now.')
        toast({
          title: "Listening...",
          description: "Speak your command now",
        })
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        toast({
          title: "Error",
          description: "Failed to start speech recognition",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser",
        variant: "destructive",
      })
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      speakFeedback('Stopped listening')
      toast({
        title: "Stopped Listening",
        description: "Voice recognition stopped",
      })
    }
  }

  const processCommand = (command: string) => {
    console.log('Processing command:', command)

    // Check navigation commands
    for (const [phrase, route] of Object.entries(navigationCommands)) {
      if (command.includes(phrase)) {
        speakFeedback(`Navigating to ${phrase}`)
        router.push(route)
        return
      }
    }

    // Check page-specific commands
    const pageCommands = getPageSpecificCommands()
    for (const [phrase, action] of Object.entries(pageCommands)) {
      if (command.includes(phrase)) {
        action()
        return
      }
    }

    // Check action commands
    for (const [phrase, action] of Object.entries(actionCommands)) {
      if (command.includes(phrase)) {
        speakFeedback(`Executing ${phrase}`)
        action()
        return
      }
    }

    // Handle common variations
    if (command.includes('click') || command.includes('press') || command.includes('select')) {
      // Try to find buttons or links that match the command
      const elements = document.querySelectorAll('button, a, [role="button"]')
      for (const element of elements) {
        const text = element.textContent?.toLowerCase() || ''
        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || ''
        const title = element.getAttribute('title')?.toLowerCase() || ''
        
        const searchTerm = command.replace('click ', '').replace('press ', '').replace('select ', '')
        if (text.includes(searchTerm) || ariaLabel.includes(searchTerm) || title.includes(searchTerm)) {
          speakFeedback(`Clicking ${text}`)
          ;(element as HTMLElement).click()
          return
        }
      }
    }

    // If no command matched, provide feedback
    speakFeedback(`Command not recognized: ${command}. Say "help" for available commands.`)
  }

  const speakFeedback = (text: string) => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      setIsSpeaking(true)
      
      utterance.onend = () => {
        setIsSpeaking(false)
      }
      
      utterance.onerror = () => {
        setIsSpeaking(false)
      }
      
      speechSynthesis.speak(utterance)
    }
  }

  const speakHelp = () => {
    const pageCommands = getPageSpecificCommands()
    const pageSpecificHelp = Object.keys(pageCommands).length > 0 
      ? `Page-specific commands: ${Object.keys(pageCommands).join(', ')}. `
      : ''
    
    const helpText = `
      Available voice commands:
      Navigation: Go home, go to scheduler, go to ai advisor, go to faculty, go to course generator, go to diy evaluator, go to diy generator, go to library, go to research helper, go to test translate.
      Actions: Scroll up, scroll down, scroll to top, scroll to bottom, go back, go forward, refresh page, reload, stop listening, turn off microphone, help.
      ${pageSpecificHelp}
      You can also say "click" followed by any button or link text to interact with elements.
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
    return null // Don't show the component if speech recognition is not supported
  }

  return (
    <>
      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        id="speech-announcements"
      >
        {isListening && "Listening for voice commands"}
        {isSpeaking && "Speaking feedback"}
        {transcript && `Heard: ${transcript}`}
      </div>

      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <div className="flex flex-col items-end space-y-2">
          {/* Status indicator */}
          {isListening && (
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm animate-pulse" role="status">
              Listening...
            </div>
          )}
          
          {isSpeaking && (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm animate-pulse" role="status">
              Speaking...
            </div>
          )}

          {/* Transcript display */}
          {transcript && (
            <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-sm max-w-xs" role="status">
              "{transcript}"
            </div>
          )}

          {/* Main microphone button */}
          <Button
            onClick={toggleListening}
            size="lg"
            className={`rounded-full w-14 h-14 shadow-lg transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
            aria-label={isListening ? "Stop listening for voice commands" : "Start listening for voice commands"}
            aria-pressed={isListening}
            aria-describedby="speech-announcements"
          >
            {isListening ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </Button>

          {/* Help button */}
          <Button
            onClick={() => setShowHelp(!showHelp)}
            size="sm"
            variant="outline"
            className="rounded-full w-10 h-10 shadow-lg bg-white/90 hover:bg-white"
            aria-label="Voice commands help"
            aria-expanded={showHelp}
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Help overlay */}
      {showHelp && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 id="help-title" className="text-lg font-semibold mb-4">Voice Commands Help</h3>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-blue-600">Navigation:</h4>
                <ul className="ml-4 space-y-1">
                  <li>• "Go home" - Navigate to home page</li>
                  <li>• "Go to scheduler" - Open DIY Scheduler</li>
                  <li>• "Go to AI advisor" - Open AI Advisor</li>
                  <li>• "Go to faculty" - Open AI Faculty</li>
                  <li>• "Go to course generator" - Open Course Generator</li>
                  <li>• "Go to library" - Open AI Library</li>
                  <li>• "Go to research helper" - Open Research Helper</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-green-600">Actions:</h4>
                <ul className="ml-4 space-y-1">
                  <li>• "Scroll up/down" - Scroll the page</li>
                  <li>• "Go back/forward" - Browser navigation</li>
                  <li>• "Refresh page" - Reload the page</li>
                  <li>• "Stop listening" - Turn off microphone</li>
                  <li>• "Help" - Show this help</li>
                </ul>
              </div>

              {Object.keys(getPageSpecificCommands()).length > 0 && (
                <div>
                  <h4 className="font-medium text-purple-600">Page-Specific Commands:</h4>
                  <ul className="ml-4 space-y-1">
                    {Object.keys(getPageSpecificCommands()).map((cmd) => (
                      <li key={cmd}>• "{cmd}"</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-medium text-orange-600">Keyboard Shortcuts:</h4>
                <ul className="ml-4 space-y-1">
                  <li>• <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl/Cmd + Shift + M</kbd> - Toggle microphone</li>
                  <li>• <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl/Cmd + Shift + H</kbd> - Show/hide help</li>
                  <li>• <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Escape</kbd> - Close help</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-orange-600">Tips:</h4>
                <ul className="ml-4 space-y-1">
                  <li>• Speak clearly and at a normal pace</li>
                  <li>• Say "click" followed by button text to interact</li>
                  <li>• Use "help" anytime to hear available commands</li>
                  <li>• The microphone button pulses when listening</li>
                </ul>
              </div>
            </div>
            
            <Button
              onClick={() => setShowHelp(false)}
              className="w-full mt-4"
            >
              Close Help
            </Button>
          </div>
        </div>
      )}
    </>
  )
} 