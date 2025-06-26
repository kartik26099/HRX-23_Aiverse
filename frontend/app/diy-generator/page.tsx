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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wrench, Clock, Calendar, CheckCircle, Target, Lightbulb, Package, ExternalLink, Play, AlertCircle, Brain, Database, Sparkles, Zap, ArrowRight, FileText, Users, BarChart3, Eye, Loader2, Check, Code, Cpu, Trophy } from "lucide-react"
import { toast } from "sonner"
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabaseClient'

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
  githubTemplates?: {
    repositories: Array<{
      name: string
      url: string
      desc: string
      readme?: string
      analysis?: {
        useful_for: string
        match_score: string
        pros: string[]
        cons: string[]
        customization: string
      }
    }>
    tools: {
      type: 'software'
      tools?: string[]
      description?: string
    }
  }
  hardwareSuggestions?: {
    type: 'hardware'
    suggestions?: string
    components?: Array<{
      name: string
      quantity: string
      purpose: string
      cost: string
    }>
    shopping_links?: {
      [componentName: string]: Array<{
        title: string
        price: string
        link: string
        image: string
        rating: string
        reviews: string
      }>
    }
    description?: string
  }
  softwareTools?: {
    type: 'software' | 'other'
    tools?: Array<{
      name: string
      description: string
      category: string
      version: string
    }>
    description?: string
  }
  flowchart?: {
    success: boolean
    dot_code?: string
    image_base64?: string
    description?: string
    error?: string
  }
  userProfileUsed?: {
    age: string | number
    education_level: string
    domain_interest: string
    skills_count: number
    previous_projects_count: number
  } | null
}

interface ApiResponse {
  success: boolean
  project_data?: any
  error?: string
  keywords?: string[]
  videos?: any[]
  assessed_skill_level?: string
  knowledge_assessment?: string
  github_templates?: {
    repositories: Array<{
      name: string
      url: string
      desc: string
      readme?: string
      analysis?: {
        useful_for: string
        match_score: string
        pros: string[]
        cons: string[]
        customization: string
      }
    }>
    tools: {
      type: 'software'
      tools?: string[]
      description?: string
    }
  }
  hardware_suggestions?: {
    type: 'hardware'
    suggestions?: string
    components?: Array<{
      name: string
      quantity: string
      purpose: string
      cost: string
    }>
    shopping_links?: {
      [componentName: string]: Array<{
        title: string
        price: string
        link: string
        image: string
        rating: string
        reviews: string
      }>
    }
    description?: string
  }
  software_tools?: {
    type: 'software' | 'other'
    tools?: Array<{
      name: string
      description: string
      category: string
      version: string
    }>
    description?: string
  }
  flowchart?: {
    success: boolean
    dot_code?: string
    image_base64?: string
    description?: string
    error?: string
  }
}

