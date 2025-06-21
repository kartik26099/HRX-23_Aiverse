"use client"

import { useState, useRef, useEffect, Fragment } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Bot,
  User,
  Send,
  Calendar,
  Target,
  Clock,
  Bookmark,
  TrendingUp,
  Globe,
  Loader2,
  BrainCircuit,
  Lightbulb,
  FileText,
  Link as LinkIcon,
  ChevronsRight,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// --- Constants ---
const API_BASE_URL = "http://localhost:5005"

// --- Type Definitions ---
// Note: This matches the `research_supporter.py` output
interface ChatResponse {
  answer: string
  key_takeaways?: string[]
  follow_up_questions?: string[]
  references?: { title: string; url: string }[]
}

interface Message {
  id: string
  sender: "user" | "ai"
  content: string // For user messages
  response?: ChatResponse // For AI messages
  timestamp: Date
}

// Note: This matches the `roadmap_generator.py` output
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
  if (!roadmap) return null

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Target /> {roadmap.title}
        </CardTitle>
        <CardDescription>{roadmap.description}</CardDescription>
        <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Timeline: {roadmap.timeline}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {roadmap.modules.map((module, moduleIndex) => (
          <div key={moduleIndex}>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              <ChevronsRight className="mr-2 h-5 w-5" /> {module.title}
            </h3>
            <p className="text-muted-foreground mb-4 pl-7">{module.description}</p>
            <Accordion type="multiple" className="w-full pl-7">
              {module.tasks.map((task, taskIndex) => (
                <AccordionItem key={taskIndex} value={`item-${moduleIndex}-${taskIndex}`}>
                  <AccordionTrigger>
                    <div className="flex justify-between items-center w-full pr-4">
                      <span className="text-left font-semibold">
                        Task {moduleIndex + 1}.{taskIndex + 1}: {task.title}
                      </span>
                      <Badge variant="outline">{task.type}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-muted-foreground">{task.description}</p>
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-blue-500" />
                        Suggested Articles
                      </h4>
                      {task.resources && task.resources.length > 0 ? (
                        <div className="space-y-2 text-sm">
                          {task.resources.map((res, resIndex) => (
                            <a
                              key={resIndex}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted-foreground/10 transition-colors"
                            >
                              <LinkIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="font-medium text-primary underline-offset-4 hover:underline">
                                {res.title}
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground pl-2 py-2">
                          No scholarly articles were found for this task. This may be due to the topic's specificity or a system configuration issue.
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// --- Main Component ---
export default function ResearchHelperPage() {
  const { toast } = useToast()

  // --- State Management ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "ai",
      content: "", // No content for AI message wrapper
      response: {
        answer: "Hello! I'm your AI Research Assistant. I can help you find papers, clarify concepts, and brainstorm ideas. What's on your mind?",
      },
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const [roadmapData, setRoadmapData] = useState({
    topic: "Quantum Computing",
    timeline: "3-6 Months",
    detail_level: "Intermediate",
    user_expertise: "I have a basic understanding of classical computer science and linear algebra.",
  })
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false)

  // --- Effects ---
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // --- API Handlers ---
  const handleSendMessage = async () => {
    const messageContent = inputMessage.trim()
    if (!messageContent) return

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: messageContent,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    try {
      const history = messages
        .map((m) => {
          if (m.sender === "user") {
            return `User: ${m.content}`
          }
          return `Assistant: ${m.response?.answer || ""}`
        })
        .slice(-6) // Send last 6 turns as history

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: messageContent, history }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to get a response from the assistant.")
      }

      const data: ChatResponse = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        content: "", // AI message is a wrapper for the response object
        response: data,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Chat error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
      // Add a message to the chat indicating failure
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        sender: "ai",
        content: "",
        response: { answer: "I'm sorry, I couldn't get a response. Please check the server connection and try again." },
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleGenerateRoadmap = async () => {
    if (!roadmapData.topic.trim()) {
      toast({ title: "Topic is required", description: "Please enter a research topic.", variant: "destructive" })
      return
    }

    setIsGeneratingRoadmap(true)
    setRoadmap(null)
    toast({ title: "Generating Roadmap...", description: "Your personalized research plan is being created."})


    try {
      const response = await fetch(`${API_BASE_URL}/generate-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roadmapData),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to generate roadmap.")
      }

      const data: Roadmap = await response.json()
      if (data.error) { // Handle errors returned in the JSON body
        throw new Error(data.error)
      }

      setRoadmap(data)
      toast({ title: "Success", description: "Your research roadmap has been generated." })
    } catch (error) {
      console.error("Roadmap generation error:", error)
      setRoadmap(null); // Clear any previous roadmap
      toast({
        title: "Roadmap Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred. Please ensure the backend server is running and API keys are set.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingRoadmap(false)
    }
  }

  // --- Render ---
  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AI Research Helper</h1>
        <p className="text-muted-foreground">
          Your integrated environment for literature discovery, planning, and staying current.
        </p>
      </div>

      <Tabs defaultValue="chatbot" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chatbot">Research Chatbot</TabsTrigger>
          <TabsTrigger value="roadmap">Research Roadmap</TabsTrigger>
        </TabsList>

        {/* Chatbot Tab */}
        <TabsContent value="chatbot">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><BrainCircuit className="mr-2" /> AI Research Assistant</CardTitle>
              <CardDescription>Ask questions, get summaries, and brainstorm ideas.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-[600px]">
              <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
                <div className="space-y-6">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === "user" ? "justify-end" : ""}`}>
                      {msg.sender === "ai" && (
                        <Avatar className="w-9 h-9">
                          <AvatarFallback><Bot /></AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-xl rounded-lg px-4 py-3 ${
                          msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {msg.sender === "user" ? (
                          <p>{msg.content}</p>
                        ) : (
                          <div className="space-y-4">
                            <p className="whitespace-pre-wrap">{msg.response?.answer}</p>
                            {msg.response?.key_takeaways && msg.response.key_takeaways.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center"><Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />Key Takeaways</h4>
                                <ul className="space-y-1 list-disc list-inside text-sm">
                                  {msg.response.key_takeaways.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                              </div>
                            )}
                            {msg.response?.references && msg.response.references.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2 flex items-center"><FileText className="mr-2 h-4 w-4 text-blue-500" />References</h4>
                                <div className="space-y-2 text-sm">
                                  {msg.response.references.map((ref, i) => (
                                    <a
                                      key={i}
                                      href={ref.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted-foreground/10"
                                    >
                                      <LinkIcon className="h-4 w-4 flex-shrink-0" />
                                      <span className="font-medium text-primary underline-offset-4 hover:underline">{ref.title}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {msg.sender === "user" && (
                         <Avatar className="w-9 h-9">
                          <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-start gap-4">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback><Bot /></AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg px-4 py-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask a follow-up question..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isTyping) {
                        handleSendMessage();
                      }
                    }}
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isTyping || !inputMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Target className="mr-2" /> Research Roadmap Generator</CardTitle>
              <CardDescription>
                Enter a topic to generate a structured, step-by-step research plan from foundational concepts to advanced execution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Research Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., 'Quantum Machine Learning for Drug Discovery'"
                    value={roadmapData.topic}
                    onChange={(e) => setRoadmapData({ ...roadmapData, topic: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeline">Timeline</Label>
                    <Select
                      value={roadmapData.timeline}
                      onValueChange={(value) => setRoadmapData({ ...roadmapData, timeline: value })}
                    >
                      <SelectTrigger id="timeline">
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2 Weeks">1-2 Weeks</SelectItem>
                        <SelectItem value="1 Month">1 Month</SelectItem>
                        <SelectItem value="3-6 Months">3-6 Months</SelectItem>
                        <SelectItem value="1 Year">1 Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail-level">Level of Detail</Label>
                    <Select
                      value={roadmapData.detail_level}
                      onValueChange={(value) => setRoadmapData({ ...roadmapData, detail_level: value })}
                    >
                      <SelectTrigger id="detail-level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expertise">Your Current Expertise</Label>
                    <Input
                      id="expertise"
                      placeholder="e.g., 'I am a software developer with no quantum physics background.'"
                      value={roadmapData.user_expertise}
                      onChange={(e) => setRoadmapData({ ...roadmapData, user_expertise: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Button onClick={handleGenerateRoadmap} disabled={isGeneratingRoadmap} className="w-full md:w-auto">
                    {isGeneratingRoadmap && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isGeneratingRoadmap ? "Generating..." : "Generate Roadmap"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {isGeneratingRoadmap && (
            <div className="text-center p-8 flex items-center justify-center">
              <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
              <span className="text-lg text-muted-foreground">Generating your personalized roadmap...</span>
            </div>
          )}
          {!isGeneratingRoadmap && !roadmap && (
            <Card className="mt-6 text-center p-8 flex flex-col items-center justify-center h-64">
               <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">Your Roadmap Will Appear Here</h3>
              <p className="text-sm text-muted-foreground">Click "Generate Roadmap" to get started.</p>
            </Card>
          )}
          <RoadmapDisplay roadmap={roadmap} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
