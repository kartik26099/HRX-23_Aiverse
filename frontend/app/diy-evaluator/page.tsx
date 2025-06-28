"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  BarChart3,
  Upload,
  FileText,
  Video,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Lightbulb,
  ArrowRight,
} from "lucide-react"

interface EvaluationReport {
  overallScore: number
  scores: {
    completion: number
    relevance: number
    functionality: number
    presentation: number
  }
  feedback: {
    completion: string
    relevance: string
    functionality: string
    presentation: string
    overall: string
  }
  improvements: string[]
  nextSteps: string[]
  strengths: string[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4006"

export default function DIYEvaluatorPage() {
  const [formData, setFormData] = useState({
    taskDescription: "",
    projectSummary: "",
    uploadedFile: null as File | null,
  })
  const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const { toast } = useToast()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFormData({ ...formData, uploadedFile: file })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.taskDescription.trim() || !formData.projectSummary.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both task description and project summary.",
        variant: "destructive",
      })
      return
    }

    setIsEvaluating(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("task", formData.taskDescription)
      formDataToSend.append("summary", formData.projectSummary)
      
      if (formData.uploadedFile) {
        formDataToSend.append("file", formData.uploadedFile)
      }

      const response = await fetch(`${API_BASE_URL}/evaluate`, {
        method: "POST",
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const evaluationData: EvaluationReport = await response.json()
      setEvaluation(evaluationData)
      
      toast({
        title: "Evaluation Complete",
        description: "Your project has been successfully evaluated!",
      })
    } catch (error) {
      console.error("Evaluation error:", error)
      toast({
        title: "Evaluation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Good"
    if (score >= 70) return "Fair"
    if (score >= 60) return "Needs Improvement"
    return "Poor"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setFormData({ ...formData, uploadedFile: files[0] })
    }
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">DIY Project Evaluator</h1>
        <p className="text-muted-foreground">
          Get detailed feedback and scoring on your completed projects with AI-powered evaluation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Project Evaluation
              </CardTitle>
              <CardDescription>Submit your project details for comprehensive AI evaluation</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="task-description">Task Description</Label>
                  <Textarea
                    id="task-description"
                    placeholder="Describe what you were supposed to build or accomplish..."
                    value={formData.taskDescription}
                    onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-summary">Project Summary</Label>
                  <Textarea
                    id="project-summary"
                    placeholder="Describe what you actually built, features implemented, challenges faced..."
                    value={formData.projectSummary}
                    onChange={(e) => setFormData({ ...formData, projectSummary: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload Project File</Label>
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">Drop your file here or click to browse</p>
                    <p className="text-xs text-muted-foreground">Supports videos, images, and documents</p>
                    <input
                      id="file-upload"
                      type="file"
                      accept="video/*,image/*,.pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {formData.uploadedFile && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        {formData.uploadedFile.type.startsWith("video/") && <Video className="w-4 h-4" />}
                        {formData.uploadedFile.type.startsWith("image/") && <ImageIcon className="w-4 h-4" />}
                        {!formData.uploadedFile.type.startsWith("video/") &&
                          !formData.uploadedFile.type.startsWith("image/") && <FileText className="w-4 h-4" />}
                        <span className="text-sm font-medium">{formData.uploadedFile.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(formData.uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isEvaluating || !formData.taskDescription.trim() || !formData.projectSummary.trim()}
                >
                  {isEvaluating ? "Evaluating Project..." : "Evaluate Project"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {isEvaluating && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">AI is evaluating your project...</p>
                <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
              </div>
            </div>
          )}

          {evaluation && (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Evaluation Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-muted-foreground/20"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 50}`}
                          strokeDashoffset={`${2 * Math.PI * 50 * (1 - evaluation.overallScore / 100)}`}
                          className={getScoreColor(evaluation.overallScore)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                            {evaluation.overallScore}
                          </div>
                          <div className="text-xs text-muted-foreground">out of 100</div>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-1">
                      {getScoreLabel(evaluation.overallScore)}
                    </Badge>
                  </div>

                  {/* Individual Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(evaluation.scores).map(([key, score]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">{key}</span>
                          <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}%</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Detailed Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(evaluation.feedback).map(([key, feedback]) => (
                    <div key={key}>
                      <h3 className="font-semibold capitalize mb-2 flex items-center gap-2">
                        {key === "overall" ? <CheckCircle className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                        {key} {key !== "overall" && `(${evaluation.scores[key as keyof typeof evaluation.scores]}%)`}
                      </h3>
                      <p className="text-sm text-muted-foreground">{feedback}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Strengths */}
              {evaluation.strengths.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      Project Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {evaluation.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Improvements */}
              {evaluation.improvements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="w-5 h-5" />
                      Suggested Improvements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {evaluation.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Next Steps */}
              {evaluation.nextSteps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <ArrowRight className="w-5 h-5" />
                      Recommended Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {evaluation.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!evaluation && !isEvaluating && (
            <Card className="h-96 flex items-center justify-center">
              <CardContent className="text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to Evaluate Your Project</h3>
                <p className="text-muted-foreground">
                  Fill out the form to get detailed AI-powered feedback on your work
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