export default function DIYGeneratorPage() {
  const { user, isSignedIn } = useUser();
  const [formData, setFormData] = useState({
    topic: "",
    experienceLevel: [3],
    availableHours: "",
    category: "software",
    youtubeUrl: "",
    userDescription: "",
  })
  const [roadmap, setRoadmap] = useState<ProjectRoadmap | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectSuggestions] = useState([
    "Build a Weather App",
    "Create a Personal Portfolio",
    "Develop a Task Management System",
    "Build a Chat Application",
    "Create a Blog Platform",
    "Develop a Recipe Finder App",
    "Build a Fitness Tracker",
    "Create an E-commerce Website",
    "Develop a Social Media Dashboard",
    "Build a Learning Management System"
  ])

  // Function to fetch user profile data from Supabase
  const fetchUserProfile = async () => {
    if (!isSignedIn || !user) {
      console.log('User not signed in, skipping profile fetch');
      return null;
    }

    console.log('Attempting to fetch user profile for:', user.id);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    try {
      // Test 1: Check if we can access any data from the table
      console.log('Test 1: Checking basic table access...');
      const { data: allData, error: allError } = await supabase
        .from('userinfo')
        .select('*')
        .limit(1);

      if (allError) {
        console.error('Test 1 failed - cannot access table at all:', allError);
        return null;
      }
      console.log('Test 1 passed - can access table, found', allData?.length || 0, 'rows');

      // Test 2: Check if we can find the specific user
      console.log('Test 2: Looking for user with clerk_id:', user.id);
      const { data, error } = await supabase
        .from('userinfo')
        .select('*')
        .eq('clerk_id', user.id)
        .single();

      if (error) {
        console.error('Test 2 failed - user not found:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // If it's a "no rows returned" error, the user doesn't have a profile yet
        if (error.code === 'PGRST116' && error.message?.includes('0 rows')) {
          console.log('User profile not found - user may not have created a profile yet');
          return null;
        }
        
        return null;
      }

      console.log('Test 2 passed - successfully fetched user profile:', data);
      return data;
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error);
      return null;
    }
  };

  // Category-based project suggestions
  const getCategorySuggestions = (category: string) => {
    const suggestions = {
      software: [
        "Build a Weather App",
        "Create a Personal Portfolio",
        "Develop a Task Management System",
        "Build a Chat Application",
        "Create a Blog Platform"
      ],
      hardware: [
        "Build a Smart Home Controller",
        "Create a Weather Station",
        "Develop a Plant Monitoring System",
        "Build a Motion Detection Alarm",
        "Create a LED Display Board"
      ],
      other: [
        "Create a Digital Art Portfolio",
        "Build a Podcast Recording Setup",
        "Develop a Photography Project",
        "Create a Music Production Setup",
        "Build a 3D Printing Project"
      ]
    }
    return suggestions[category as keyof typeof suggestions] || suggestions.software
  }

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4009"
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.topic.trim() || !formData.availableHours) {
      toast.error("Please fill in the project topic and available hours.")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Fetch user profile data if user is signed in
      let userProfile = null;
      if (isSignedIn && user) {
        userProfile = await fetchUserProfile();
        console.log('Fetched user profile:', userProfile);
        
        // If profile fetch failed, continue without it
        if (!userProfile) {
          console.log('Profile fetch failed, proceeding without profile data');
        }
      }

      const skillLevel = getExperienceLabel(formData.experienceLevel[0]).toLowerCase()
      const requestData = {
        topic: formData.topic,
        available_time: `${formData.availableHours} hours`,
        skill_level: skillLevel,
        category: formData.category,
        user_description: formData.userDescription,
        youtube_url: formData.youtubeUrl || "",
        user_profile: userProfile || {}, // Include user profile data (empty object if not available)
      }
      
      console.log('Sending request with user profile:', userProfile);
      
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
        githubTemplates: data.github_templates || { 
          repositories: [], 
          tools: { type: 'software', tools: [], description: "" } 
        },
        hardwareSuggestions: data.hardware_suggestions || undefined,
        softwareTools: data.software_tools || undefined,
        flowchart: data.flowchart || undefined,
        userProfileUsed: data.project_data?.user_profile_used || null,
      }
      
      // Debug: Log the tools and materials data
      console.log('Raw tools_and_materials:', data.project_data?.tools_and_materials)
      console.log('Parsed tools:', transformedRoadmap.tools)
      console.log('Full project data:', data.project_data)
      console.log('User profile used:', data.project_data?.user_profile_used)

      setRoadmap(transformedRoadmap)
      
      // Generate flowchart for the project
      try {
        const flowchartResponse = await fetch(`${BACKEND_URL}/api/generate-flowchart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_data: transformedRoadmap }),
        })
        
        if (flowchartResponse.ok) {
          const flowchartData = await flowchartResponse.json()
          if (flowchartData.success) {
            setRoadmap(prev => prev ? { ...prev, flowchart: flowchartData } : prev)
          }
        }
      } catch (flowchartError) {
        console.error('Failed to generate flowchart:', flowchartError)
        // Don't fail the entire request if flowchart generation fails
      }
      
      toast.success("Your personalized project roadmap has been created successfully.")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
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
        toast.success("Successfully connected to the backend server.")
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      toast.error("Could not connect to the backend server.")
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

  const parseHardwareSuggestions = (suggestionsText: string) => {
    if (!suggestionsText) return null
    
    const sections: any = {}
    const lines = suggestionsText.split('\n')
    let currentSection = ''
    let currentContent: string[] = []
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Check for section headers
      if (trimmedLine.includes('CIRCUIT DIAGRAM:')) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim()
        }
        currentSection = 'circuitDiagram'
        currentContent = []
      } else if (trimmedLine.includes('COMPONENT LIST:')) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim()
        }
        currentSection = 'componentList'
        currentContent = []
      } else if (trimmedLine.includes('POWER REQUIREMENTS:')) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim()
        }
        currentSection = 'powerRequirements'
        currentContent = []
      } else if (trimmedLine.includes('TOOLS NEEDED:')) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim()
        }
        currentSection = 'toolsNeeded'
        currentContent = []
      } else if (trimmedLine.includes('LEARNING RESOURCES:')) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim()
        }
        currentSection = 'learningResources'
        currentContent = []
      } else if (trimmedLine.includes('IMPLEMENTATION NOTES:')) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim()
        }
        currentSection = 'implementationNotes'
        currentContent = []
      } else if (currentSection && trimmedLine) {
        currentContent.push(trimmedLine)
      }
    }
    
    // Add the last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim()
    }
    
    return sections
  }

  const parseComponentList = (componentListText: string) => {
    if (!componentListText) return []
    
    const components: any[] = []
    const lines = componentListText.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('-') && trimmedLine.includes(' - ')) {
        const parts = trimmedLine.replace('-', '').trim().split(' - ')
        if (parts.length >= 3) {
          components.push({
            name: parts[0].trim(),
            quantity: parts[1].trim(),
            purpose: parts[2].trim(),
            cost: parts[3]?.trim() || 'Varies'
          })
        }
      }
    }
    
    return components
  }

  const parseSoftwareTools = (toolsText: string) => {
    if (!toolsText) return []
    
    const tools: any[] = []
    const lines = toolsText.split('\n')
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('-') && trimmedLine.includes('(') && trimmedLine.includes(')')) {
        const toolPart = trimmedLine.replace('-', '').trim()
        const name = toolPart.split('(')[0].trim()
        const description = toolPart.split('(')[1].split(')')[0].trim()
        
        tools.push({
          name: name,
          description: description,
          category: 'development_tool',
          version: 'Latest'
        })
      } else if (trimmedLine.startsWith('-')) {
        const name = trimmedLine.replace('-', '').trim()
        tools.push({
          name: name,
          description: 'Essential for this project',
          category: 'development_tool',
          version: 'Latest'
        })
      }
    }
    
    return tools
  }

  // Handle project completion
  const handleProjectComplete = async () => {
    console.log('=== PROJECT COMPLETE BUTTON CLICKED ===');
    console.log('isSignedIn:', isSignedIn);
    console.log('roadmap exists:', !!roadmap);
    
    if (!isSignedIn) {
      toast.error('Please sign in to mark projects as complete');
      return;
    }

    if (!roadmap) {
      toast.error('No project to complete');
      return;
    }

    setIsCompleting(true);
    try {
      console.log('Starting project completion...');
      
      const response = await fetch('/api/project-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectData: roadmap,
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Project completion response:', data);

      if (data.success) {
        toast.success(`🎉 Project completed! Skills added: ${data.extractedSkills || 'Various skills'}`);
        // Optionally redirect to profile page to see updated skills
        // window.location.href = '/profile';
      } else {
        toast.error(data.error || 'Failed to complete project');
      }
    } catch (error) {
      console.error('Error completing project:', error);
      toast.error(`Failed to complete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCompleting(false);
    }
  };

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
                
                {/* User Profile Indicator */}
                {isSignedIn && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Personalized with your profile data
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Your age, skills, education level, and previous projects will be considered for better project recommendations.
                    </p>
                    <p className="text-xs text-blue-500 dark:text-blue-300 mt-2">
                      💡 Having issues? Make sure you've created a profile in the Profile section first.
                    </p>
                  </div>
                )}
                
                {!isSignedIn && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        Sign in for personalized recommendations
                      </span>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Create a profile to get project recommendations tailored to your skills and experience.
                    </p>
                  </div>
                )}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                      Project Category
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div
                        onClick={() => setFormData({ ...formData, category: 'software' })}
                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                          formData.category === 'software'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        {formData.category === 'software' && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">Software</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Apps, Websites, APIs</div>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setFormData({ ...formData, category: 'hardware' })}
                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                          formData.category === 'hardware'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        {formData.category === 'hardware' && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Cpu className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">Hardware</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">IoT, Electronics, Robotics</div>
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => setFormData({ ...formData, category: 'other' })}
                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                          formData.category === 'other'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        {formData.category === 'other' && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800 dark:text-slate-200">Other</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Creative, Mixed Media</div>
                          </div>
                        </div>
                      </div>
                    </div>
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

            {/* Results Section */}
            {roadmap && (
              <div className="mt-6">
                <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  
            </Card>
              </div>
            )}
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
                  {getCategorySuggestions(formData.category).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
                    >
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {suggestion}
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
            {/* Main Roadmap Card */}
            <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 pb-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-blue-900/20">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                      {roadmap.title}
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
                      Your personalized project roadmap with step-by-step guidance
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={`border text-sm px-3 py-1 ${getExperienceColor(roadmap.experienceLevel)}`}>
                      {roadmap.experienceLevel}
                    </Badge>
                    <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-700 px-3 py-1 rounded-full">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{roadmap.totalDuration}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="space-y-10">
                  {/* Project Overview - Enhanced */}
                  {roadmap.projectOverview && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span>Project Overview</span>
                      </h3>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
                        {roadmap.projectOverview}
                      </p>
                    </div>
                  )}

                  {/* User Profile Usage Indicator */}
                  {roadmap.userProfileUsed && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                          <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span>Personalization Applied</span>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                            {roadmap.userProfileUsed.age}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Age</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                            {roadmap.userProfileUsed.education_level}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Education</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                            {roadmap.userProfileUsed.skills_count}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Skills</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                            {roadmap.userProfileUsed.previous_projects_count}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">Previous Projects</div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 text-center">
                        This project was personalized based on your profile data for better recommendations.
                      </p>
                    </div>
                  )}

                  {/* Project Stats Grid - Enhanced */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Domain */}
                    {roadmap.domain && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Domain</h4>
                        </div>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 text-sm">
                          {roadmap.domain}
                        </Badge>
                      </div>
                    )}

                    {/* Difficulty Level */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Difficulty</h4>
                      </div>
                      <Badge className={`border text-sm ${getExperienceColor(roadmap.experienceLevel)}`}>
                        {roadmap.experienceLevel}
                      </Badge>
                    </div>

                    {/* Time Estimate */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Time Estimate</h4>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{roadmap.totalDuration}</span>
                    </div>

                    {/* Knowledge Assessment */}
                    {roadmap.knowledgeAssessment && (
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Knowledge Level</h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {roadmap.knowledgeAssessment}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tools & Materials - Enhanced */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span>Tools & Materials</span>
                    </h3>
                    
                    {/* Software Tools - Structured Display */}
                    {roadmap.softwareTools && roadmap.softwareTools.tools && roadmap.softwareTools.tools.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {roadmap.softwareTools.tools.map((tool, index) => (
                            <div key={index} className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700 shadow-sm">
                              <div className="flex items-start space-x-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                                    {tool.name}
                                  </h4>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {tool.description}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 text-xs">
                                      {tool.category}
                                    </Badge>
                                    <Badge className={`text-xs ${
                                      roadmap.softwareTools?.type === 'software' 
                                        ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                        : 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
                                    }`}>
                                      {roadmap.softwareTools?.type === 'software' ? tool.version : 'Required'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Fallback to regular tools display */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {roadmap.tools && roadmap.tools.length > 0 ? (
                          roadmap.tools.map((tool, index) => (
                            <div key={index} className="flex items-start space-x-3 bg-white dark:bg-slate-700 rounded-lg p-3 border border-emerald-200 dark:border-emerald-700 shadow-sm">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{tool}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-500 dark:text-slate-500 italic col-span-2 text-center py-4">
                            No tools and materials specified
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Project Flowchart - Enhanced */}
                  {roadmap.flowchart && roadmap.flowchart.success && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                          <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span>Project Workflow</span>
                      </h3>
                      
                      <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700 shadow-sm">
                        {roadmap.flowchart.image_base64 ? (
                          <div className="flex flex-col items-center">
                            <img 
                              src={`data:image/png;base64,${roadmap.flowchart.image_base64}`}
                              alt="Project Workflow Diagram"
                              className="max-w-full h-auto rounded-lg shadow-md"
                              style={{ maxHeight: '600px' }}
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                              AI-generated workflow diagram for your project
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <BarChart3 className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Flowchart generation in progress...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prerequisites - Enhanced */}
                  {roadmap.prerequisites && roadmap.prerequisites.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span>Prerequisites</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {roadmap.prerequisites.map((prereq, index) => (
                          <div key={index} className="flex items-start space-x-3 bg-white dark:bg-slate-700 rounded-lg p-3 border border-blue-200 dark:border-blue-700 shadow-sm">
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{prereq}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Objectives - Enhanced */}
                  {roadmap.learningObjectives && roadmap.learningObjectives.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span>Learning Objectives</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {roadmap.learningObjectives.map((objective, index) => (
                          <div key={index} className="flex items-start space-x-3 bg-white dark:bg-slate-700 rounded-lg p-3 border border-purple-200 dark:border-purple-700 shadow-sm">
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{objective}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project Timeline - Enhanced */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-6 flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                        <span>Project Timeline</span>
                      </h3>
                    <div className="space-y-4">
                        {roadmap.days.map((day, index) => (
                        <Card key={index} className="border border-orange-200 dark:border-orange-700 bg-white dark:bg-slate-700 shadow-sm">
                          <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                                  <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">{day.day}</span>
                                </div>
                                <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
                                  {day.title}
                                </CardTitle>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-1 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded-full">
                                  <Clock className="h-3 w-3" />
                                  <span className="font-medium">{day.duration}</span>
                                </div>
                                  {day.milestone && (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 text-xs">
                                      Milestone
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                                {/* Tasks */}
                                <div className="space-y-2">
                                  {day.tasks.map((task, taskIndex) => (
                                  <div key={taskIndex} className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-600 rounded-lg p-3">
                                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-bold">{taskIndex + 1}</span>
                                      </div>
                                    <span className="text-sm text-slate-700 dark:text-slate-300">{task}</span>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Videos for this phase */}
                                {day.videos && day.videos.length > 0 && (
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                                    <Play className="h-4 w-4 text-red-600" />
                                      <span>Learning Videos</span>
                                    </h4>
                                  <div className="grid grid-cols-1 gap-3">
                                    {day.videos.map((video, videoIndex) => {
                                      // Ensure video is an object with required properties
                                      if (!video || typeof video !== 'object') {
                                        return null;
                                      }
                                      
                                      const videoTitle = video.title || video.name || 'Untitled Video';
                                      const videoChannel = video.channel || video.author || 'Unknown Channel';
                                      const videoLink = video.link || video.url || '#';
                                      const videoViews = video.views || '';
                                      const videoPublishedDate = video.published_date || video.publishedDate || '';
                                      
                                      return (
                                      <Card key={videoIndex} className="border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors bg-white dark:bg-slate-700">
                                        <CardContent className="p-3">
                                          <div className="space-y-2">
                                              <div className="flex items-start justify-between">
                                              <h5 className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                                                  {videoTitle}
                                                </h5>
                                              </div>
                                              <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                                                <span className="font-medium">{videoChannel}</span>
                                                {videoViews && (
                                                  <>
                                                    <span>•</span>
                                                    <span>{videoViews}</span>
                                                  </>
                                                )}
                                                {videoPublishedDate && (
                                                  <>
                                                    <span>•</span>
                                                    <span>{videoPublishedDate}</span>
                                                  </>
                                                )}
                                              </div>
                                              <a
                                                href={videoLink}
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
                                      );
                                    })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                  {/* Additional Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Templates & Hints */}
                    {roadmap.templatesHints && (
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-3">
                          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <span>Templates & Hints</span>
                        </h3>
                        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {roadmap.templatesHints}
                          </p>
                      </div>
                  </div>
                    )}

                    {/* Success Criteria */}
                    {roadmap.successCriteria && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                          <span>Success Criteria</span>
                        </h3>
                        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-green-200 dark:border-green-700">
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {roadmap.successCriteria}
                          </p>
                        </div>
                            </div>
                          )}
                    </div>

                    {/* Next Steps */}
                    {roadmap.nextSteps && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                          <ArrowRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                          <span>Next Steps & Extensions</span>
                        </h3>
                      <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              {roadmap.nextSteps}
                            </p>
                      </div>
                      </div>
                    )}

                    {/* Common Pitfalls */}
                    {roadmap.commonPitfalls && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                        <span>Common Pitfalls & Troubleshooting</span>
                      </h3>
                      <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-red-200 dark:border-red-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {roadmap.commonPitfalls}
                          </p>
                  </div>
                    </div>
                  )}

                  {/* GitHub Starter Templates */}
                  {roadmap.githubTemplates && roadmap.githubTemplates.repositories && roadmap.githubTemplates.repositories.length > 0 && (
                    <div className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-900/20 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                          <Code className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <span>GitHub Starter Templates</span>
                      </h3>
                  <div className="space-y-4">
                        {roadmap.githubTemplates.repositories.map((repo, index) => (
                          <Card key={index} className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                            <CardHeader>
                              <CardTitle className="text-base text-blue-600 dark:text-blue-400 hover:underline">
                                <a href={repo.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2">
                                  <span>{repo.name}</span>
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                          </CardTitle>
                              <CardDescription className="text-xs text-slate-600 dark:text-slate-400">{repo.desc}</CardDescription>
                        </CardHeader>
                            {repo.analysis && (
                        <CardContent>
                                <div className="space-y-3">
                                  <div className="flex items-center text-sm">
                                    <strong className="w-28 text-slate-700 dark:text-slate-300">Match Score:</strong>
                                    <Badge variant="secondary">{repo.analysis.match_score}</Badge>
                              </div>
                                  <div className="flex items-start text-sm">
                                    <strong className="w-28 text-slate-700 dark:text-slate-300 flex-shrink-0">Useful For:</strong>
                                    <span className="text-slate-600 dark:text-slate-400">{repo.analysis.useful_for}</span>
                                  </div>
                                  <div>
                                    <strong className="text-sm text-slate-700 dark:text-slate-300">Pros:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                      {repo.analysis.pros.map((pro, i) => (
                                        <li key={i} className="text-xs text-slate-600 dark:text-slate-400">{pro}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <strong className="text-sm text-slate-700 dark:text-slate-300">Cons:</strong>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                      {repo.analysis.cons.map((con, i) => (
                                        <li key={i} className="text-xs text-slate-600 dark:text-slate-400">{con}</li>
                                      ))}
                                    </ul>
                                  </div>
                          </div>
                        </CardContent>
                            )}
                      </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hardware Suggestions */}
                  {roadmap.hardwareSuggestions && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <Cpu className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span>Hardware Components</span>
                      </h3>
                      
                      {roadmap.hardwareSuggestions.description && (
                        <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-green-200 dark:border-green-700 mb-6">
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Project Overview</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {roadmap.hardwareSuggestions.description}
                          </p>
                        </div>
                      )}

                      {/* Parse and display structured content from suggestions */}
                      {roadmap.hardwareSuggestions.suggestions && (() => {
                        const parsedSections = parseHardwareSuggestions(roadmap.hardwareSuggestions.suggestions)
                        return (
                          <div className="space-y-6">
                            {/* Circuit Diagram */}
                            {parsedSections?.circuitDiagram && (
                              <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-green-200 dark:border-green-700">
                                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                                  <Zap className="h-4 w-4 text-blue-600" />
                                  <span>Circuit Diagram</span>
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {parsedSections.circuitDiagram}
                                </p>
                              </div>
                            )}

                            {/* Component List */}
                            {parsedSections?.componentList && (() => {
                              const components = parseComponentList(parsedSections.componentList)
                              return components.length > 0 ? (
                                <div>
                                  <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-2">
                                    <Package className="h-4 w-4 text-green-600" />
                                    <span>Required Components</span>
                                  </h4>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {components.map((component, index) => (
                                      <Card key={index} className="bg-white dark:bg-slate-700 border-green-200 dark:border-green-700 shadow-sm">
                                        <CardHeader className="pb-3">
                                          <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                              {component.name}
                        </CardTitle>
                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                              {component.cost}
                                            </Badge>
                                          </div>
                      </CardHeader>
                                        <CardContent className="pt-0">
                                          <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                              <div className="bg-slate-50 dark:bg-slate-600 rounded p-2">
                                                <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity</div>
                                                <div className="text-slate-600 dark:text-slate-400">{component.quantity}</div>
                            </div>
                                              <div className="bg-slate-50 dark:bg-slate-600 rounded p-2">
                                                <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">Purpose</div>
                                                <div className="text-slate-600 dark:text-slate-400">{component.purpose}</div>
                                              </div>
                                            </div>
                                            
                                            {/* Shopping Links */}
                                            {roadmap.hardwareSuggestions && 
                                             roadmap.hardwareSuggestions.shopping_links && 
                                             roadmap.hardwareSuggestions.shopping_links[component.name] && 
                                             roadmap.hardwareSuggestions.shopping_links[component.name].length > 0 && (
                                              <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                                                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center space-x-2">
                                                  <ExternalLink className="h-3 w-3" />
                                                  <span>Shopping Options</span>
                                                </div>
                                                <div className="space-y-2">
                                                  {roadmap.hardwareSuggestions.shopping_links[component.name].slice(0, 2).map((item, itemIndex) => (
                                                    <a
                                                      key={itemIndex}
                                                      href={item.link}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="block bg-slate-50 dark:bg-slate-600 rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors border border-slate-200 dark:border-slate-500"
                                                    >
                                                      <div className="space-y-2">
                                                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                                                          {item.title}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                          <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                                                            <span className="font-semibold text-green-600 dark:text-green-400">{item.price}</span>
                                                            {item.rating && (
                                                              <>
                                                                <span>•</span>
                                                                <span className="flex items-center">
                                                                  <span className="text-yellow-500 mr-1">⭐</span>
                                                                  {item.rating}
                                                                </span>
                                                              </>
                                                            )}
                                                            {item.reviews && (
                                                              <>
                                                                <span>•</span>
                                                                <span>({item.reviews} reviews)</span>
                                                              </>
                                                            )}
                                                          </div>
                                                          <ExternalLink className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                                        </div>
                                                      </div>
                                                    </a>
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
                              ) : null
                            })()}

                            {/* Power Requirements */}
                            {parsedSections?.powerRequirements && (
                              <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-green-200 dark:border-green-700">
                                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                                  <Zap className="h-4 w-4 text-yellow-600" />
                                  <span>Power Requirements</span>
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {parsedSections.powerRequirements}
                                </p>
                              </div>
                            )}

                            {/* Tools Needed */}
                            {parsedSections?.toolsNeeded && (
                              <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-green-200 dark:border-green-700">
                                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                                  <Wrench className="h-4 w-4 text-orange-600" />
                                  <span>Tools Needed</span>
                                </h4>
                                <div className="space-y-2">
                                  {parsedSections.toolsNeeded.split('\n').map((tool: string, index: number) => {
                                    if (tool.trim().startsWith('-')) {
                                      return (
                                        <div key={index} className="flex items-start space-x-2">
                                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                          <span className="text-sm text-slate-600 dark:text-slate-400">{tool.replace('-', '').trim()}</span>
                                        </div>
                                      )
                                    }
                                    return null
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Learning Resources */}
                            {parsedSections?.learningResources && (
                              <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-green-200 dark:border-green-700">
                                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  <span>Learning Resources</span>
                                </h4>
                                <div className="space-y-2">
                                  {parsedSections.learningResources.split('\n').map((resource: string, index: number) => {
                                    if (resource.trim().startsWith('-') && resource.includes(' - ')) {
                                      const parts = resource.replace('-', '').trim().split(' - ')
                                      const name = parts[0]
                                      const url = parts[1]
                                      const description = parts[2]
                                      
                                      return (
                                        <div key={index} className="space-y-1">
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                                          >
                                            <span>{name}</span>
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                          {description && (
                                            <p className="text-xs text-slate-600 dark:text-slate-400">{description}</p>
                                          )}
                                        </div>
                                      )
                                    }
                                    return null
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Implementation Notes */}
                            {parsedSections?.implementationNotes && (
                              <div className="bg-white dark:bg-slate-700 rounded-lg p-4 border border-green-200 dark:border-green-700">
                                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                                  <Lightbulb className="h-4 w-4 text-amber-500" />
                                  <span>Implementation Notes</span>
                                </h4>
                                <div className="space-y-2">
                                  {parsedSections.implementationNotes.split('\n').map((note: string, index: number) => {
                                    if (note.trim().startsWith('-')) {
                                      return (
                                        <div key={index} className="flex items-start space-x-2">
                                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                                          <span className="text-sm text-slate-600 dark:text-slate-400">{note.replace('-', '').trim()}</span>
                                        </div>
                                      )
                                    }
                                    return null
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Fallback: Show structured components if available */}
                      {(!roadmap.hardwareSuggestions.suggestions || !parseHardwareSuggestions(roadmap.hardwareSuggestions.suggestions)) && 
                       roadmap.hardwareSuggestions.components && roadmap.hardwareSuggestions.components.length > 0 && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-2">
                              <Package className="h-4 w-4 text-green-600" />
                              <span>Required Components</span>
                            </h4>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {roadmap.hardwareSuggestions.components.map((component, index) => (
                                <Card key={index} className="bg-white dark:bg-slate-700 border-green-200 dark:border-green-700 shadow-sm">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        {component.name}
                          </CardTitle>
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                        {component.cost}
                                      </Badge>
                                    </div>
                        </CardHeader>
                                  <CardContent className="pt-0">
                                    <div className="space-y-3">
                                      <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="bg-slate-50 dark:bg-slate-600 rounded p-2">
                                          <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity</div>
                                          <div className="text-slate-600 dark:text-slate-400">{component.quantity}</div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-600 rounded p-2">
                                          <div className="font-medium text-slate-700 dark:text-slate-300 mb-1">Purpose</div>
                                          <div className="text-slate-600 dark:text-slate-400">{component.purpose}</div>
                                        </div>
                                      </div>
                                      
                                      {/* Shopping Links */}
                                      {roadmap.hardwareSuggestions && 
                                       roadmap.hardwareSuggestions.shopping_links && 
                                       roadmap.hardwareSuggestions.shopping_links[component.name] && 
                                       roadmap.hardwareSuggestions.shopping_links[component.name].length > 0 && (
                                        <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                                          <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center space-x-2">
                                            <ExternalLink className="h-3 w-3" />
                                            <span>Shopping Options</span>
                                          </div>
                                          <div className="space-y-2">
                                            {roadmap.hardwareSuggestions.shopping_links[component.name].slice(0, 2).map((item, itemIndex) => (
                                              <a
                                                key={itemIndex}
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block bg-slate-50 dark:bg-slate-600 rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors border border-slate-200 dark:border-slate-500"
                                              >
                                                <div className="space-y-2">
                                                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                                                    {item.title}
                                                  </div>
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                                                      <span className="font-semibold text-green-600 dark:text-green-400">{item.price}</span>
                                                      {item.rating && (
                                                        <>
                                                          <span>•</span>
                                                          <span className="flex items-center">
                                                            <span className="text-yellow-500 mr-1">⭐</span>
                                                            {item.rating}
                                                          </span>
                                                        </>
                                                      )}
                                                      {item.reviews && (
                                                        <>
                                                          <span>•</span>
                                                          <span>({item.reviews} reviews)</span>
                                                        </>
                                                      )}
                                                    </div>
                                                    <ExternalLink className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                                  </div>
                                                </div>
                                              </a>
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
                        </div>
                    )}
                  </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Done Button */}
            {roadmap && isSignedIn && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleProjectComplete}
                  disabled={isCompleting}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-5 w-5 mr-2" />
                      Project Done! 🎉
                    </>
                  )}
                </Button>
          </div>
        )}

            {/* Sign in prompt for non-authenticated users */}
            {roadmap && !isSignedIn && (
              <div className="mt-6 text-center">
                <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <Trophy className="h-6 w-6 text-amber-600" />
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        Track Your Progress
                      </h3>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Sign in to mark this project as complete and automatically add the skills you've learned to your profile!
                    </p>
                    <Button
                      onClick={() => window.location.href = '/sign-in'}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Sign In to Track Progress
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
