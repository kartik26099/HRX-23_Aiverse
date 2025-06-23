"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Check } from "lucide-react"

declare global {
  interface Window {
    changePageLanguage: (languageCode: string) => Promise<boolean>
    getCurrentPageLanguage: () => string
    directTranslate: (languageCode: string) => boolean
    google: {
      translate: {
        TranslateElement: any
      }
    }
    googleTranslateElementInit: () => void
  }
}

export function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [isClient, setIsClient] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "हिंदी", flag: "🇮🇳" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
    { code: "zh", name: "中文", flag: "🇨🇳" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
    { code: "ko", name: "한국어", flag: "🇰🇷" },
    { code: "pt", name: "Português", flag: "🇵🇹" },
    { code: "ru", name: "Русский", flag: "🇷🇺" },
    { code: "ar", name: "العربية", flag: "🇸🇦" },
  ]

  const handleLanguageChange = async (languageCode: string) => {
    if (isChanging) return // Prevent multiple simultaneous changes
    
    setSelectedLanguage(languageCode)
    setIsChanging(true)
    
    if (isClient && typeof window !== 'undefined') {
      console.log('Attempting to change language to:', languageCode)
      
      try {
        // Method 1: Use direct translate method (new)
        if (window.directTranslate) {
          const success = window.directTranslate(languageCode)
          if (success) {
            console.log('Language changed successfully using directTranslate')
            setIsChanging(false)
            return
          }
        }

        // Method 2: Use global function (preferred)
        if (window.changePageLanguage) {
          const success = await window.changePageLanguage(languageCode)
          if (success) {
            console.log('Language changed successfully using global function')
            setIsChanging(false)
            return
          }
        }

        // Method 3: Direct DOM manipulation with retry
        const changeLanguageDirectly = () => {
          // Try multiple selectors
          let selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement
          if (!selectElement) {
            selectElement = document.querySelector('#google_translate_element select') as HTMLSelectElement
          }
          if (!selectElement) {
            selectElement = document.querySelector('select[aria-label*="language"]') as HTMLSelectElement
          }
          
          if (selectElement) {
            console.log('Found Google Translate select, changing to:', languageCode)
            selectElement.value = languageCode
            selectElement.dispatchEvent(new Event('change'))
            return true
          }
          return false
        }

        // Try immediately
        if (changeLanguageDirectly()) {
          console.log('Language changed using direct DOM manipulation')
          setIsChanging(false)
          return
        }

        // If not found, retry with intervals
        const maxAttempts = 50 // 5 seconds
        let attempts = 0
        
        const retryInterval = setInterval(() => {
          attempts++
          if (changeLanguageDirectly()) {
            console.log('Language changed on attempt', attempts)
            clearInterval(retryInterval)
            setIsChanging(false)
          } else if (attempts >= maxAttempts) {
            console.log('Failed to change language after', maxAttempts, 'attempts')
            console.log('Debug info:')
            console.log('- Google Translate elements:', document.querySelectorAll('[class*="goog"]').length)
            console.log('- Select elements:', document.querySelectorAll('select').length)
            console.log('- Google translate div:', document.getElementById('google_translate_element'))
            clearInterval(retryInterval)
            setIsChanging(false)
          }
        }, 100)

      } catch (error) {
        console.error('Error changing language:', error)
        setIsChanging(false)
      }
    }
  }

  // Sync with Google Translate current language
  useEffect(() => {
    if (!isClient) return

    const syncLanguage = () => {
      if (typeof window !== 'undefined' && window.getCurrentPageLanguage) {
        const currentLang = window.getCurrentPageLanguage()
        if (currentLang && currentLang !== selectedLanguage) {
          setSelectedLanguage(currentLang)
        }
      }
    }

    // Check for language changes periodically
    const interval = setInterval(syncLanguage, 3000)
    return () => clearInterval(interval)
  }, [selectedLanguage, isClient])

  const currentLanguage = languages.find((lang) => lang.code === selectedLanguage)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="ai-button hover:bg-ai-secondary/10 hover:text-ai-secondary transition-all duration-300 relative" 
          disabled={isChanging}
        >
          <Globe className="h-5 w-5" />
          {isClient && currentLanguage && (
            <span className="absolute -top-1 -right-1 text-xs bg-gradient-to-r from-ai-secondary to-ai-neural text-white rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
              {currentLanguage.flag}
            </span>
          )}
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-xl border border-border/50 shadow-xl">
        <div className="px-2 py-1.5 text-sm font-semibold text-ai-secondary">Select Language</div>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer hover:bg-ai-secondary/10 hover:text-ai-secondary transition-colors duration-300"
            disabled={isChanging}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
            </div>
            {selectedLanguage === language.code && <Check className="h-4 w-4 text-ai-secondary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
