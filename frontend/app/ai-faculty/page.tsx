"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, MessageCircle, Brain, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Send, Bot } from "lucide-react"

export default function AIFacultyPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [quiz, setQuiz] = useState<any>(null)
  const [summary, setSummary] = useState<string>("")

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      processDocument(file)
    }
  }

  const processDocument = async (file: File) => {
    setIsProcessing(true)

    // Simulate document processing
    setTimeout(() => {
      // Generate mock quiz
      const mockQuiz = {
        title: `Quiz: ${file.name.replace(/\.[^/.]+$/, "")}`,
        questions: [
          {
            id: 1,
            question: "What is the main concept discussed in the document?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correct: 0,
          },
          {
            id: 2,
            question: "Which of the following best describes the key methodology?",
            options: ["Method 1", "Method 2", "Method 3", "Method 4"],
            correct: 1,
          },
          {
            id: 3,
            question: "What are the primary benefits mentioned?",
            options: ["Benefit A", "Benefit B", "Benefit C", "All of the above"],
            correct: 3,
          },
        ],
      }

      const mockSummary =
        "This document covers fundamental concepts and methodologies. Key points include theoretical frameworks, practical applications, and implementation strategies. The content is structured to provide comprehensive understanding of the subject matter with detailed explanations and examples."

      setQuiz(mockQuiz)
      setSummary(mockSummary)
      setIsProcessing(false)
    }, 2000)
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

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AI Faculty</h1>
        <p className="text-muted-foreground">
          Upload documents and get AI-generated quizzes, summaries, and interactive Q&A sessions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Document
              </CardTitle>
              <CardDescription>Upload PDF, DOCX, or TXT files to generate learning materials</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-2">Drag and drop your file here, or click to browse</p>
                <p className="text-xs text-muted-foreground">Supports PDF, DOCX, TXT (Max 10MB)</p>
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
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">{uploadedFile.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Processing document...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {!uploadedFile && !isProcessing && (
            <Card className="h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Generate Learning Materials</h3>
                <p className="text-muted-foreground">
                  Upload a document to get started with AI-generated quizzes and summaries
                </p>
              </CardContent>
            </Card>
          )}

          {(uploadedFile || quiz) && (
            <Tabs defaultValue="quiz" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="chat">Q&A Chat</TabsTrigger>
              </TabsList>

              <TabsContent value="quiz" className="space-y-4">
                {quiz ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{quiz.title}</CardTitle>
                      <CardDescription>AI-generated quiz based on your document</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {quiz.questions.map((question: any, index: number) => (
                        <div key={question.id} className="space-y-3">
                          <h3 className="font-medium">
                            {index + 1}. {question.question}
                          </h3>
                          <div className="grid grid-cols-1 gap-2">
                            {question.options.map((option: string, optionIndex: number) => (
                              <Button
                                key={optionIndex}
                                variant="outline"
                                className="justify-start h-auto p-3 text-left"
                              >
                                <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center mr-3 text-xs">
                                  {String.fromCharCode(65 + optionIndex)}
                                </span>
                                {option}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <Button className="w-full">Submit Quiz</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-64 flex items-center justify-center">
                    <CardContent className="text-center">
                      <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Quiz will appear here after processing</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                {summary ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Summary</CardTitle>
                      <CardDescription>AI-generated summary of key points</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose dark:prose-invert max-w-none">
                        <p>{summary}</p>
                      </div>
                      <div className="mt-6 space-y-2">
                        <h4 className="font-medium">Key Topics:</h4>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">Fundamentals</Badge>
                          <Badge variant="secondary">Methodology</Badge>
                          <Badge variant="secondary">Applications</Badge>
                          <Badge variant="secondary">Implementation</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-64 flex items-center justify-center">
                    <CardContent className="text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Summary will appear here after processing</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="chat" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Document Q&A Assistant
                    </CardTitle>
                    <CardDescription>Ask questions about your uploaded document</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-96 flex flex-col">
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {uploadedFile && (
                            <div className="flex gap-3 justify-start">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  <Bot className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                                <p className="text-sm">
                                  I've analyzed your document "{uploadedFile.name}". Feel free to ask me any questions
                                  about its content, key concepts, or request clarifications on specific topics.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                      <div className="p-4 border-t">
                        <div className="flex gap-2">
                          <Input placeholder="Ask about the document content..." disabled={!uploadedFile} />
                          <Button size="icon" disabled={!uploadedFile}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
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
