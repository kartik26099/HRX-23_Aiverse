"use client"

import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export function DebugTranslate() {
  const handleDebugTranslate = () => {
    if (typeof window !== 'undefined') {
      console.log('Manual Google Translate initialization triggered');
      
      // Check if Google Translate is available
      if (window.google && window.google.translate) {
        console.log('Google Translate API is available');
        
        // Try to initialize manually
        try {
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,es,fr,de,it,pt,ru,ja,ko,zh-CN,ar,hi',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          }, 'google_translate_element');
          
          console.log('Manual initialization successful');
        } catch (error) {
          console.error('Manual initialization failed:', error);
        }
      } else {
        console.log('Google Translate API not available');
      }
      
      // Check what elements exist
      console.log('Google Translate elements:', document.querySelectorAll('[class*="goog"]').length);
      console.log('Select elements:', document.querySelectorAll('select').length);
      console.log('Google translate div:', document.getElementById('google_translate_element'));
    }
  }

  return (
    <Button 
      onClick={handleDebugTranslate}
      className="fixed top-4 left-4 z-50 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1"
      size="sm"
    >
      <Settings className="w-3 h-3 mr-1" />
      Debug Translate
    </Button>
  )
} 