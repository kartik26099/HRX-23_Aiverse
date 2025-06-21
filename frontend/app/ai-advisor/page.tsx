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
import { useToast } from "@/hooks/use-toast"
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
} from "lucide-react"

// --- Constants ---
const API_BASE_URL = "http://localhost:5000/api"

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
  const { toast } = useToast()

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
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Quiz State
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)

  // --- Effects ---
  useEffect(() => {
    if (view === "chat" && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, isTyping, view])

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
      toast({
        title: "Error",
        description: "Could not connect to the AI Advisor. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleGenerateQuiz = async () => {
    setIsTyping(true)
    toast({ title: "Generating Quiz...", description: "Your quiz is being created based on our conversation." })

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
      toast({
        title: "Quiz Generation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
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
    toast({
      title: "Quiz Submitted!",
      description: `You scored ${correctAnswers} out of ${quiz?.questions.length}!`,
    })
  }
  
  const resetQuiz = () => {
    setUserAnswers({})
    setShowResults(false)
    setScore(0)
  }

  // --- Render Methods ---
  const renderChatView = () => (
    <Card className="h-[70vh] flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <MessageSquareQuote /> AI Learning Advisor
          </CardTitle>
          <Button onClick={handleGenerateQuiz} disabled={isTyping || messages.length <= 1}>
            <BookCheck className="mr-2 h-4 w-4" /> Start Quiz
          </Button>
        </div>
        <CardDescription>
          Ask questions about a topic, and then start a quiz when you're ready to test your knowledge.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && <Avatar><AvatarFallback><Bot /></AvatarFallback></Avatar>}
                <div className={`max-w-lg rounded-lg px-4 py-2 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && <Avatar><AvatarFallback><User /></AvatarFallback></Avatar>}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-3"><Avatar><AvatarFallback><Bot /></AvatarFallback></Avatar>
                <div className="bg-muted rounded-lg px-4 py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isTyping}
            />
            <Button onClick={handleSendMessage} disabled={isTyping || !inputMessage.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderQuizView = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={() => setView("chat")}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Chat</Button>
          <CardTitle>Test Your Knowledge</CardTitle>
          <Button variant="outline" size="sm" onClick={resetQuiz}><RefreshCcw className="mr-2 h-4 w-4" /> Retake Quiz</Button>
        </div>
        {showResults && (
          <CardDescription className="text-center pt-4 text-lg font-semibold">
            Your Score: {score} / {quiz?.questions.length}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {quiz?.questions.map((q, qIndex) => (
          <div key={qIndex} className={`p-4 rounded-lg border ${
              showResults ? (userAnswers[qIndex] === q.answer ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10") : ""
            }`}
          >
            <p className="font-semibold mb-4">{qIndex + 1}. {q.question}</p>
            <RadioGroup
              value={userAnswers[qIndex]}
              onValueChange={(value) => setUserAnswers((prev) => ({ ...prev, [qIndex]: value }))}
              disabled={showResults}
            >
              {q.options.map((option, oIndex) => (
                <div key={oIndex} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`q${qIndex}o${oIndex}`} />
                  <Label htmlFor={`q${qIndex}o${oIndex}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {showResults && (
              <div className="mt-4 pt-4 border-t text-sm">
                <p className="font-bold">Correct Answer: <span className="text-green-600">{q.answer}</span></p>
                <p><span className="font-semibold">Explanation:</span> {q.explanation}</p>
              </div>
            )}
          </div>
        ))}
        {!showResults && (
          <Button onClick={handleSubmitQuiz} className="w-full">Submit Quiz</Button>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight">AI Advisor</h1>
      </div>
      {view === "chat" ? renderChatView() : renderQuizView()}
    </div>
  )
}
