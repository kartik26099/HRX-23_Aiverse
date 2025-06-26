"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "@/components/ui/use-toast"
import {
  Bot,
  Target,
  Clock,
  FileText,
  Link as LinkIcon,
  ChevronsRight,
  Loader2,
  BrainCircuit,
  Wrench,
  Globe,
  Code,
  Cpu,
  BookOpen,
  FlaskConical,
  Github,
  Search,
  Sparkles,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"

// --- Constants ---
const API_BASE_URL = "http://localhost:4003"

// --- Type Definitions ---
interface Tool {
    name: string;
    url?: string;
    description: string;
}

interface ToolSuggestion {
  success: boolean
  project_type: "hardware" | "research" | "software"
  tools: {
    precise_topics?: string[];
    data_links?: { name: string; url: string; description: string }[];
    techniques?: { main: string; rest: string; main_url: string }[];
  }
}

interface Roadmap {
  title: string
  description: string
  timeline: string
  modules: {
    title: string
    description: string
    weeks: string
    tasks: {
      title: string
      description: string
      type: string
      resources?: { title: string; url: string; snippet: string }[]
    }[]
  }[]
}

// --- Helper Components ---
const RoadmapDisplay = ({ roadmap }: { roadmap: Roadmap | null }) => {
  if (!roadmap || !Array.isArray(roadmap.modules)) return null;

  return (
    <div className="mt-6 w-full max-w-full overflow-hidden">
      <Card className="border-dashed bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-[#181c24] dark:via-[#23283a] dark:to-[#181c24]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl md:text-2xl break-words">
            <Sparkles className="text-primary h-6 w-6 md:h-7 md:w-7 flex-shrink-0" /> 
            <span className="min-w-0">{roadmap.title}</span>
          </CardTitle>
          <CardDescription className="text-base md:text-lg break-words">{roadmap.description}</CardDescription>
          <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>Timeline: {roadmap.timeline}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 md:space-y-10 px-4 md:px-6">
          {roadmap.modules.map((module, moduleIndex) => (
            <div
              key={moduleIndex}
              className="relative rounded-xl md:rounded-2xl shadow-lg md:shadow-xl border-0 p-0 mb-6 md:mb-10 overflow-hidden group w-full"
            >
              {/* AI-themed gradient border */}
              <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-400/30 via-fuchsia-400/20 to-cyan-400/30 dark:from-blue-900/40 dark:via-fuchsia-900/20 dark:to-cyan-900/30 rounded-xl md:rounded-2xl blur-[2px] group-hover:blur-sm transition-all duration-300" />
              <div className="relative z-10 bg-white dark:bg-[#181c24] rounded-xl md:rounded-2xl p-4 md:p-6 border border-slate-200 dark:border-slate-800 w-full">
                <div className="flex flex-col md:flex-row md:items-center mb-3 md:mb-2 gap-2 md:gap-0">
                  <span className="text-lg md:text-xl font-bold text-primary mr-0 md:mr-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" /> 
                    Module {moduleIndex + 1}
                  </span>
                  <h3 className="text-lg md:text-xl font-semibold flex items-center break-words">
                    <ChevronsRight className="mr-2 h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" /> 
                    <span className="min-w-0">{module.title}</span>
                  </h3>
                </div>
                <p className="text-muted-foreground mb-4 pl-0 md:pl-7 text-sm md:text-base break-words">{module.description}</p>
                <Accordion type="multiple" className="w-full pl-0 md:pl-7">
                  {module.tasks.map((task, taskIndex) => (
                    <AccordionItem
                      key={taskIndex}
                      value={`item-${moduleIndex}-${taskIndex}`}
                      className="bg-muted/30 dark:bg-[#23283a] rounded-lg mb-3"
                    >
                      <AccordionTrigger className="text-base md:text-lg font-semibold px-3 md:px-4">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center w-full pr-2 md:pr-4 gap-2 md:gap-0">
                          <span className="text-left font-semibold break-words">
                            Step {moduleIndex + 1}.{taskIndex + 1}: {task.title}
                          </span>
                          <span className="ml-0 md:ml-2 px-2 py-1 rounded bg-primary/10 text-primary text-xs select-none no-underline hover:no-underline focus:no-underline active:no-underline pointer-events-none self-start md:self-auto">
                            {task.type}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 px-3 md:px-4 pb-4">
                        <p className="text-muted-foreground text-sm md:text-base break-words">{task.description}</p>
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center text-sm md:text-base">
                            <FileText className="mr-2 h-4 w-4 text-blue-500 flex-shrink-0" />
                            Suggested Learning Resources
                          </h4>
                          {task.resources && task.resources.length > 0 ? (
                            <div className="space-y-2 text-sm md:text-base">
                              {task.resources.map((res, resIndex) => (
                                <a
                                  key={resIndex}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex flex-col md:flex-row md:items-center gap-2 p-2 rounded-md border border-muted/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors break-words"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <LinkIcon className="h-4 w-4 flex-shrink-0 text-primary" />
                                    <span className="font-medium text-primary underline-offset-4 hover:underline break-words">
                                      {res.title}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground ml-0 md:ml-2 break-words">{res.snippet}</span>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground pl-2 py-2">
                              No resources found for this step.
                            </p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

const ToolDisplay = ({ suggestion }: { suggestion: ToolSuggestion }) => {
    const { tools } = suggestion;
    return (
        <div className="mt-8 space-y-6 md:space-y-8 w-full max-w-full overflow-hidden">
            {/* Block 1: Suggested Precise Research Topics */}
            <Card className="shadow-lg border-l-4 border-sky-500 w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                        <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-sky-500 flex-shrink-0" />
                        Suggested Precise Research Topics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc pl-4 md:pl-6 space-y-2">
                        {tools.precise_topics && tools.precise_topics.map((topic, idx) => (
                            <li key={idx} className="text-sm md:text-lg text-muted-foreground break-words">{topic}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* Block 2: Data Links */}
            <Card className="shadow-lg border-l-4 border-green-500 w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                        <Globe className="h-5 w-5 md:h-6 md:w-6 text-green-500 flex-shrink-0" />
                        Data Related to Topic
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3 md:space-y-4">
                        {tools.data_links && tools.data_links.map((item, idx) => (
                            <li key={idx} className="p-3 md:p-4 rounded-md bg-muted/50 border border-muted-foreground/20 break-words">
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-base md:text-lg hover:underline text-primary break-words">
                                    {item.name}
                                </a>
                                <p className="text-muted-foreground mt-1 text-sm md:text-base break-words">{item.description}</p>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            {/* Block 3: Techniques */}
            <Card className="shadow-lg border-l-4 border-amber-500 w-full">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                        <FlaskConical className="h-5 w-5 md:h-6 md:w-6 text-amber-500 flex-shrink-0" />
                        Suggested Research Techniques
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc pl-4 md:pl-6 space-y-2">
                        {tools.techniques && tools.techniques.map((tech, idx) => (
                            <li key={idx} className="text-sm md:text-lg text-muted-foreground break-words">
                                <a href={tech.main_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline break-words">
                                    {tech.main}
                                </a>{tech.rest}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};


// --- Main Component ---
export default function ResearchHelperPage() {
  // --- State Management ---
  const [projectIdea, setProjectIdea] = useState("")
  const [toolSuggestion, setToolSuggestion] = useState<ToolSuggestion | null>(null)
  const [isFindingTools, setIsFindingTools] = useState(false)
  
  const [roadmapData, setRoadmapData] = useState({
    topic: "",
  })
  const [skillLevel, setSkillLevel] = useState("Beginner")
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false)

  // --- API Handlers ---
  const handleFindTools = async () => {
    if (!projectIdea.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project idea to get suggestions.",
        variant: "destructive",
      })
      return
    }

    setIsFindingTools(true)
    setToolSuggestion(null)
    toast({
      title: "Searching",
      description: "Searching for the best resources for your project.",
    })

    try {
      const response = await fetch(`${API_BASE_URL}/api/suggest-tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_idea: projectIdea }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to get tool suggestions.")
      }

      const data: ToolSuggestion = await response.json()
      if (data.success) {
        setToolSuggestion(data)
        toast({
          title: "Success",
          description: "Tool suggestions have been loaded.",
        })
      } else {
        throw new Error((data as any).error || "An unknown error occurred in the backend.")
      }

    } catch (error) {
      console.error("Tool suggestion error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsFindingTools(false)
    }
  }

  const handleGenerateRoadmap = async () => {
    if (!roadmapData.topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a research topic.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingRoadmap(true)
    setRoadmap(null)
    toast({
      title: "Generating",
      description: "Your personalized research plan is being created.",
    })

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...roadmapData, skill_level: skillLevel }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to generate roadmap.")
      }

      const data: Roadmap = await response.json()
      setRoadmap(data)
      toast({
        title: "Success",
        description: "Your research roadmap has been generated.",
      })
    } catch (error) {
      console.error("Roadmap generation error:", error)
      setRoadmap(null)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingRoadmap(false)
    }
  }

  // --- Render ---
  return (
    <div className="container py-6 md:py-8 max-w-7xl mx-auto px-4 md:px-6">
      <div className="mb-6 md:mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Research Helper</h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Find the right tools for your project and plan your research journey.
        </p>
      </div>

      <Tabs defaultValue="tool-finder" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tool-finder">Tool Finder</TabsTrigger>
          <TabsTrigger value="roadmap">Research Roadmap</TabsTrigger>
        </TabsList>

        {/* Tool Finder Tab */}
        <TabsContent value="tool-finder">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center text-xl md:text-2xl"><Wrench className="mr-3 h-5 w-5 md:h-6 md:w-6 flex-shrink-0" /> Project Tool Finder</CardTitle>
              <CardDescription className="text-sm md:text-base">Describe your project idea to get personalized recommendations for tools, datasets, and papers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row w-full items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-2">
                  <Input
                    type="text"
                    placeholder="Enter the topic you want to research"
                    value={projectIdea}
                    onChange={(e) => setProjectIdea(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFindTools()}
                    disabled={isFindingTools}
                    className="text-base md:text-lg p-4 md:p-6 flex-1 min-w-0"
                  />
                  <Button 
                    size="lg" 
                    onClick={handleFindTools} 
                    disabled={isFindingTools}
                    className="w-full md:w-auto"
                  >
                    {isFindingTools ? (
                        <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                    ) : (
                        <Search className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    )}
                    Find Tools
                  </Button>
              </div>
              
              {isFindingTools && (
                <div className="text-center p-8 md:p-12">
                    <Loader2 className="h-8 w-8 md:h-12 md:w-12 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground text-sm md:text-base">Analyzing your idea and finding the best resources...</p>
                </div>
              )}

              {toolSuggestion && <ToolDisplay suggestion={toolSuggestion} />}

            </CardContent>
          </Card>
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center text-xl md:text-2xl"><Target className="mr-3 h-5 w-5 md:h-6 md:w-6 flex-shrink-0" /> Research Roadmap Generator</CardTitle>
              <CardDescription className="text-sm md:text-base">Create a personalized learning path for any research topic.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 grid gap-2">
                    <Label className="text-sm md:text-base">Research Topic</Label>
                    <Input
                      placeholder="e.g., Machine Learning, Quantum Computing..."
                      value={roadmapData.topic}
                      onChange={(e) => setRoadmapData(prev => ({ ...prev, topic: e.target.value }))}
                      className="text-base md:text-lg p-3 md:p-4"
                    />
                  </div>
                  <div className="flex-1 grid gap-2">
                    <Label className="text-sm md:text-base">Skill Level</Label>
                    <ToggleGroup
                      type="single"
                      value={skillLevel}
                      onValueChange={(value) => {
                        if (value) setSkillLevel(value)
                      }}
                      className="grid grid-cols-3 gap-2"
                    >
                      <ToggleGroupItem value="Beginner" aria-label="Select Beginner" className="text-xs md:text-sm">
                        Beginner
                      </ToggleGroupItem>
                      <ToggleGroupItem value="Intermediate" aria-label="Select Intermediate" className="text-xs md:text-sm">
                        Intermediate
                      </ToggleGroupItem>
                      <ToggleGroupItem value="Advanced" aria-label="Select Advanced" className="text-xs md:text-sm">
                        Advanced
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateRoadmap}
                  disabled={isGeneratingRoadmap || !roadmapData.topic.trim()}
                  className="mt-2 w-full md:w-auto"
                >
                  {isGeneratingRoadmap ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Roadmap"
                  )}
                </Button>
              </div>
              {roadmap && <RoadmapDisplay roadmap={roadmap} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
