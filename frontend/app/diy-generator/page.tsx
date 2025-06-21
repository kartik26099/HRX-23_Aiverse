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
import { Wrench, Clock, Calendar, CheckCircle, Target, Lightbulb, Package, ExternalLink, Play, AlertCircle, Brain, Database } from "lucide-react"
import { toast } from "@/hooks/use-toast"

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

    try {
      const skillLevel = getExperienceLabel(formData.experienceLevel[0]).toLowerCase()
      
      const requestData = {
        topic: formData.topic,
        available_time: `${formData.availableHours} hours`,
        skill_level: skillLevel,
        user_description: formData.userDescription,
        youtube_url: formData.youtubeUrl || "",
      }

      console.log("Sending request to backend:", requestData)

      const response = await fetch(`${BACKEND_URL}/api/generate-roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      console.log("Backend response:", data)

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate roadmap')
      }

      // Transform the backend response to match our frontend interface
      const transformedRoadmap: ProjectRoadmap = {
        title: data.project_data?.project_title || `DIY Project: ${formData.topic}`,
        totalDuration: data.project_data?.estimated_time || `${formData.availableHours} hours`,
        experienceLevel: data.assessed_skill_level || skillLevel,
        days: parseProjectRoadmap(data.project_data?.project_roadmap || ""),
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
      }

      setRoadmap(transformedRoadmap)
      toast({
        title: "Roadmap Generated!",
        description: "Your personalized project roadmap has been created successfully.",
      })

    } catch (err) {
      console.error('Error generating roadmap:', err)
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

  const parseProjectRoadmap = (roadmapText: string) => {
    if (!roadmapText) return []
    
    const phases = roadmapText.split('PHASE').filter(phase => phase.trim())
    return phases.map((phase, index) => {
      const lines = phase.split('\n').filter(line => line.trim())
      const title = lines[0]?.replace(/^\d+:\s*/, '').trim() || `Phase ${index + 1}`
      const duration = extractDuration(lines[0] || "")
      
      return {
        day: index + 1,
        title,
        duration,
        tasks: lines.slice(1).filter(line => line.trim().startsWith('-')).map(line => line.replace('-', '').trim()),
        materials: [],
        resources: [],
        milestone: index === 1 || index === phases.length - 1, // First and last phases are milestones
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
    return "2-3 hours"
  }

  const getExperienceLabel = (level: number) => {
    const labels = ["Beginner", "Beginner+", "Intermediate", "Intermediate+", "Advanced"]
    return labels[level - 1] || "Intermediate"
  }

  const handleSuggestionClick = (suggestion: string) => {
    setFormData({ ...formData, topic: suggestion })
  }

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`)
      const data = await response.json()
      console.log("Backend health check:", data)
      if (data.status === 'healthy') {
        toast({
          title: "Backend Connected!",
          description: "Successfully connected to the AI DIY backend.",
        })
      } else {
        toast({
          title: "Backend Issue",
          description: "Backend is running but may have issues.",
          variant: "destructive",
        })
      }
      return data.status === 'healthy'
    } catch (error) {
      console.error("Backend connection failed:", error)
      toast({
        title: "Connection Failed",
        description: "Cannot connect to backend. Make sure it's running.",
        variant: "destructive",
      })
      return false
    }
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AI DIY Project Generator</h1>
        <p className="text-muted-foreground">
          Generate step-by-step project roadmaps with timelines, materials, and resources powered by AI
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Brain className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
            <Database className="w-3 h-3 mr-1" />
            Backend Integrated
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Project Generator
              </CardTitle>
              <CardDescription>Tell us about your project idea and we'll create a detailed roadmap</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="topic">Project Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Build a Weather App"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    required
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <div className="px-3">
                    <Slider
                      value={formData.experienceLevel}
                      onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Beginner</span>
                      <span>Expert</span>
                    </div>
                    <p className="text-sm text-center mt-2 font-medium">
                      {getExperienceLabel(formData.experienceLevel[0])}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours">Available Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    placeholder="e.g., 20"
                    value={formData.availableHours}
                    onChange={(e) => setFormData({ ...formData, availableHours: e.target.value })}
                    required
                    min="1"
                    max="200"
                  />
                  <p className="text-xs text-muted-foreground">Total hours you can dedicate to this project</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Your Experience (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your current knowledge and experience with this topic..."
                    value={formData.userDescription}
                    onChange={(e) => setFormData({ ...formData, userDescription: e.target.value })}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">This helps us assess your actual skill level and customize the roadmap</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube Reference (Optional)</Label>
                  <Input
                    id="youtube"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Reference video to base the project on</p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isGenerating || !formData.topic.trim() || !formData.availableHours}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Roadmap...
                    </>
                  ) : (
                    "Generate Project Roadmap"
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={testBackendConnection}
                    className="text-xs text-muted-foreground"
                  >
                    Test Backend Connection
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Error: {error}</span>
                </div>
                <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                  Make sure the backend is running at {BACKEND_URL}
                </p>
              </CardContent>
            </Card>
          )}

          {isGenerating && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Creating your project roadmap...</p>
                <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Brain className="w-4 h-4" />
                    Analyzing your requirements
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="w-4 h-4" />
                    Generating personalized roadmap
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Play className="w-4 h-4" />
                    Finding relevant videos
                  </div>
                </div>
              </div>
            </div>
          )}

          {roadmap && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {roadmap.title}
                  </CardTitle>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {roadmap.totalDuration}
                    </div>
                    <Badge variant="secondary">{roadmap.experienceLevel}</Badge>
                    {roadmap.isMlProject && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        <Brain className="w-3 h-3 mr-1" />
                        ML Project
                      </Badge>
                    )}
                  </div>
                  {roadmap.knowledgeAssessment && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Knowledge Assessment:</strong> {roadmap.knowledgeAssessment}
                      </p>
                    </div>
                  )}
                </CardHeader>
              </Card>

              {/* Prerequisites */}
              {roadmap.prerequisites && roadmap.prerequisites.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prerequisites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {roadmap.prerequisites.map((prereq, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Learning Objectives */}
              {roadmap.learningObjectives && roadmap.learningObjectives.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Learning Objectives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {roadmap.learningObjectives.map((objective, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Day-by-day roadmap */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Project Roadmap
                </h2>
                {roadmap.days.map((day, index) => (
                  <Card
                    key={day.day}
                    className={`${day.milestone ? "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800" : ""}`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              day.milestone ? "bg-green-600 text-white" : "bg-blue-600 text-white"
                            }`}
                          >
                            {day.day}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{day.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {day.duration}
                              </Badge>
                              {day.milestone && (
                                <Badge className="text-xs bg-green-600">
                                  <Target className="w-3 h-3 mr-1" />
                                  Milestone
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {day.tasks.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Tasks
                          </h4>
                          <ul className="space-y-1 text-sm mb-4">
                            {day.tasks.map((task, taskIndex) => (
                              <li key={taskIndex} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Materials and Tools */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Required Materials
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {roadmap.materials.map((material, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{material}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      Recommended Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {roadmap.tools.map((tool, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm">{tool}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Datasets for ML Projects */}
              {roadmap.isMlProject && roadmap.datasets && roadmap.datasets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Recommended Datasets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {roadmap.datasets.map((dataset, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-purple-600" />
                          <span className="text-sm">{dataset}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommended Videos */}
              {roadmap.videos && roadmap.videos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Recommended Videos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {roadmap.videos.slice(0, 5).map((video, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <Play className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{video.title}</p>
                            <p className="text-xs text-muted-foreground">{video.channel}</p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={video.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Watch
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Common Pitfalls */}
              {roadmap.commonPitfalls && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Common Pitfalls & Troubleshooting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-line">{roadmap.commonPitfalls}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Success Criteria */}
              {roadmap.successCriteria && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Success Criteria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-line">{roadmap.successCriteria}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Next Steps */}
              {roadmap.nextSteps && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Next Steps & Extensions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-line">{roadmap.nextSteps}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {formData.youtubeUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Reference Video
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Play className="w-4 h-4" />
                      <span className="text-sm">Based on: {formData.youtubeUrl}</span>
                      <Button variant="outline" size="sm" asChild>
                        <a href={formData.youtubeUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Watch
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!roadmap && !isGenerating && !error && (
            <Card className="h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <Wrench className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Build Something Amazing</h3>
                <p className="text-muted-foreground">Fill out the form to generate your personalized project roadmap</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
