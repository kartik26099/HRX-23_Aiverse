import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export default function SimpleHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 lg:py-40 px-4">
          <div className="container mx-auto text-center">
            {/* Floating Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Powered by Advanced AI</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8">
              <span className="ai-text-gradient">Transform</span>
              <br />
              <span className="text-white">Learning Into</span>
              <br />
              <span className="ai-text-gradient">Action</span>
            </h1>

            <p className="max-w-3xl mx-auto text-xl md:text-2xl text-slate-300 mb-12">
              Bridge the gap between concepts and creation. Our AI-powered platform guides you from knowledge to real-world projects with intelligent assistance.
            </p>

            <div className="flex gap-6 justify-center flex-wrap">
              <Button className="ai-button-primary text-lg px-8 py-4">
                Get Started Free
              </Button>
              <Button className="ai-button-secondary text-lg px-8 py-4">
                Sign In
              </Button>
            </div>
          </div>
        </section>

        {/* Simple Features */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="ai-text-gradient">AI-Powered</span> Tools
            </h2>
            <p className="text-xl text-slate-300 mb-12">
              From course creation to project evaluation, our comprehensive suite of AI tools supports your entire learning journey.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <h3 className="text-xl font-semibold mb-2">Course Generator</h3>
                <p className="text-slate-300">Create personalized learning curricula.</p>
              </div>
              <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <h3 className="text-xl font-semibold mb-2">AI Advisor</h3>
                <p className="text-slate-300">Get personalized learning recommendations.</p>
              </div>
              <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <h3 className="text-xl font-semibold mb-2">Research Helper</h3>
                <p className="text-slate-300">Get research guidance and roadmaps.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 