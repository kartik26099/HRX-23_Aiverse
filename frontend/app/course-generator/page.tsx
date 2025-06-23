"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  PlusIcon,
  Search,
  BookOpen,
  Video,
  CheckCircle,
  FileText,
  Clock,
  BarChart3,
  ArrowRight,
  Sparkles,
  Target,
  Brain,
  Zap,
} from "lucide-react"

// Define the structure for course content
interface Video {
  title: string
  link: string
  channel: string
  duration: string
}

interface Subsection {
  title: string
  content: string
  duration?: string // Optional duration for each subsection
}

interface Module {
  title:string
  description: string
  subsections: Subsection[]
  recommended_videos?: Video[]
}

interface Course {
  id: string
  title: string
  description: string
  level: "Beginner" | "Intermediate" | "Advanced"
  duration: string
  modules: Module[]
  learning_objectives: string[]
}

// Hardcoded initial courses with detailed modules and learning objectives
const initialCourses: Course[] = [
  {
    id: "frontend-dev",
    title: "Frontend Development: From Zero to Earning",
    description: "Learn to build responsive and interactive web applications with HTML, CSS, and JavaScript.",
    level: "Beginner",
    duration: "8 weeks",
    modules: [
      {
        title: "The Basics of Web",
        description: "Understand the fundamental building blocks of the web, including HTML for structure and CSS for styling.",
        subsections: [
          { title: "Introduction to HTML", content: "Learn about tags, elements, and the structure of a webpage.", duration: "35 min" },
          { title: "Styling with CSS", content: "Discover how to use selectors, properties, and values to make your websites look great.", duration: "50 min" },
          { title: "Your First Static Page", content: "Build and deploy a simple, single-page website from scratch.", duration: "1 hr 15 min" },
        ],
      },
      {
        title: "JavaScript Fundamentals",
        description: "Dive into the world of JavaScript to add interactivity and logic to your websites.",
        subsections: [
          { title: "Variables and Data Types", content: "Understand how to store and manipulate data in JavaScript.", duration: "45 min" },
          { title: "DOM Manipulation", content: "Learn how to dynamically change your webpage's content and structure.", duration: "1 hr" },
        ],
      },
    ],
    learning_objectives: [
      "Build responsive websites with HTML & CSS.",
      "Add interactivity to pages using JavaScript.",
      "Understand the core concepts of web development.",
      "Deploy a basic portfolio website.",
    ],
  },
  {
    id: "advanced-ui-ux",
    title: "Advanced UI/UX for Web & Mobile",
    description: "Master advanced frontend animations, accessibility, and state management for complex apps.",
    level: "Intermediate",
    duration: "10 weeks",
    modules: [
      {
        title: "Advanced CSS & Animations",
        description: "Go beyond basic styling with complex layouts and animations.",
        subsections: [
          { title: "CSS Grid and Flexbox", content: "Master modern layout techniques for responsive design.", duration: "1 hr 30 min" },
          { title: "CSS Transitions and Keyframes", content: "Bring your UI to life with smooth animations.", duration: "1 hr 10 min" },
        ],
      },
      {
        title: "JavaScript Frameworks",
        description: "Learn how to build scalable applications using a modern framework like React.",
        subsections: [
          { title: "Introduction to React", content: "Learn about components, state, and props.", duration: "2 hr" },
          { title: "State Management with Redux", content: "Manage application state efficiently in large-scale projects.", duration: "2 hr 30 min" },
        ],
      },
    ],
    learning_objectives: [
      "Design complex and responsive layouts.",
      "Implement advanced CSS animations.",
      "Build scalable applications with React.",
      "Manage application state with Redux.",
    ],
  },
]

// API endpoint for the course generation backend
const API_URL = "http://localhost:5002/generatecourse"

