import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Bot, GraduationCap, Search, Wrench, Calendar, FileText, BarChart3 } from "lucide-react"
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs"

export default function HomePage() {
  const features = [
    {
      title: "AI Course Generator",
      description: "Create personalized learning curricula tailored to your goals and experience level",
      icon: GraduationCap,
      href: "/course-generator",
      color: "bg-blue-500",
    },
    {
      title: "AI Advisor",
      description: "Get personalized learning recommendations through our intelligent chatbot",
      icon: Bot,
      href: "/ai-advisor",
      color: "bg-green-500",
    },
    {
      title: "AI Faculty",
      description: "Upload documents and get AI-generated quizzes and interactive Q&A sessions",
      icon: FileText,
      href: "/ai-faculty",
      color: "bg-purple-500",
    },
    {
      title: "Research Helper",
      description: "Get research guidance, roadmaps, and stay updated with latest academic news",
      icon: Search,
      href: "/research-helper",
      color: "bg-orange-500",
    },
    {
      title: "AI Library",
      description: "Access curated educational resources with intelligent search and filtering",
      icon: BookOpen,
      href: "/library",
      color: "bg-pink-500",
    },
    {
      title: "DIY Generator",
      description: "Generate step-by-step project plans with timelines and resource lists",
      icon: Wrench,
      href: "/diy-generator",
      color: "bg-cyan-500",
    },
    {
      title: "DIY Evaluator",
      description: "Get detailed feedback and scoring on your completed projects",
      icon: BarChart3,
      href: "/diy-evaluator",
      color: "bg-red-500",
    },
    {
      title: "DIY Scheduler",
      description: "Plan and schedule your learning tasks with intelligent time management",
      icon: Calendar,
      href: "/scheduler",
      color: "bg-indigo-500",
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Transform Learning Into Action
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Bridge the gap between learning concepts and building real projects. Our AI-powered platform guides you from
            knowledge to creation.
          </p>
          
          <SignedIn>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" asChild>
                <Link href="/course-generator">Start Learning</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/ai-advisor">Get AI Guidance</Link>
              </Button>
            </div>
          </SignedIn>
          
          <SignedOut>
            <div className="flex gap-4 justify-center flex-wrap">
              <SignUpButton mode="modal">
                <Button size="lg">
                  Get Started Free
                </Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful AI Tools for Every Learning Stage</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From course creation to project evaluation, our comprehensive suite of AI tools supports your entire
              learning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">{feature.description}</CardDescription>
                  <SignedIn>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={feature.href}>Explore Tool</Link>
                    </Button>
                  </SignedIn>
                  <SignedOut>
                    <SignUpButton mode="modal">
                      <Button variant="outline" className="w-full">
                        Sign Up to Access
                      </Button>
                    </SignUpButton>
                  </SignedOut>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to Start Building?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold">Learn</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Generate personalized courses or get AI guidance on any topic
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold">Plan</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create project roadmaps and schedule your learning journey
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold">Build</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Execute your projects and get AI-powered evaluation and feedback
              </p>
            </div>
          </div>
          
          <SignedOut>
            <div className="mt-12">
              <SignUpButton mode="modal">
                <Button size="lg">
                  Start Your Learning Journey
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>
        </div>
      </section>
    </div>
  )
}
