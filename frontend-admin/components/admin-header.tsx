"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Lightbulb, BarChart3, Settings, Users, Shield, LogOut } from "lucide-react"

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="flex h-20 items-center justify-between">
          {/* DoLab Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-foreground">DoLab</span>
              <span className="text-xs text-muted-foreground">Admin Dashboard</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </Link>
            <Link href="/users" className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </Link>
            <Link href="/settings" className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
            
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </Button>
            
            <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
} 