export default function CourseGeneratorPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // State for the generation form
  const [formData, setFormData] = useState({
    title: "",
    level: "beginner",
    goal: "",
    currentState: "",
  })

  const handleGenerateCourse = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.goal || !formData.currentState) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields to generate a course.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`)
      }

      const generatedCourse = await response.json()

      const newCourse: Course = {
        id: `gen-${Date.now()}`,
        title: generatedCourse.title,
        description: generatedCourse.goal,
        level: (generatedCourse.level.charAt(0).toUpperCase() + generatedCourse.level.slice(1)) as Course["level"],
        duration: "6 weeks", // Default duration for generated courses
        modules: generatedCourse.modules,
        learning_objectives: generatedCourse.modules.map((m: Module) => `Understand ${m.title.toLowerCase()}`),
      }

      setCourses((prev) => [newCourse, ...prev])
      setIsGenerateDialogOpen(false)
      setFormData({ title: "", level: "beginner", goal: "", currentState: "" })
      
      toast({
        title: "Course Generated!",
        description: "Your personalized course has been created successfully.",
      })
    } catch (error) {
      console.error("Error generating course:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewCourse = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId)
    if (course) {
      setSelectedCourse(course)
      setIsViewDialogOpen(true)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400 border-slate-200 dark:border-slate-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Course Generator
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
                Create personalized learning paths tailored to your goals
              </p>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed">
              Transform your learning goals into structured, comprehensive courses with AI-powered curriculum design. 
              Get personalized modules, learning objectives, and recommended resources.
            </p>
          </div>
        </div>

        {/* Generate Course Button */}
        <div className="text-center mb-12">
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg font-semibold group">
                <Sparkles className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                Generate New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-3">
                  <Brain className="h-6 w-6 text-blue-600" />
                  <span>Generate Personalized Course</span>
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400 text-base">
                  Tell us about your learning goals and current knowledge level to create a tailored course.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleGenerateCourse} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Course Topic
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Machine Learning, Web Development, Data Science"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-2 border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Experience Level</Label>
                    <RadioGroup
                      value={formData.level}
                      onValueChange={(value) => setFormData({ ...formData, level: value })}
                      className="mt-2 space-y-3"
                    >
                      {[
                        { value: "beginner", label: "Beginner", description: "New to the topic" },
                        { value: "intermediate", label: "Intermediate", description: "Some experience" },
                        { value: "advanced", label: "Advanced", description: "Experienced learner" },
                      ].map((level) => (
                        <div key={level.value} className="flex items-center space-x-3">
                          <RadioGroupItem value={level.value} id={level.value} />
                          <Label htmlFor={level.value} className="flex flex-col cursor-pointer">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{level.label}</span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">{level.description}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  
                  <div>
                    <Label htmlFor="goal" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Learning Goal
                    </Label>
                    <Textarea
                      id="goal"
                      placeholder="What do you want to achieve? What skills do you want to develop?"
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="mt-2 border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 min-h-[100px]"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="currentState" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Current Knowledge
                    </Label>
                    <Textarea
                      id="currentState"
                      placeholder="What do you already know about this topic? Any specific areas you want to focus on?"
                      value={formData.currentState}
                      onChange={(e) => setFormData({ ...formData, currentState: e.target.value })}
                      className="mt-2 border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 min-h-[100px]"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsGenerateDialogOpen(false)}
                    className="border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate Course
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Card key={course.id} className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <Badge className={`border-2 ${getLevelColor(course.level)}`}>
                    {course.level}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                  {course.title}
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                  {course.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center space-x-4 mb-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>{course.modules.length} modules</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span>Learning Objectives</span>
                  </h4>
                  <ul className="space-y-1">
                    {course.learning_objectives.slice(0, 3).map((objective, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{objective}</span>
                      </li>
                    ))}
                    {course.learning_objectives.length > 3 && (
                      <li className="text-sm text-slate-500 dark:text-slate-500 italic">
                        +{course.learning_objectives.length - 3} more objectives
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0">
                <Button
                  onClick={() => handleViewCourse(course.id)}
                  className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  <span>View Course Details</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Course Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700">
            {selectedCourse && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-3">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    <span>{selectedCourse.title}</span>
                  </DialogTitle>
                  <DialogDescription className="text-slate-600 dark:text-slate-400 text-base">
                    {selectedCourse.description}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Course Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Duration</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{selectedCourse.duration}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Level</span>
                      </div>
                      <Badge className={`border-2 ${getLevelColor(selectedCourse.level)}`}>
                        {selectedCourse.level}
                      </Badge>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Modules</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{selectedCourse.modules.length} modules</p>
                    </div>
                  </div>

                  {/* Learning Objectives */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span>Learning Objectives</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedCourse.learning_objectives.map((objective, index) => (
                        <div key={index} className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">{objective}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modules */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <span>Course Modules</span>
                    </h3>
                    <div className="space-y-4">
                      {selectedCourse.modules.map((module, moduleIndex) => (
                        <Card key={moduleIndex} className="border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                          <CardHeader>
                            <CardTitle className="text-lg text-slate-800 dark:text-slate-200">
                              Module {moduleIndex + 1}: {module.title}
                            </CardTitle>
                            <CardDescription className="text-slate-600 dark:text-slate-400">
                              {module.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {module.subsections.map((subsection, subsectionIndex) => (
                                <div key={subsectionIndex} className="flex items-start space-x-3 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">{subsectionIndex + 1}</span>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                                      {subsection.title}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                      {subsection.content}
                                    </p>
                                    {subsection.duration && (
                                      <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-500">
                                        <Clock className="h-3 w-3" />
                                        <span>{subsection.duration}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            {/* Module Videos */}
                            {module.recommended_videos && module.recommended_videos.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-2">
                                  <Video className="h-4 w-4 text-red-600" />
                                  <span>Recommended Videos</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {module.recommended_videos.map((video, videoIndex) => (
                                    <Card key={videoIndex} className="border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
                                      <CardContent className="p-3">
                                        <div className="space-y-2">
                                          <div className="flex items-start justify-between">
                                            <h5 className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                                              {video.title}
                                            </h5>
                                          </div>
                                          <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                                            <span className="font-medium">{video.channel}</span>
                                            {video.duration && (
                                              <>
                                                <span>•</span>
                                                <span>{video.duration}</span>
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
                                              <Video className="h-3 w-3 mr-1" />
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
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
