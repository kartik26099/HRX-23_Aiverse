import Link from "next/link"
import { GraduationCap, Github, Twitter, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">EduAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Transform learning into action with AI-powered educational tools.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">AI Tools</h3>
            <div className="space-y-2 text-sm">
              <Link href="/course-generator" className="block text-muted-foreground hover:text-foreground">
                Course Generator
              </Link>
              <Link href="/ai-advisor" className="block text-muted-foreground hover:text-foreground">
                AI Advisor
              </Link>
              <Link href="/ai-faculty" className="block text-muted-foreground hover:text-foreground">
                AI Faculty
              </Link>
              <Link href="/research-helper" className="block text-muted-foreground hover:text-foreground">
                Research Helper
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">DIY Tools</h3>
            <div className="space-y-2 text-sm">
              <Link href="/diy-generator" className="block text-muted-foreground hover:text-foreground">
                DIY Generator
              </Link>
              <Link href="/diy-evaluator" className="block text-muted-foreground hover:text-foreground">
                DIY Evaluator
              </Link>
              <Link href="/scheduler" className="block text-muted-foreground hover:text-foreground">
                DIY Scheduler
              </Link>
              <Link href="/library" className="block text-muted-foreground hover:text-foreground">
                Library
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Company</h3>
            <div className="space-y-2 text-sm">
              <Link href="/about" className="block text-muted-foreground hover:text-foreground">
                About Us
              </Link>
              <Link href="/contact" className="block text-muted-foreground hover:text-foreground">
                Contact
              </Link>
              <Link href="/privacy" className="block text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 EduAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
