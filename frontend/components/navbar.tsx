"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageSelector } from "@/components/language-selector"

interface NavbarProps {
  scrollY: number
}

export default function Navbar({ scrollY }: NavbarProps) {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 10
          ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="font-bold text-xl dark:text-white text-slate-900">Education Platform</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/ai-advisor"
              className="text-sm font-medium transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              AI Advisor
            </Link>
            <Link
              href="/ai-faculty"
              className="text-sm font-medium transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              AI Faculty
            </Link>
            <Link
              href="/course-generator"
              className="text-sm font-medium transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              Course Generator
            </Link>
            <Link
              href="/diy-evaluator"
              className="text-sm font-medium transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              DIY Evaluator
            </Link>
            <Link
              href="/ai-placement"
              className="text-sm font-medium transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              AI Placement
            </Link>
            <Link
              href="/research-helper"
              className="text-sm font-medium transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              Research Helper
            </Link>
            <Link
              href="/library"
              className="text-sm font-medium transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
            >
              Library
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
} 