"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, MessageCircle, Brain, CheckCircle, X, Loader2, Send, Bot, User, BookOpen, Target, TrendingUp, AlertCircle, Trophy, Lightbulb, MessageSquare, HardDrive } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

// API Base URL
const API_BASE_URL = "http://localhost:4002"

// Types
interface Document {
  id: number
  title: string
  chunk_count?: number
  uploaded_at?: string
}

interface QuizQuestion {
  question: string
  options: string[]
  correct_index: number
  topic: string
}

interface QuizResult {
  score: number
  total: number
  percentage: number
  topic_analysis: Record<string, any>
  detailed_results: any[]
  overall_insights: any
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  sources?: Array<{document_title: string, document_id: string}>
}

export default function AIFacultyPage() {
  const { toast } = useToast()
  
  // State management
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([])
  const [quiz, setQuiz] = useState<QuizQuestion[]>([])
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for scrolling
  const chatEndRef = useRef<HTMLDivElement>(null)
  const resultsEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll effects with error handling
  useEffect(() => {
    try {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" })
      }
    } catch (err) {
      console.warn("Error scrolling chat:", err)
    }
  }, [chatMessages])

  useEffect(() => {
    try {
      if (resultsEndRef.current) {
        resultsEndRef.current.scrollIntoView({ behavior: "smooth" })
      }
    } catch (err) {
      console.warn("Error scrolling results:", err)
    }
  }, [quizResults])

  // Error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error)
      setError("An unexpected error occurred. Please refresh the page.")
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Load available documents on component mount
  useEffect(() => {
    loadAvailableDocuments()
  }, [])

  const loadAvailableDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/detailed`)
      if (response.ok) {
        const documents = await response.json()
        setAvailableDocuments(documents)
      }
    } catch (error) {
      console.error("Failed to load documents:", error)
    }
  }

  // File upload handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      processDocument(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setUploadedFile(files[0])
      processDocument(files[0])
    }
  }

  const processDocument = async (file: File) => {
    setIsProcessing(true)
    setQuiz([])
    setQuizResults(null)
    setShowResults(false)
    setChatMessages([])
    setUserAnswers({})

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name)

      const response = await fetch(`${API_BASE_URL}/upload-document`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload document')
      }

      const data = await response.json()
      setCurrentDocument({
        id: data.document_id,
        title: data.title
      })

      // Refresh available documents after upload
      await loadAvailableDocuments()

      toast({
        title: "Document Uploaded",
        description: "Your document has been processed successfully!",
      })

      // Auto-generate quiz
      await generateQuiz(data.document_id)

    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const generateQuiz = async (docId: number) => {
    setIsGeneratingQuiz(true)
    try {
      const response = await fetch(`${API_BASE_URL}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_id: docId }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      const data = await response.json()
      setQuiz(data.quiz)
      setUserAnswers({})

      toast({
        title: "Quiz Generated",
        description: `Generated ${data.quiz.length} questions for you!`,
      })

    } catch (error) {
      toast({
        title: "Quiz Generation Failed",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  const handleQuizSubmit = async () => {
    console.log('Starting quiz evaluation...')
    console.log('Quiz data:', quiz)
    console.log('User answers:', userAnswers)
    
    if (quiz.length === 0) {
      console.log('No quiz to evaluate')
      return
    }

    setIsEvaluating(true)
    console.log('Set evaluating state to true')

    try {
      console.log('Making API call to evaluate quiz...')
      const response = await fetch(`${API_BASE_URL}/evaluate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz: quiz,
          answers: userAnswers,
          doc_id: currentDocument?.id
        }),
      })

      console.log('API response status:', response.status)
      console.log('API response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('API error response:', errorText)
        throw new Error(`Failed to evaluate quiz: ${response.status} ${errorText}`)
      }

      const results = await response.json()
      console.log('Quiz evaluation results:', results)
      
      setQuizResults(results)
      setShowResults(true)
      console.log('Set quiz results and show results')

      toast({
        title: "Quiz Submitted!",
        description: `You scored ${results.score}/${results.total} (${results.percentage.toFixed(1)}%)`,
      })

    } catch (error) {
      console.error('Quiz evaluation error:', error)
      toast({
        title: "Evaluation Failed",
        description: `Failed to evaluate quiz: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsEvaluating(false)
      console.log('Set evaluating state to false - finished evaluation')
    }
  }

  const handleChatSubmit = async (e?: React.FormEvent) => {
    // Prevent form submission from reloading the page
    if (e) {
      e.preventDefault()
    }
    
    if (!chatInput.trim()) return

    // Store the message before clearing the input
    const messageToSend = chatInput.trim()
    
    console.log("Sending chat message:", messageToSend)
    
    const userMessage: ChatMessage = { role: "user", content: messageToSend }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput("")
    setIsChatLoading(true)

    try {
      console.log("Making API request to:", `${API_BASE_URL}/chat`)
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          conversation_history: chatMessages
        }),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error:", errorText)
        throw new Error(`Failed to get response: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      console.log("API Response:", data)
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.response,
        sources: data.sources || []
      }
      setChatMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error("Chat error:", error)
      toast({
        title: "Chat Error",
        description: error instanceof Error ? error.message : "Failed to get response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChatLoading(false)
    }
  }

  const resetQuiz = () => {
    setUserAnswers({})
    setShowResults(false)
    setQuizResults(null)
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-emerald-600"
    if (percentage >= 80) return "text-blue-600"
    if (percentage >= 70) return "text-yellow-600"
    if (percentage >= 60) return "text-orange-600"
    return "text-red-600"
  }

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 90) return <Trophy className="h-5 w-5 text-emerald-600" />
    if (percentage >= 80) return <TrendingUp className="h-5 w-5 text-blue-600" />
    if (percentage >= 70) return <CheckCircle className="h-5 w-5 text-yellow-600" />
    if (percentage >= 60) return <AlertCircle className="h-5 w-5 text-orange-600" />
    return <AlertCircle className="h-5 w-5 text-red-600" />
  }

  return (
    <div className="container py-8 max-w-7xl">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="ml-auto"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          EduMentor
        </h1>
        <p className="text-muted-foreground">
          Upload documents and get AI-generated quizzes, detailed reports, and interactive Q&A sessions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent>
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">Drag and drop your file here, or click to browse</p>
                <p className="text-xs text-muted-foreground">Supports PDF, DOCX, TXT (Max 15MB)</p>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {uploadedFile && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div 
                          className="text-sm font-medium break-words flex-1 overflow-hidden"
                          title={uploadedFile.name}
                        >
                          <div className="truncate">
                            {uploadedFile.name}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUploadedFile(null)
                            setCurrentDocument(null)
                            setQuiz([])
                            setQuizResults(null)
                            setShowResults(false)
                            setChatMessages([])
                            setUserAnswers({})
                            setError(null)
                          }}
                          className="flex-shrink-0 ml-2"
                          title="Remove document"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="mt-4 text-center">
                  <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Processing document...</p>
                </div>
              )}

              {currentDocument && !isProcessing && (
                <div className="mt-4">
                  <Button
                    onClick={() => generateQuiz(currentDocument.id)}
                    disabled={isGeneratingQuiz}
                    className="w-full"
                  >
                    {isGeneratingQuiz ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Quiz...
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Generate New Quiz
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {!currentDocument && !isProcessing && (
            <Card className="h-96 flex items-center justify-center bg-card border-2 border-dashed border-border">
              <CardContent className="text-center">
                <Brain className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-3">Ready to Generate Learning Materials</h3>
                <p className="text-muted-foreground text-lg">
                  Upload a document to get started with AI-generated assessments and detailed analysis
                </p>
              </CardContent>
            </Card>
          )}

          {currentDocument && (
            <Tabs defaultValue="quiz" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-xl">
                <TabsTrigger value="quiz" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg font-semibold">Assessment</TabsTrigger>
                <TabsTrigger value="results" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg font-semibold">Results</TabsTrigger>
                <TabsTrigger value="chat" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg font-semibold">AI Assistant</TabsTrigger>
              </TabsList>

              <TabsContent value="quiz" className="space-y-4">
                {quiz.length > 0 ? (
                  <Card className="border-0 shadow-xl">
                   
                    <CardContent className="p-8">
                      <ScrollArea className="h-[60vh] pr-4">
                        {quiz.map((question, index) => (
                          <div key={index} className="mb-10 p-8 bg-card rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all duration-300">
                            <div className="flex items-start gap-4 mb-6">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-lg font-bold shadow-lg">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <Badge variant="outline" className="text-xs font-semibold px-3 py-1">
                                    {question.topic}
                                  </Badge>
                                </div>
                                <h3 className="font-semibold text-xl text-foreground leading-relaxed">
                                  {question.question}
                                </h3>
                              </div>
                            </div>
                            <RadioGroup
                              value={userAnswers[index]?.toString() || ""}
                              onValueChange={(value) => 
                                setUserAnswers(prev => ({ ...prev, [index]: parseInt(value) }))
                              }
                              className="space-y-4"
                            >
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-4">
                                  <RadioGroupItem 
                                    value={optionIndex.toString()} 
                                    id={`q${index}-${optionIndex}`}
                                    className="text-primary border-2 border-border hover:border-primary focus:ring-primary"
                                  />
                                  <Label 
                                    htmlFor={`q${index}-${optionIndex}`} 
                                    className="flex-1 cursor-pointer p-5 rounded-xl border-2 border-border hover:border-primary hover:bg-accent transition-all duration-200 bg-card group"
                                  >
                                    <div className="flex items-center">
                                      <span className="w-10 h-10 rounded-lg border-2 border-border flex items-center justify-center mr-4 text-sm font-bold text-muted-foreground bg-muted group-hover:border-primary group-hover:bg-accent transition-colors">
                                        {String.fromCharCode(65 + optionIndex)}
                                      </span>
                                      <span className="text-foreground font-medium text-lg">{option}</span>
                                    </div>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        ))}
                      </ScrollArea>
                      
                      <div className="flex justify-between items-center pt-8 border-t border-border bg-card rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-6">
                          <div className="text-sm text-muted-foreground">
                            <span className="font-bold text-foreground text-lg">{Object.keys(userAnswers).length}</span> of <span className="font-bold text-lg">{quiz.length}</span> questions answered
                          </div>
                          <div className="w-40">
                            <Progress 
                              value={(Object.keys(userAnswers).length / quiz.length) * 100} 
                              className="h-3 bg-muted"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(userAnswers).length < quiz.length || isEvaluating}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                        >
                          {isEvaluating ? (
                            <>
                              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                              Evaluating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-3 h-5 w-5" />
                              Submit Assessment
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-64 flex items-center justify-center border-2 border-dashed border-border">
                    <CardContent className="text-center">
                      <BookOpen className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        {isGeneratingQuiz ? "Crafting Your Assessment..." : "Assessment Ready"}
                      </h3>
                      <p className="text-muted-foreground text-lg">
                        {isGeneratingQuiz ? "Please wait while we create thoughtful questions for you" : "Your assessment will appear here after document processing"}
                      </p>
                      {isGeneratingQuiz && (
                        <div className="mt-6">
                          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="results" className="space-y-4">
                {quizResults ? (
                  <Card className="border-0 shadow-xl">
                    <CardContent className="p-8">
                      <ScrollArea className="h-[70vh] pr-4">
                        {/* Overall Performance - Dark Mode Compatible */}
                        <div className="mb-10 p-8 bg-card rounded-2xl border border-border shadow-sm">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-6">
                              <div className={`p-4 rounded-2xl bg-accent/50 border-2 border-accent`}>
                                {getPerformanceIcon(quizResults.percentage)}
                              </div>
                              <div>
                                <h3 className="text-3xl font-bold text-foreground mb-2">{quizResults.overall_insights.performance_level}</h3>
                                <p className="text-muted-foreground text-lg">{quizResults.overall_insights.message}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-5xl font-bold ${getPerformanceColor(quizResults.percentage)} mb-2`}>
                                {quizResults.percentage.toFixed(1)}%
                              </div>
                              <div className="text-lg text-muted-foreground font-medium">
                                {quizResults.score} of {quizResults.total} correct
                              </div>
                            </div>
                          </div>
                          <div className="relative">
                            <Progress 
                              value={quizResults.percentage} 
                              className="h-4 bg-muted rounded-full" 
                            />
                            <div className="flex justify-between text-sm text-muted-foreground mt-3 font-medium">
                              <span>0%</span>
                              <span>25%</span>
                              <span>50%</span>
                              <span>75%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>

                        {/* Topic Analysis - Dark Mode Compatible */}
                        <div className="mb-10">
                          <h3 className="text-2xl font-bold mb-8 flex items-center gap-4 text-foreground">
                            <div className="p-3 bg-accent rounded-xl">
                              <Target className="h-6 w-6 text-accent-foreground" />
                            </div>
                            Topic Performance Analysis
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {Object.entries(quizResults.topic_analysis).map(([topic, data]: [string, any]) => {
                              const accuracy = data.accuracy * 100;
                              const getTopicColor = (acc: number) => {
                                if (acc >= 80) return 'border-green-500/30 bg-green-500/10';
                                if (acc >= 60) return 'border-yellow-500/30 bg-yellow-500/10';
                                return 'border-red-500/30 bg-red-500/10';
                              };
                              const getTopicTextColor = (acc: number) => {
                                if (acc >= 80) return 'text-green-600 dark:text-green-400';
                                if (acc >= 60) return 'text-yellow-600 dark:text-yellow-400';
                                return 'text-red-600 dark:text-red-400';
                              };
                              
                              return (
                                <Card key={topic} className={`p-6 bg-card border-2 shadow-sm hover:shadow-lg transition-all duration-300 ${getTopicColor(accuracy)}`}>
                                  <div className="flex items-center justify-between mb-6">
                                    <h4 className="font-bold text-foreground text-xl">{topic}</h4>
                                    <Badge 
                                      variant={data.status === 'strong' ? 'default' : data.status === 'satisfactory' ? 'secondary' : 'destructive'}
                                      className="text-sm font-semibold px-4 py-2 rounded-lg"
                                    >
                                      {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                                    </Badge>
                                  </div>
                                  <div className="text-lg text-muted-foreground mb-4 font-medium">
                                    {data.correct} of {data.total} questions correct
                                  </div>
                                  <div className="mb-4">
                                    <div className="flex justify-between text-lg font-medium mb-2">
                                      <span className={getTopicTextColor(accuracy)}>Accuracy</span>
                                      <span className={getTopicTextColor(accuracy)}>{Math.round(accuracy)}%</span>
                                    </div>
                                    <Progress 
                                      value={accuracy} 
                                      className={`h-3 rounded-full ${accuracy >= 80 ? 'bg-green-200 dark:bg-green-800' : accuracy >= 60 ? 'bg-yellow-200 dark:bg-yellow-800' : 'bg-red-200 dark:bg-red-800'}`}
                                    />
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>

                        {/* Detailed Results - Dark Mode Compatible */}
                        <div className="mb-10">
                          <h3 className="text-2xl font-bold mb-8 flex items-center gap-4 text-foreground">
                            <div className="p-3 bg-accent rounded-xl">
                              <Lightbulb className="h-6 w-6 text-accent-foreground" />
                            </div>
                            Question-by-Question Analysis
                          </h3>
                          <div className="space-y-8">
                            {quizResults.detailed_results.map((result, index) => (
                              <Card key={index} className="p-8 bg-card border-2 border-border shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
                                <div className="flex items-start gap-6 mb-6">
                                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg ${
                                    result.is_correct 
                                      ? 'bg-gradient-to-br from-green-500 to-green-600' 
                                      : 'bg-gradient-to-br from-red-500 to-red-600'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-foreground mb-4 text-xl leading-relaxed">{result.question}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="p-4 rounded-xl border-2 bg-muted">
                                        <div className="text-sm font-medium text-muted-foreground mb-2">Your Answer:</div>
                                        <div className={`font-semibold text-lg ${result.is_correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                          {result.user_answer}
                                        </div>
                                      </div>
                                      <div className="p-4 rounded-xl border-2 bg-green-500/10 border-green-500/30">
                                        <div className="text-sm font-medium text-muted-foreground mb-2">Correct Answer:</div>
                                        <div className="font-semibold text-green-600 dark:text-green-400 text-lg">
                                          {result.correct_answer}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-accent/50 p-6 rounded-xl border border-accent">
                                  <h5 className="font-semibold text-foreground mb-3 flex items-center gap-3 text-lg">
                                    <MessageSquare className="h-5 w-5 text-accent-foreground" />
                                    Detailed Explanation
                                  </h5>
                                  <div className="text-muted-foreground leading-relaxed text-lg prose prose-sm max-w-none dark:prose-invert">
                                    {result.explanation.split('\n').map((line: string, index: number) => {
                                      if (line.startsWith('✅') || line.startsWith('❌')) {
                                        // Status line
                                        return (
                                          <h3 key={index} className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0">
                                            {line}
                                          </h3>
                                        )
                                      } else if (line.startsWith('Summary:') || line.startsWith('Detailed Explanation:') || line.startsWith('Key Points:') || line.startsWith('Learning Tip:')) {
                                        // Section headers
                                        return (
                                          <p key={index} className="font-semibold text-foreground mb-2 mt-4">
                                            {line}
                                          </p>
                                        )
                                      } else if (line.startsWith('• ')) {
                                        // Bullet points
                                        return (
                                          <li key={index} className="ml-4 mb-1">
                                            {line.replace('• ', '')}
                                          </li>
                                        )
                                      } else if (line.trim() === '') {
                                        // Empty line
                                        return <br key={index} />
                                      } else {
                                        // Regular paragraph
                                        return (
                                          <p key={index} className="mb-3">
                                            {line}
                                          </p>
                                        )
                                      }
                                    })}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>

                        {/* Recommendations - Dark Mode Compatible */}
                        {quizResults.overall_insights.recommendations.length > 0 && (
                          <div className="mb-10">
                            <h3 className="text-2xl font-bold mb-8 flex items-center gap-4 text-foreground">
                              <div className="p-3 bg-accent rounded-xl">
                                <Lightbulb className="h-6 w-6 text-accent-foreground" />
                              </div>
                              Personalized Recommendations
                            </h3>
                            <div className="space-y-6">
                              {quizResults.overall_insights.recommendations.map((rec: string, index: number) => (
                                <div key={index} className="flex items-start gap-6 p-6 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300">
                                  <div className="p-3 bg-accent rounded-xl flex-shrink-0">
                                    <Lightbulb className="h-5 w-5 text-accent-foreground" />
                                  </div>
                                  <p className="text-foreground font-medium text-lg">{rec}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div ref={resultsEndRef} />
                      </ScrollArea>

                      <div className="flex justify-center pt-8 border-t border-border">
                        <Button onClick={resetQuiz} variant="outline" className="px-10 py-4 text-lg font-semibold border-2 hover:bg-accent transition-all duration-300 rounded-xl">
                          <BookOpen className="mr-3 h-5 w-5" />
                          Take Assessment Again
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-64 flex items-center justify-center border-2 border-dashed border-border">
                    <CardContent className="text-center">
                      <TrendingUp className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-foreground mb-3">No Results Yet</h3>
                      <p className="text-muted-foreground text-lg">Complete an assessment to see your detailed performance analysis</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="chat" className="space-y-4">
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-6">
                    {/* Document Context */}
                      
                    
                    {availableDocuments.length === 0 && (
                      <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">No Documents Available</span>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Upload a document first to start chatting with the AI assistant about its content.
                        </p>
                      </div>
                    )}
                    
                    <div className="flex flex-col h-[70vh]">
                      <ScrollArea className="flex-1 pr-4 mb-4">
                        <div className="space-y-4">
                          {chatMessages.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p className="text-lg font-medium">Start a conversation</p>
                              <p className="text-sm">Ask questions about your uploaded documents</p>
                            </div>
                          )}
                          
                          {chatMessages.map((message, index) => (
                            <div
                              key={index}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] p-4 rounded-2xl ${
                                  message.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-foreground border border-border'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  {message.role === 'assistant' && (
                                    <div className="p-2 bg-accent rounded-lg flex-shrink-0">
                                      <Bot className="h-4 w-4 text-accent-foreground" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="font-semibold text-sm mb-2">
                                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                                    </div>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                      {message.content}
                                    </div>
                                    {message.sources && message.sources.length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-border/50">
                                        <div className="text-xs text-muted-foreground mb-1">Sources:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {message.sources.map((source, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs max-w-full">
                                              <span className="truncate block max-w-24" title={source.document_title}>
                                                {source.document_title}
                                              </span>
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {message.role === 'user' && (
                                    <div className="p-2 bg-primary-foreground/10 rounded-lg flex-shrink-0">
                                      <User className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {isChatLoading && (
                            <div className="flex justify-start">
                              <div className="max-w-[80%] p-4 rounded-2xl bg-muted text-foreground border border-border">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-accent rounded-lg">
                                    <Bot className="h-4 w-4 text-accent-foreground" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-semibold">AI Assistant</div>
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div ref={chatEndRef} />
                      </ScrollArea>
                      
                      <div className="border-t border-border pt-4">
                        <form onSubmit={handleChatSubmit} className="flex gap-3">
                          <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleChatSubmit()
                              }
                            }}
                            placeholder={availableDocuments.length > 0 ? "Ask a question about your document..." : "Upload a document first to start chatting..."}
                            className="flex-1 bg-background border-border focus:border-primary"
                            disabled={isChatLoading || availableDocuments.length === 0}
                          />
                          <Button
                            type="submit"
                            disabled={!chatInput.trim() || isChatLoading || availableDocuments.length === 0}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                          >
                            {isChatLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}