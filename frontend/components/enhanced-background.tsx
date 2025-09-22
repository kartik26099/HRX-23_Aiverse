"use client"

import React from "react"
import { motion } from "framer-motion"

interface EnhancedBackgroundProps {
  mousePosition: { x: number; y: number }
}

export default function EnhancedBackground({ mousePosition }: EnhancedBackgroundProps) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Floating Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"
        animate={{
          x: mousePosition.x * 0.1,
          y: mousePosition.y * 0.1,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />
      
      <motion.div
        className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
        animate={{
          x: -mousePosition.x * 0.05,
          y: -mousePosition.y * 0.05,
        }}
        transition={{ type: "spring", stiffness: 30, damping: 15 }}
      />
      
      <motion.div
        className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl"
        animate={{
          x: mousePosition.x * 0.08,
          y: mousePosition.y * 0.08,
        }}
        transition={{ type: "spring", stiffness: 40, damping: 18 }}
      />

      {/* Subtle Noise Texture */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </div>
  )
} 