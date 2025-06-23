"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Wrench, Clock, Calendar, CheckCircle, Target, Lightbulb, Package, ExternalLink, Play, AlertCircle, Brain, Database, Sparkles, Zap, ArrowRight, FileText, Users, BarChart3, Eye, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import MermaidRoadmap from '@/components/MermaidRoadmap'

interface ProjectRoadmap {
  title: string
  totalDuration: string
  experienceLevel: string
  days: {
    day: number
    title: string
    duration: string
    tasks: string[]
    materials: string[]
    resources: string[]
    milestone: boolean
    videos?: any[]
  }[]
  materials: string[]
  tools: string[]
  prerequisites?: string[]
  learningObjectives?: string[]
  commonPitfalls?: string
  successCriteria?: string
  nextSteps?: string
  datasets?: string[]
  isMlProject?: boolean
  videos?: any[]
  knowledgeAssessment?: string
  phaseVideos?: any
  projectOverview?: string
  domain?: string
  templatesHints?: string
}

interface ApiResponse {
  success: boolean
  project_data?: any
  error?: string
  keywords?: string[]
  videos?: any[]
  assessed_skill_level?: string
  knowledge_assessment?: string
}

export default function DIYGeneratorPage() {
  const [formData, setFormData] = useState({
    topic: "",
    experienceLevel: [3],
    availableHours: "",
    youtubeUrl: "",
    userDescription: "",
  })
  const [roadmap, setRoadmap] = useState<ProjectRoadmap | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mermaidCode, setMermaidCode] = useState<string | null>(null)
  const [isGeneratingMermaid, setIsGeneratingMermaid] = useState(false)
  const [suggestions] = useState([
    "Build a Weather App",
    "Create a Personal Portfolio",
    "Design a Mobile Game",
    "Build a Chat Application",
    "Create an E-commerce Site",
    "Develop a Task Manager",
    "Build a Blog Platform",
    "Create a Recipe App",
    "Machine Learning Image Classifier",
    "Data Analysis Dashboard",
    "Natural Language Processing Chatbot",
    "Computer Vision Object Detection",
  ])

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.topic.trim() || !formData.availableHours) {
      toast({
        title: "Missing Information",
        description: "Please fill in the project topic and available hours.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setError(null)
    setMermaidCode(null)

    try {
      const skillLevel = getExperienceLabel(formData.experienceLevel[0]).toLowerCase()
      const requestData = {
        topic: formData.topic,
        available_time: `${formData.availableHours} hours`,
        skill_level: skillLevel,
        user_description: formData.userDescription,
        youtube_url: formData.youtubeUrl || "",
      }
      const response = await fetch(`${BACKEND_URL}/api/generate-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data: ApiResponse = await response.json()
      if (!data.success) throw new Error(data.error || 'Failed to generate roadmap')
      const transformedRoadmap: ProjectRoadmap = {
        title: data.project_data?.project_title || `DIY Project: ${formData.topic}`,
        totalDuration: data.project_data?.estimated_time || `${formData.availableHours} hours`,
        experienceLevel: data.assessed_skill_level || skillLevel,
        days: parseProjectRoadmap(data.project_data?.project_roadmap || "", data.project_data?.phase_videos || {}),
        materials: parseList(data.project_data?.tools_and_materials || ""),
        tools: parseList(data.project_data?.tools_and_materials || ""),
        prerequisites: parseList(data.project_data?.prerequisites || ""),
        learningObjectives: parseList(data.project_data?.learning_objectives || ""),
        commonPitfalls: data.project_data?.common_pitfalls_and_troubleshooting || "",
        successCriteria: data.project_data?.success_criteria || "",
        nextSteps: data.project_data?.next_steps_and_extensions || "",
        datasets: data.project_data?.datasets || [],
        isMlProject: data.project_data?.is_ml_project || false,
        videos: data.videos || [],
        knowledgeAssessment: data.knowledge_assessment || "",
        phaseVideos: data.project_data?.phase_videos || {},
        projectOverview: data.project_data?.project_overview || "",
        domain: data.project_data?.domain || "",
        templatesHints: data.project_data?.templates_hints || "",
      }
      
      // Debug: Log the tools and materials data
      console.log('Raw tools_and_materials:', data.project_data?.tools_and_materials)
      console.log('Parsed tools:', transformedRoadmap.tools)
      console.log('Full project data:', data.project_data)

      setRoadmap(transformedRoadmap)
      await fetchMermaidCode(data.project_data)
      toast({
        title: "Roadmap Generated!",
        description: "Your personalized project roadmap has been created successfully.",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const parseProjectRoadmap = (roadmapText: string, phaseVideos: any) => {
    if (!roadmapText) return []
    
    const phases = roadmapText.split('PHASE').filter(phase => phase.trim())
    return phases.map((phase, index) => {
      const lines = phase.split('\n').filter(line => line.trim())
      const title = lines[0]?.replace(/^\d+:\s*/, '').trim() || `Phase ${index + 1}`
      const duration = extractDuration(lines[0] || "")
      
      // Map phase videos to the correct phase index
      const phaseKey = `phase_${index + 1}`
      const videos = phaseVideos[phaseKey] || []
      
      return {
        day: index + 1,
        title,
        duration,
        tasks: lines.slice(1).filter(line => line.trim().startsWith('-')).map(line => line.replace('-', '').trim()),
        materials: [],
        resources: [],
        milestone: index === 1 || index === phases.length - 1, // First and last phases are milestones
        videos: videos,
      }
    })
  }

  const parseList = (text: string) => {
    if (!text) return []
    return text.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0)
  }

  const extractDuration = (text: string) => {
    const match = text.match(/\((\d+)\s*minutes?\)/)
    if (match) {
      const minutes = parseInt(match[1])
      if (minutes >= 60) {
        return `${Math.floor(minutes / 60)}-${Math.ceil(minutes / 60)} hours`
      }
      return `${minutes} minutes`
    }
    return "1-2 hours"
  }

  const getExperienceLabel = (level: number) => {
    const labels = ["Beginner", "Novice", "Intermediate", "Advanced", "Expert"]
    return labels[level - 1] || "Intermediate"
  }

  const handleSuggestionClick = (suggestion: string) => {
    setFormData(prev => ({ ...prev, topic: suggestion }))
  }

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`)
      if (response.ok) {
        toast({
          title: "Backend Connected",
          description: "Successfully connected to the backend server.",
        })
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      toast({
        title: "Backend Connection Failed",
        description: "Could not connect to the backend server.",
        variant: "destructive",
      })
    }
  }

  const getExperienceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
      case "novice":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
      case "intermediate":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
      case "advanced":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
      case "expert":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800"
    }
  }

  const fetchMermaidCode = async (projectData: any) => {
    try {
      setIsGeneratingMermaid(true)
      const response = await fetch(`${BACKEND_URL}/api/generate-mermaid-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_data: projectData }),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      if (data.success) {
        setMermaidCode(data.mermaid_code)
        console.log('Mermaid code:', data.mermaid_code)
      } else {
        throw new Error(data.error || 'Failed to generate Mermaid roadmap')
      }
    } catch (err) {
      setMermaidCode(null)
    } finally {
      setIsGeneratingMermaid(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Wrench className="h-6 w-6 text-slate-600" />
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              DIY Project Generator
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Create personalized project roadmaps with AI guidance tailored to your skill level and time constraints.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <CardTitle className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <Sparkles className="h-4 w-4 text-slate-600" />
                  <span>Generate Project Roadmap</span>
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Tell us about your project idea and we'll create a personalized roadmap for you.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="topic" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Project Topic
                    </Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Build a Weather App, Create a Portfolio Website"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="mt-1 border-slate-200 dark:border-slate-600 focus:border-slate-400 dark:focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      Experience Level: <span className="text-slate-600 font-medium">{getExperienceLabel(formData.experienceLevel[0])}</span>
                    </Label>
                    <Slider
                      value={formData.experienceLevel}
                      onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="availableHours" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Available Hours
                    </Label>
                    <Input
                      id="availableHours"
                      type="number"
                      placeholder="e.g., 20"
                      value={formData.availableHours}
                      onChange={(e) => setFormData({ ...formData, availableHours: e.target.value })}
                      className="mt-1 border-slate-200 dark:border-slate-600 focus:border-slate-400 dark:focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="youtubeUrl" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      YouTube URL (Optional)
                    </Label>
                    <Input
                      id="youtubeUrl"
                      placeholder="https://youtube.com/watch?v=..."
                      value={formData.youtubeUrl}
                      onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                      className="mt-1 border-slate-200 dark:border-slate-600 focus:border-slate-400 dark:focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userDescription" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Additional Details
                    </Label>
                    <Textarea
                      id="userDescription"
                      placeholder="Describe your project goals, specific features you want, or any constraints..."
                      value={formData.userDescription}
                      onChange={(e) => setFormData({ ...formData, userDescription: e.target.value })}
                      className="mt-1 border-slate-200 dark:border-slate-600 focus:border-slate-400 dark:focus:border-slate-500 min-h-[80px]"
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testBackendConnection}
                      className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <Database className="mr-2 h-3 w-3" />
                      Test Connection
                    </Button>
                    <Button
                      type="submit"
                      disabled={isGenerating}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-800 dark:hover:bg-slate-300"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-3 w-3" />
                          Generate Roadmap
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Project Suggestions */}
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 pb-3">
                <CardTitle className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span>Popular Ideas</span>
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-xs">
                  Click any suggestion to fill the project topic
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-1 gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-left group"
                    >
                      <div className="flex items-center space-x-2">
                        <Target className="h-3 w-3 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                          {suggestion}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* What You'll Get */}
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 pb-3">
                <CardTitle className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <Brain className="h-4 w-4 text-slate-600" />
                  <span>What You'll Get</span>
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-xs">
                  Your personalized project roadmap will include:
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-3">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Eye className="h-3 w-3 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200">Project Overview</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Comprehensive explanation of what you'll build</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Calendar className="h-3 w-3 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200">Step-by-Step Timeline</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Detailed phases with estimated time</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Package className="h-3 w-3 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200">Resource Lists</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Tools, materials, and learning resources</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Target className="h-3 w-3 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200">Learning Objectives</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Clear goals and skills you'll develop</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-3 w-3 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200">Common Pitfalls</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Tips to avoid common mistakes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Play className="h-3 w-3 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200">Integrated Video Resources</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Curated tutorials for each project phase</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Generated Roadmap */}
        {roadmap && (
          <div className="mt-8">
            {/* Mermaid Roadmap Section */}
            {mermaidCode && mermaidCode.trim() && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-center text-slate-800 dark:text-slate-200">
                  Project Roadmap Flowchart
                </h2>
                <MermaidRoadmap mermaidCode={mermaidCode} />
              </div>
            )}
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">
                      {roadmap.title}
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Your personalized project roadmap
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={`border ${getExperienceColor(roadmap.experienceLevel)}`}>
                      {roadmap.experienceLevel}
                    </Badge>
                    <div className="flex items-center space-x-1 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{roadmap.totalDuration}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Project Overview */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Project Overview Section */}
                    {roadmap.projectOverview && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-slate-600" />
                          <span>Project Overview</span>
                        </h3>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {roadmap.projectOverview}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Project Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* Domain */}
                      {roadmap.domain && (
                        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center space-x-2">
                            <Package className="h-3 w-3 text-slate-600" />
                            <span>Domain</span>
                          </h4>
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                            {roadmap.domain}
                          </Badge>
                        </div>
                      )}

                      {/* Difficulty Level */}
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center space-x-2">
                          <Target className="h-3 w-3 text-slate-600" />
                          <span>Difficulty</span>
                        </h4>
                        <Badge className={`border ${getExperienceColor(roadmap.experienceLevel)}`}>
                          {roadmap.experienceLevel}
                        </Badge>
                      </div>

                      {/* Time Estimate */}
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-slate-600" />
                          <span>Time Estimate</span>
                        </h4>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{roadmap.totalDuration}</span>
                      </div>

                      {/* Knowledge Assessment */}
                      {roadmap.knowledgeAssessment && (
                        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center space-x-2">
                            <Brain className="h-3 w-3 text-slate-600" />
                            <span>Knowledge Level</span>
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {roadmap.knowledgeAssessment}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Learning Objectives */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                        <Target className="h-4 w-4 text-slate-600" />
                        <span>Learning Objectives</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {roadmap.learningObjectives?.map((objective, index) => (
                          <div key={index} className="flex items-start space-x-2 bg-slate-50 dark:bg-slate-700 rounded p-2">
                            <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-slate-700 dark:text-slate-300">{objective}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Templates & Hints */}
                    {roadmap.templatesHints && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                          <Sparkles className="h-4 w-4 text-slate-600" />
                          <span>Templates & Hints</span>
                        </h3>
                        <Card className="border border-slate-200 dark:border-slate-700">
                          <CardContent className="p-3">
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {roadmap.templatesHints}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Project Timeline */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-slate-600" />
                        <span>Project Timeline</span>
                      </h3>
                      <div className="space-y-3">
                        {roadmap.days.map((day, index) => (
                          <Card key={index} className="border border-slate-200 dark:border-slate-700">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm text-slate-800 dark:text-slate-200">
                                  Day {day.day}: {day.title}
                                </CardTitle>
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-3 w-3 text-slate-500" />
                                  <span className="text-xs text-slate-600 dark:text-slate-400">{day.duration}</span>
                                  {day.milestone && (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 text-xs">
                                      Milestone
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {/* Tasks */}
                                <div className="space-y-2">
                                  {day.tasks.map((task, taskIndex) => (
                                    <div key={taskIndex} className="flex items-start space-x-2 bg-slate-50 dark:bg-slate-700 rounded p-2">
                                      <div className="w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-bold">{taskIndex + 1}</span>
                                      </div>
                                      <span className="text-xs text-slate-700 dark:text-slate-300">{task}</span>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Videos for this phase */}
                                {day.videos && day.videos.length > 0 && (
                                  <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center space-x-2">
                                      <Play className="h-3 w-3 text-red-600" />
                                      <span>Learning Videos</span>
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                      {day.videos.map((video, videoIndex) => (
                                        <Card key={videoIndex} className="border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                                          <CardContent className="p-2">
                                            <div className="space-y-1">
                                              <div className="flex items-start justify-between">
                                                <h5 className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                                                  {video.title}
                                                </h5>
                                              </div>
                                              <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                                                <span className="font-medium">{video.channel}</span>
                                                {video.views && (
                                                  <>
                                                    <span>•</span>
                                                    <span>{video.views}</span>
                                                  </>
                                                )}
                                                {video.published_date && (
                                                  <>
                                                    <span>•</span>
                                                    <span>{video.published_date}</span>
                                                  </>
                                                )}
                                              </div>
                                              <a
                                                href={video.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full"
                                              >
                                                <Button 
                                                  variant="outline" 
                                                  size="sm" 
                                                  className="w-full text-xs border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                                                >
                                                  <Play className="h-3 w-3 mr-1" />
                                                  Watch Video
                                                </Button>
                                              </a>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Success Criteria */}
                    {roadmap.successCriteria && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-slate-600" />
                          <span>Success Criteria</span>
                        </h3>
                        <Card className="border border-slate-200 dark:border-slate-700">
                          <CardContent className="p-3">
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {roadmap.successCriteria}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Next Steps */}
                    {roadmap.nextSteps && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                          <ArrowRight className="h-4 w-4 text-slate-600" />
                          <span>Next Steps & Extensions</span>
                        </h3>
                        <Card className="border border-slate-200 dark:border-slate-700">
                          <CardContent className="p-3">
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {roadmap.nextSteps}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Prerequisites */}
                    {roadmap.prerequisites && roadmap.prerequisites.length > 0 && (
                      <Card className="border border-slate-200 dark:border-slate-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                            <FileText className="h-3 w-3 text-slate-600" />
                            <span>Prerequisites</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {roadmap.prerequisites.map((prereq, index) => (
                              <div key={index} className="flex items-start space-x-2 text-xs text-slate-600 dark:text-slate-400">
                                <div className="w-1 h-1 bg-slate-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                <span>{prereq}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Tools & Materials */}
                    <Card className="border border-slate-200 dark:border-slate-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                          <Package className="h-3 w-3 text-slate-600" />
                          <span>Tools & Materials</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {roadmap.tools && roadmap.tools.length > 0 ? (
                            roadmap.tools.map((tool, index) => (
                              <div key={index} className="flex items-start space-x-2 text-xs text-slate-600 dark:text-slate-400">
                                <div className="w-1 h-1 bg-slate-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                <span>{tool}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-500 dark:text-slate-500 italic">
                              No tools and materials specified
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Common Pitfalls */}
                    {roadmap.commonPitfalls && (
                      <Card className="border border-slate-200 dark:border-slate-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                            <AlertCircle className="h-3 w-3 text-slate-600" />
                            <span>Common Pitfalls</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {roadmap.commonPitfalls}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
