"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageSelector } from "@/components/language-selector"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Menu, Lightbulb, ChevronDown, X } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [diyDropdownOpen, setDiyDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const diyTools = [
    { name: "DIY Generator", href: "/diy-generator", description: "Generate step-by-step project plans" },
    { name: "DIY Evaluator", href: "/diy-evaluator", description: "Get detailed project feedback" },
    { name: "DIY Scheduler", href: "/scheduler", description: "Plan and schedule your tasks" },
  ]

  const navigationItems = [
    { name: "CourseWeaver", href: "/course-generator", color: "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400" },
    { name: "LearnLens", href: "/ai-advisor", color: "hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950 dark:hover:text-purple-400" },
    { name: "EduMentor", href: "/ai-faculty", color: "hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-950 dark:hover:text-pink-400" },
    { name: "ResearchMate", href: "/research-helper", color: "hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-cyan-950 dark:hover:text-cyan-400" },
    { name: "KnowVault", href: "/library", color: "hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-400" },
    { name: "Community", href: "/community", color: "hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950 dark:hover:text-orange-400" },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDiyDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Clean Logo Section */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <Lightbulb className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-foreground">DoLab</span>
              <span className="text-xs text-muted-foreground">AI Learning Platform</span>
            </div>
          </Link>

          {/* Clean Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <NavigationMenu>
              <NavigationMenuList className="space-x-1">
                {navigationItems.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        className={`group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 ${item.color}`}
                      >
                        {item.name}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Custom DIY Tools Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                className="h-10 px-4 py-2 text-sm font-medium transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 focus:outline-none"
                onClick={() => setDiyDropdownOpen(!diyDropdownOpen)}
              >
                <span>DIY Tools</span>
                <ChevronDown className={`ml-1 h-3 w-3 transition-transform duration-200 ${diyDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>
              
              {diyDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-[400px] bg-background border rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold mb-1">DIY Project Tools</h3>
                      <p className="text-sm text-muted-foreground">Complete your projects with AI assistance</p>
                    </div>
                    <div className="space-y-2">
                      {diyTools.map((tool) => (
                        <Link
                          key={tool.name}
                          href={tool.href}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400"
                          onClick={() => setDiyDropdownOpen(false)}
                        >
                          <div className="text-sm font-medium leading-none">{tool.name}</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {tool.description}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clean Right Section */}
          <div className="flex items-center space-x-4">
            {/* Language and Theme */}
            <div className="hidden md:flex items-center space-x-2">
              <LanguageSelector />
              <ModeToggle />
            </div>
            
            {/* Authentication */}
            <div className="hidden md:flex items-center space-x-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-950 dark:hover:text-gray-400">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Sign Up
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-400">
                    Profile
                  </Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-950 dark:hover:text-gray-400">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <span className="font-bold text-lg">DoLab</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-950 dark:hover:text-gray-400"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Main Tools</h3>
                      <div className="space-y-1">
                        {navigationItems.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${item.color}`}
                            onClick={() => setIsOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">DIY Tools</h3>
                      <div className="space-y-1">
                        {diyTools.map((tool) => (
                          <Link
                            key={tool.name}
                            href={tool.href}
                            className="block px-3 py-2 rounded-md text-base font-medium transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-400"
                            onClick={() => setIsOpen(false)}
                          >
                            {tool.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </nav>

                  {/* Mobile Footer */}
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <LanguageSelector />
                      <ModeToggle />
                    </div>
                    
                    <SignedOut>
                      <div className="space-y-3">
                        <SignInButton mode="modal">
                          <Button variant="outline" className="w-full hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-950 dark:hover:text-gray-400" onClick={() => setIsOpen(false)}>
                            Sign In
                          </Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                          <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => setIsOpen(false)}>
                            Sign Up
                          </Button>
                        </SignUpButton>
                      </div>
                    </SignedOut>
                    <SignedIn>
                      <div className="space-y-3">
                        <Link href="/profile" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950 dark:hover:text-emerald-400">
                            Profile
                          </Button>
                        </Link>
                        <div className="flex justify-center">
                          <UserButton afterSignOutUrl="/" />
                        </div>
                      </div>
                    </SignedIn>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
