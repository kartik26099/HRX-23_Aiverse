import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import SpeechNavigation from "@/components/speech-navigation"
import { ErrorBoundary } from "@/components/error-boundary"
import { ReactErrorHandler, setupReactErrorHandling } from "@/components/react-error-handler"
import Script from "next/script"
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Education Platform - Transform Learning Into Action",
  description: "Bridge the gap between learning concepts and building real projects with AI-powered tools",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <Script
            id="google-translate-script"
            strategy="afterInteractive"
            src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          />
          <Script id="google-translate-init" strategy="afterInteractive">
            {`
              let translateElement = null;
              let translateInitialized = false;

              // Wait for Google Translate to be available
              function waitForGoogleTranslate() {
                if (typeof google !== 'undefined' && google.translate && google.translate.TranslateElement) {
                  console.log('Google Translate API is available');
                  if (!translateInitialized) {
                    googleTranslateElementInit();
                  }
                } else {
                  console.log('Waiting for Google Translate API...');
                  setTimeout(waitForGoogleTranslate, 100);
                }
              }

              function googleTranslateElementInit() {
                console.log('Google Translate Element Init called');
                
                // Check if Google Translate is available
                if (typeof google === 'undefined' || !google.translate || !google.translate.TranslateElement) {
                  console.log('Google Translate not available yet, retrying...');
                  setTimeout(googleTranslateElementInit, 100);
                  return;
                }
                
                // Remove any existing elements
                const existing = document.getElementById('google_translate_element');
                if (existing) {
                  existing.remove();
                }

                // Create new element with better accessibility
                const div = document.createElement('div');
                div.id = 'google_translate_element';
                div.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;z-index:-9999;';
                document.body.appendChild(div);

                try {
                  // Initialize Google Translate with more accessible layout
                  translateElement = new google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,hi,fr,de,es,zh,ja,ko,pt,ru,ar',
                    layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL,
                    autoDisplay: false,
                    multilanguagePage: true,
                    gaTrack: false,
                  }, 'google_translate_element');

                  translateInitialized = true;
                  console.log('Google Translate initialized successfully');
                  
                  // Add a direct method to change language
                  window.directTranslate = function(languageCode) {
                    const select = document.querySelector('#google_translate_element select');
                    if (select) {
                      select.value = languageCode;
                      select.dispatchEvent(new Event('change'));
                      return true;
                    }
                    return false;
                  };
                  
                } catch (error) {
                  console.error('Error initializing Google Translate:', error);
                  translateInitialized = false;
                }
              }

              // Global function to change language
              window.changePageLanguage = function(languageCode) {
                console.log('changePageLanguage called with:', languageCode);
                
                return new Promise((resolve) => {
                  const attemptChange = () => {
                    // Method 1: Try the standard select element
                    let selectElement = document.querySelector('.goog-te-combo');
                    
                    // Method 2: Try alternative selectors
                    if (!selectElement) {
                      selectElement = document.querySelector('select.goog-te-combo');
                    }
                    
                    // Method 3: Try finding any select element with language options
                    if (!selectElement) {
                      const selects = document.querySelectorAll('select');
                      for (let select of selects) {
                        if (select.options.length > 0 && select.options[0].value.includes('en')) {
                          selectElement = select;
                          break;
                        }
                      }
                    }
                    
                    // Method 4: Try using Google Translate's internal API
                    if (!selectElement && window.google && window.google.translate) {
                      try {
                        // Force Google Translate to change language using their API
                        const iframe = document.querySelector('.goog-te-banner-frame');
                        if (iframe && iframe.contentWindow) {
                          // Try to access the iframe content
                          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                          const iframeSelect = iframeDoc.querySelector('select');
                          if (iframeSelect) {
                            iframeSelect.value = languageCode;
                            iframeSelect.dispatchEvent(new Event('change'));
                            resolve(true);
                            return true;
                          }
                        }
                      } catch (e) {
                        console.log('Could not access iframe content:', e);
                      }
                    }
                    
                    if (selectElement) {
                      console.log('Found select element, changing to:', languageCode);
                      selectElement.value = languageCode;
                      selectElement.dispatchEvent(new Event('change'));
                      
                      // Also try triggering the change event on the parent form
                      const form = selectElement.closest('form');
                      if (form) {
                        form.dispatchEvent(new Event('submit'));
                      }
                      
                      resolve(true);
                      return true;
                    }
                    
                    // Method 5: Try using Google Translate's URL method
                    if (window.google && window.google.translate) {
                      try {
                        // Create a temporary element to trigger translation
                        const tempDiv = document.createElement('div');
                        tempDiv.style.display = 'none';
                        document.body.appendChild(tempDiv);
                        
                        // Use Google Translate's internal method
                        if (window.google.translate.TranslateElement) {
                          const tempTranslate = new window.google.translate.TranslateElement({
                            pageLanguage: 'en',
                            includedLanguages: languageCode,
                            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                            autoDisplay: false,
                          }, tempDiv);
                          
                          // Remove the temporary element
                          document.body.removeChild(tempDiv);
                          resolve(true);
                          return true;
                        }
                      } catch (e) {
                        console.log('Error with Google Translate API method:', e);
                      }
                    }
                    
                    return false;
                  };

                  // Try immediately
                  if (attemptChange()) return;

                  // If not found, wait and retry
                  const maxAttempts = 100; // 10 seconds with 100ms intervals
                  let attempts = 0;
                  
                  const interval = setInterval(() => {
                    attempts++;
                    if (attemptChange() || attempts >= maxAttempts) {
                      clearInterval(interval);
                      if (attempts >= maxAttempts) {
                        console.log('Failed to change language after', maxAttempts, 'attempts');
                        console.log('Available select elements:', document.querySelectorAll('select').length);
                        console.log('Google Translate elements:', document.querySelectorAll('[class*="goog"]').length);
                        resolve(false);
                      }
                    }
                  }, 100);
                });
              };

              // Global function to get current language
              window.getCurrentPageLanguage = function() {
                const selectElement = document.querySelector('.goog-te-combo');
                return selectElement ? selectElement.value : 'en';
              };

              // Start waiting for Google Translate when DOM is ready
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                  waitForGoogleTranslate();
                });
              } else {
                // DOM is already loaded
                waitForGoogleTranslate();
              }

              // Fallback initialization
              setTimeout(() => {
                if (!translateInitialized) {
                  console.log('Fallback initialization of Google Translate');
                  waitForGoogleTranslate();
                }
              }, 3000);

              // Global error handler for DOM manipulation errors
              window.addEventListener('error', function(event) {
                if (event.error && event.error.message && event.error.message.includes('removeChild')) {
                  console.warn('DOM manipulation error caught and handled:', event.error);
                  event.preventDefault();
                  return false;
                }
              });

              // Handle unhandled promise rejections
              window.addEventListener('unhandledrejection', function(event) {
                console.warn('Unhandled promise rejection:', event.reason);
                event.preventDefault();
              });

              // Patch DOM manipulation methods to prevent removeChild errors
              (function() {
                const originalRemoveChild = Node.prototype.removeChild;
                const originalRemoveChildFromContainer = window.removeChildFromContainer;
                
                // Patch Node.prototype.removeChild
                Node.prototype.removeChild = function(child) {
                  try {
                    if (child && child.parentNode === this) {
                      return originalRemoveChild.call(this, child);
                    } else {
                      console.warn('Attempted to remove child that is not a child of this node:', child);
                      return child; // Return the child instead of throwing
                    }
                  } catch (error) {
                    console.warn('Error in removeChild, gracefully handling:', error);
                    return child; // Return the child instead of throwing
                  }
                };

                // Patch React's internal removeChildFromContainer if it exists
                if (typeof window.removeChildFromContainer === 'function') {
                  window.removeChildFromContainer = function(container, child) {
                    try {
                      if (child && container && container.contains && container.contains(child)) {
                        return originalRemoveChildFromContainer.call(this, container, child);
                      } else {
                        console.warn('React removeChildFromContainer: child not in container');
                        return child;
                      }
                    } catch (error) {
                      console.warn('Error in React removeChildFromContainer, gracefully handling:', error);
                      return child;
                    }
                  };
                }

                // Patch React's internal removeChild if it exists
                if (typeof window.removeChild === 'function') {
                  const originalWindowRemoveChild = window.removeChild;
                  window.removeChild = function(child) {
                    try {
                      if (child && child.parentNode) {
                        return originalWindowRemoveChild.call(this, child);
                      } else {
                        console.warn('Window removeChild: child has no parent');
                        return child;
                      }
                    } catch (error) {
                      console.warn('Error in window removeChild, gracefully handling:', error);
                      return child;
                    }
                  };
                }

                // Setup React-specific error handling
                if (typeof setupReactErrorHandling === 'function') {
                  setupReactErrorHandling();
                }
              })();
            `}
          </Script>
        </head>
        <body className={inter.className} suppressHydrationWarning>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {/* Google Translate Element - Hidden but functional */}
            <div 
              id="google_translate_element" 
              style={{
                position: 'absolute',
                top: '-9999px',
                left: '-9999px',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
                zIndex: -9999
              }}
            ></div>
            
            <ErrorBoundary>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
                <SpeechNavigation />
                <ReactErrorHandler />
              </div>
            </ErrorBoundary>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
