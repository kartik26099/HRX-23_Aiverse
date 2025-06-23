"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Bot, GraduationCap, Search, Wrench, Calendar, FileText, BarChart3, Sparkles, Zap, Brain, ArrowRight, Star, Users, Target, Rocket, Shield, Globe, Cpu } from "lucide-react"
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs"
import { useState } from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const features = [
    {
      title: "AI Course Generator",
      description: "Create personalized learning curricula tailored to your goals and experience level",
      icon: GraduationCap,
      href: "/course-generator",
      color: "from-blue-500 to-purple-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      category: "Learning",
    },
    {
      title: "AI Advisor",
      description: "Get personalized learning recommendations through our intelligent chatbot",
      icon: Bot,
      href: "/ai-advisor",
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-800",
      category: "Guidance",
    },
    {
      title: "AI Faculty",
      description: "Upload documents and get AI-generated quizzes and interactive Q&A sessions",
      icon: FileText,
      href: "/ai-faculty",
      color: "from-pink-500 to-rose-600",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
      borderColor: "border-pink-200 dark:border-pink-800",
      category: "Education",
    },
    {
      title: "Research Helper",
      description: "Get research guidance, roadmaps, and stay updated with latest academic news",
      icon: Search,
      href: "/research-helper",
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
      borderColor: "border-cyan-200 dark:border-cyan-800",
      category: "Research",
    },
    {
      title: "AI Library",
      description: "Access curated educational resources with intelligent search and filtering",
      icon: BookOpen,
      href: "/library",
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      category: "Resources",
    },
    {
      title: "DIY Generator",
      description: "Generate step-by-step project plans with timelines and resource lists",
      icon: Wrench,
      href: "/diy-generator",
      color: "from-orange-500 to-red-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-800",
      category: "Projects",
    },
    {
      title: "DIY Evaluator",
      description: "Get detailed feedback and scoring on your completed projects",
      icon: BarChart3,
      href: "/diy-evaluator",
      color: "from-red-500 to-pink-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800",
      category: "Evaluation",
    },
    {
      title: "DIY Scheduler",
      description: "Plan and schedule your learning tasks with intelligent time management",
      icon: Calendar,
      href: "/scheduler",
      color: "from-indigo-500 to-purple-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/20",
      borderColor: "border-indigo-200 dark:border-indigo-800",
      category: "Planning",
    },
  ]

  const filteredFeatures = features.filter(feature => 
    activeCategory === 'All' || feature.category === activeCategory
  );

  const stats = [
    { label: "Active Learners", value: "10K+", icon: Users, color: "text-blue-600" },
    { label: "AI-Powered Tools", value: "8", icon: Cpu, color: "text-purple-600" },
    { label: "Success Rate", value: "95%", icon: Target, color: "text-green-600" },
    { label: "Countries", value: "50+", icon: Globe, color: "text-orange-600" },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Computer Science Student",
      content: "The AI Course Generator helped me create a perfect learning path for machine learning. It's like having a personal tutor!",
      rating: 5,
    },
    {
      name: "Marcus Rodriguez",
      role: "Software Developer",
      content: "The DIY Evaluator gave me detailed feedback on my projects. It's incredibly accurate and helpful for improvement.",
      rating: 5,
    },
    {
      name: "Priya Patel",
      role: "Research Scholar",
      content: "Research Helper is a game-changer. It keeps me updated with the latest academic trends and helps me stay ahead.",
      rating: 5,
    },
  ]

  const categories = ["All", "Learning", "Guidance", "Education", "Research", "Resources", "Projects", "Evaluation", "Planning"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-pink-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="flex items-center space-x-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full px-6 py-3 w-fit border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Powered by Advanced AI</span>
                <Zap className="h-5 w-5 text-blue-600 animate-pulse" />
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Transform</span>
                <br />
                <span className="text-slate-800 dark:text-slate-200">Learning Into</span>
                <br />
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">Action</span>
              </h1>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                Bridge the gap between learning concepts and building real projects. Our AI-powered platform guides you from knowledge to creation with intelligent assistance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <SignedIn>
                  <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group px-8 py-6 text-lg font-semibold">
                    <Link href="/course-generator" className="flex items-center space-x-3">
                      <span>Start Learning</span>
                      <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild className="border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 px-8 py-6 text-lg font-semibold">
                    <Link href="/ai-advisor">Get AI Guidance</Link>
                  </Button>
                </SignedIn>
                
                <SignedOut>
                  <SignUpButton mode="modal">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group px-8 py-6 text-lg font-semibold">
                      <span className="flex items-center space-x-3">
                        <span>Get Started Free</span>
                        <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <Button size="lg" variant="outline" className="border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 px-8 py-6 text-lg font-semibold">
                      Sign In
                    </Button>
                  </SignInButton>
                </SignedOut>
              </div>
            </div>

            {/* Right Content - Interactive Demo */}
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
                <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200">AI Learning Assistant</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Real-time guidance</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">AI</span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-3 max-w-xs">
                        <p className="text-sm text-slate-700 dark:text-slate-300">Hello! I'm here to help you learn. What would you like to explore today?</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 justify-end">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl px-4 py-3 max-w-xs">
                        <p className="text-sm text-white">I want to learn web development!</p>
                      </div>
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">U</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">AI</span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl px-4 py-3 max-w-xs">
                        <p className="text-sm text-slate-700 dark:text-slate-300">Great choice! Let me create a personalized learning path for you...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-3">
                <div className={`w-16 h-16 mx-auto bg-gradient-to-r ${stat.color.replace('text-', 'from-').replace('-600', '-500')} to-${stat.color.replace('text-', '').replace('-600', '-600')} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">{stat.value}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-200 mb-6">
              Powerful AI Tools for Every Learner
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              From course generation to project evaluation, our comprehensive suite of AI-powered tools adapts to your learning style and goals.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredFeatures.map((feature, index) => (
              <Card key={index} className={`group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 ${feature.borderColor} ${feature.bgColor}`}>
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-slate-600 dark:text-slate-400 text-base leading-relaxed mb-6">
                    {feature.description}
                  </CardDescription>
                  <Button asChild className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Link href={feature.href} className="flex items-center justify-center space-x-2">
                      <span>Explore Tool</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-200 mb-6">
              Loved by Learners Worldwide
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Join thousands of students who have transformed their learning journey with our AI-powered platform.
            </p>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-2 border-slate-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-center space-x-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed mb-6 italic">
                        "{testimonial.content}"
                      </p>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{testimonial.name}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{testimonial.role}</div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Join thousands of learners who are already building their future with AI-powered education.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedIn>
              <Button size="lg" asChild className="bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg font-semibold">
                <Link href="/course-generator" className="flex items-center space-x-3">
                  <span>Start Learning Now</span>
                  <ArrowRight className="h-6 w-6" />
                </Link>
              </Button>
            </SignedIn>
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg font-semibold">
                  <span className="flex items-center space-x-3">
                    <span>Get Started Free</span>
                    <ArrowRight className="h-6 w-6" />
                  </span>
                </Button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      </section>
    </div>
  )
}
