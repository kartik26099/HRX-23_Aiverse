"use client"

import { useState, useRef, useEffect, Fragment } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import useToast from "@/hooks/use-toast"
import {
  Send,
  Bot,
  User,
  Loader2,
  FileText,
  MessageSquareQuote,
  RefreshCcw,
  BookCheck,
  ArrowLeft,
  Sparkles,
  Brain,
  Target,
  Zap,
  CheckCircle,
  Clock,
} from "lucide-react"

// --- Constants ---
const API_BASE_URL = "http://localhost:4010/api"

// --- Type Definitions ---
interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface Question {
  question: string
  options: string[]
  answer: string
  explanation: string
}

interface Quiz {
  questions: Question[]
}

// --- Main Component ---
export default function AIAdvisorPage() {
  const toast = useToast

  // --- State Management ---
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [view, setView] = useState<"chat" | "quiz">("chat")

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI Learning Advisor. Ask me anything about a topic, or upload a document, and I can generate a quiz to test your knowledge.",
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Quiz State
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  // --- Effects ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // --- API Handlers ---
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return
    const messageContent = inputMessage
    setInputMessage("")

    const userMessage: Message = { role: "user", content: messageContent }
    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      const response = await fetch(`${API_BASE_URL}/advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageContent,
          history: messages,
          session_id: sessionId,
        }),
      })

      if (!response.ok) throw new Error("Failed to get a response from the advisor.")

      const data = await response.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }])
      if (data.session_id) setSessionId(data.session_id)
    } catch (error) {
      toast.error("Could not connect to the AI Advisor. Please try again later.")
    } finally {
      setIsTyping(false)
    }
  }

  const handleGenerateQuiz = async () => {
    setIsTyping(true)
    toast.info("Generating Quiz... Your quiz is being created based on our conversation.")

    try {
      const response = await fetch(`${API_BASE_URL}/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: messages,
          topic: "the current conversation",
        }),
      })

      if (!response.ok) throw new Error("The quiz generator failed.")
      const quizData: Quiz = await response.json()
      if (quizData.questions && quizData.questions.length > 0) {
        setQuiz(quizData)
        setUserAnswers({})
        setShowResults(false)
        setScore(0)
        setView("quiz")
      } else {
        throw new Error("Received an empty or invalid quiz from the server.")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmitQuiz = () => {
    let correctAnswers = 0
    quiz?.questions.forEach((q, index) => {
      if (userAnswers[index] === q.answer) {
        correctAnswers++
      }
    })
    setScore(correctAnswers)
    setShowResults(true)
    toast.success(`You scored ${correctAnswers} out of ${quiz?.questions.length}!`)
  }
  
  const resetQuiz = () => {
    setUserAnswers({})
    setShowResults(false)
    setScore(0)
  }

  // --- Render Methods ---
  const renderChatView = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Brain className="h-5 w-5 text-slate-600" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            AI Learning Advisor
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Ask questions about any topic, get detailed explanations, and test your knowledge with AI-generated quizzes.
        </p>
      </div>

      {/* Chat Interface */}
      <Card className="h-[70vh] flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 pb-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <MessageSquareQuote className="h-4 w-4 text-slate-600" />
              <span>AI Learning Advisor</span>
            </CardTitle>
            <Button 
              onClick={handleGenerateQuiz} 
              disabled={isTyping || messages.length <= 1}
              className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-800 dark:hover:bg-slate-300 text-xs"
            >
              <BookCheck className="mr-1 h-3 w-3" /> 
              Generate Quiz
            </Button>
          </div>
          <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
            Ask questions about a topic, and then start a quiz when you're ready to test your knowledge.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4 h-full">
            <div className="space-y-4 min-h-full">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-600 flex-shrink-0">
                      <AvatarFallback className="bg-slate-600 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-lg rounded-lg px-4 py-2 ${
                    msg.role === "user" 
                      ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-800" 
                      : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                  </div>
                  
                  {msg.role === "user" && (
                    <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-600 flex-shrink-0">
                      <AvatarFallback className="bg-slate-500 text-white">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-600 flex-shrink-0">
                    <AvatarFallback className="bg-slate-600 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-3 w-3 animate-spin text-slate-600" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Invisible div to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Input Area */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-700 flex-shrink-0">
            <div className="flex space-x-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask me anything about a topic..."
                className="flex-1 border-slate-200 dark:border-slate-600 focus:border-slate-400 dark:focus:border-slate-500 bg-white dark:bg-slate-800"
                disabled={isTyping}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isTyping || !inputMessage.trim()}
                className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-800 dark:hover:bg-slate-300"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderQuizView = () => (
    <div className="space-y-4">
      {/* Quiz Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <BookCheck className="h-5 w-5 text-slate-600" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Knowledge Quiz
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Test your understanding of the topic
        </p>
      </div>

      {quiz && (
        <Card className="h-[70vh] flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700 pb-3 flex-shrink-0">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Target className="h-4 w-4 text-slate-600" />
                <span>Quiz Questions</span>
              </CardTitle>
              <div className="flex items-center space-x-3">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {Object.keys(userAnswers).length} / {quiz.questions.length} answered
                </div>
                <Button 
                  onClick={() => setView("chat")} 
                  variant="outline"
                  size="sm"
                  className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Back to Chat
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              {showResults ? (
                <div className="space-y-4">
                  {/* Results Summary */}
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-slate-800 dark:bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg font-bold text-white dark:text-slate-800">{score}/{quiz.questions.length}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Quiz Complete!
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      You scored {score} out of {quiz.questions.length} questions correctly.
                    </p>
                    <div className="mt-3 space-x-2">
                      <Button 
                        onClick={resetQuiz}
                        className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-800 dark:hover:bg-slate-300 text-xs"
                      >
                        <RefreshCcw className="mr-1 h-3 w-3" />
                        Retake Quiz
                      </Button>
                      <Button 
                        onClick={() => setView("chat")}
                        variant="outline"
                        size="sm"
                        className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        Back to Chat
                      </Button>
                    </div>
                  </div>

                  {/* Question Review */}
                  <div className="space-y-4">
                    {quiz.questions.map((question, index) => (
                      <Card key={index} className="border border-slate-200 dark:border-slate-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-slate-800 dark:text-slate-200">
                            Question {index + 1}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                            {question.question}
                          </p>
                          
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className={`p-2 rounded border transition-colors ${
                                  userAnswers[index] === option
                                    ? option === question.answer
                                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                                      : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                                    : option === question.answer
                                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                                    : "bg-slate-50 border-slate-200 dark:bg-slate-700 dark:border-slate-600"
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  {option === question.answer ? (
                                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                                  ) : userAnswers[index] === option ? (
                                    <div className="h-3 w-3 rounded-full border border-red-500 bg-red-500"></div>
                                  ) : (
                                    <div className="h-3 w-3 rounded-full border border-slate-300 dark:border-slate-600"></div>
                                  )}
                                  <span className={`text-xs font-medium ${
                                    option === question.answer
                                      ? "text-emerald-700 dark:text-emerald-400"
                                      : userAnswers[index] === option
                                      ? "text-red-700 dark:text-red-400"
                                      : "text-slate-700 dark:text-slate-300"
                                  }`}>
                                    {option}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded p-3">
                            <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-1 flex items-center space-x-1 text-xs">
                              <Brain className="h-3 w-3" />
                              <span>Explanation</span>
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {question.explanation}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {quiz.questions.map((question, index) => (
                    <Card key={index} className="border border-slate-200 dark:border-slate-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-800 dark:text-slate-200">
                          Question {index + 1} of {quiz.questions.length}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                          {question.question}
                        </p>
                        
                        <RadioGroup
                          value={userAnswers[index] || ""}
                          onValueChange={(value) => setUserAnswers({ ...userAnswers, [index]: value })}
                          className="space-y-2"
                        >
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <RadioGroupItem value={option} id={`q${index}-${optionIndex}`} />
                              <Label 
                                htmlFor={`q${index}-${optionIndex}`} 
                                className="flex-1 cursor-pointer p-2 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                              >
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <div className="flex justify-center pt-4 pb-4">
                    <Button
                      onClick={handleSubmitQuiz}
                      disabled={Object.keys(userAnswers).length < quiz.questions.length}
                      className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-800 dark:hover:bg-slate-300"
                    >
                      <CheckCircle className="mr-2 h-3 w-3" />
                      Submit Quiz
                    </Button>
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {view === "chat" ? renderChatView() : renderQuizView()}
      </div>
    </div>
  )
}