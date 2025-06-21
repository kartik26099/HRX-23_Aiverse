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

      toast({
        title: "Course Generated Successfully!",
        description: `"${newCourse.title}" has been added to your courses.`,
      })

      setIsGenerateDialogOpen(false)
      setFormData({ title: "", level: "beginner", goal: "", currentState: "" })
    } catch (error) {
      console.error("Failed to generate course:", error)
      toast({
        title: "Course Generation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
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
    } else {
      toast({
        title: "Course Not Found",
        description: "The selected course could not be found.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 flex-col border-r bg-muted/40 p-6 hidden lg:flex">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Experience Level</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">All Levels</Button>
              <Button variant="ghost" className="w-full justify-start">Beginner</Button>
              <Button variant="ghost" className="w-full justify-start">Intermediate</Button>
              <Button variant="ghost" className="w-full justify-start">Advanced</Button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Duration</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">Any Duration</Button>
              <Button variant="ghost" className="w-full justify-start">Short (&le; 4 weeks)</Button>
              <Button variant="ghost" className="w-full justify-start">Medium (5-8 weeks)</Button>
              <Button variant="ghost" className="w-full justify-start">Long (&gt; 8 weeks)</Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">AI CourseGen</h1>
            <p className="text-muted-foreground mt-2">Discover and generate personalized learning paths</p>
          </div>
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <PlusIcon className="mr-2 h-5 w-5" />
                Generate Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-2xl">Generate Custom Course</DialogTitle>
                <DialogDescription>
                  Describe your learning objectives, and our AI will craft a course just for you.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleGenerateCourse}>
                <div className="grid gap-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-title">Course Title</Label>
                    <Input
                      id="course-title"
                      placeholder="e.g., Introduction to Python"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Experience Level</Label>
                    <RadioGroup
                      value={formData.level}
                      onValueChange={(value) => setFormData({ ...formData, level: value })}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="beginner" id="beginner" />
                        <Label htmlFor="beginner">Beginner</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="intermediate" id="intermediate" />
                        <Label htmlFor="intermediate">Intermediate</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="advanced" id="advanced" />
                        <Label htmlFor="advanced">Advanced</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="learning-goal">Learning Goal</Label>
                    <Textarea
                      id="learning-goal"
                      placeholder="What do you want to achieve with this course?"
                      rows={3}
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current-knowledge">Current Knowledge</Label>
                    <Textarea
                      id="current-knowledge"
                      placeholder="What do you already know about this subject?"
                      rows={3}
                      value={formData.currentState}
                      onChange={(e) => setFormData({ ...formData, currentState: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isGenerating} className="w-full">
                    {isGenerating ? "Generating..." : "Generate Course"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search courses..." className="pl-10 h-12 text-base" />
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex space-x-2">
                  <Badge variant="secondary">{course.level}</Badge>
                  <Badge variant="outline">{course.duration}</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleViewCourse(course.id)}>
                  View Course <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* View Course Details Dialog */}
        {selectedCourse && (
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-6 pb-4">
                <DialogTitle className="text-3xl font-bold tracking-tight">{selectedCourse.title}</DialogTitle>
                <DialogDescription className="pt-2 text-base">{selectedCourse.description}</DialogDescription>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground pt-3">
                  <div className="flex items-center"><BarChart3 className="mr-1.5 h-4 w-4" /> {selectedCourse.level}</div>
                  <div className="flex items-center"><Clock className="mr-1.5 h-4 w-4" /> {selectedCourse.duration}</div>
                  <div className="flex items-center"><BookOpen className="mr-1.5 h-4 w-4" /> {selectedCourse.modules.length} Modules</div>
                </div>
              </DialogHeader>
              <div className="flex-grow overflow-y-auto px-6 pb-6">
                <div className="mb-6 bg-muted/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">What You'll Learn</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    {selectedCourse.learning_objectives.map((obj, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <h3 className="text-xl font-semibold mb-4">Course Content</h3>
                <div className="space-y-4">
                  {selectedCourse.modules.map((module, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 p-4">
                        <h4 className="text-lg font-semibold">{`Module ${index + 1}: ${module.title}`}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                      </div>
                      <div className="p-4 space-y-2">
                        {module.subsections.map((subsection, subIndex) => (
                          <div key={subIndex} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors cursor-pointer">
                            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                            <div className="flex-grow">
                              <p className="font-medium">{subsection.title}</p>
                            </div>
                            <span className="text-sm text-muted-foreground">{subsection.duration}</span>
                          </div>
                        ))}
                      </div>
                      {module.recommended_videos && module.recommended_videos.length > 0 && (
                        <div className="border-t p-4">
                          <h4 className="font-semibold mb-2 flex items-center"><Video className="mr-2 h-5 w-5" />Recommended Videos</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {module.recommended_videos.map((video, videoIndex) => (
                              <a href={video.link} target="_blank" rel="noopener noreferrer" key={videoIndex} className="block p-2 border rounded-lg hover:bg-muted transition-colors text-sm">
                                <p className="font-semibold truncate">{video.title}</p>
                                <p className="text-xs text-muted-foreground">{video.channel}</p>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}
