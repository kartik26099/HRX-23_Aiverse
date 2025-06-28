import Link from "next/link"
import { Lightbulb, Github, Twitter, Linkedin, Sparkles, Mail, Phone, MapPin, ArrowRight, Heart, Zap, Users, BookOpen, Target, Shield, FileText, HelpCircle, Activity } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = {
    "AI Tools": [
      { name: "Course Generator", href: "/course-generator", icon: BookOpen },
      { name: "AI Advisor", href: "/ai-advisor", icon: Zap },
      { name: "AI Faculty", href: "/ai-faculty", icon: Users },
      { name: "Research Helper", href: "/research-helper", icon: Target },
    ],
    "DIY Tools": [
      { name: "DIY Generator", href: "/diy-generator", icon: Sparkles },
      { name: "DIY Evaluator", href: "/diy-evaluator", icon: Target },
      { name: "DIY Scheduler", href: "/scheduler", icon: Zap },
      { name: "Library", href: "/library", icon: BookOpen },
    ],
    "Company": [
      { name: "About Us", href: "/about", icon: Users },
      { name: "Contact", href: "/contact", icon: Mail },
      { name: "Privacy Policy", href: "/privacy", icon: Shield },
      { name: "Terms of Service", href: "/terms", icon: FileText },
    ],
    "Support": [
      { name: "Help Center", href: "/help", icon: HelpCircle },
      { name: "Documentation", href: "/docs", icon: BookOpen },
      { name: "Community", href: "/community", icon: Users },
      { name: "Status", href: "/status", icon: Activity },
    ],
  }

  const socialLinks = [
    { name: "GitHub", href: "#", icon: Github, color: "hover:text-gray-600 dark:hover:text-gray-300" },
    { name: "Twitter", href: "#", icon: Twitter, color: "hover:text-blue-500" },
    { name: "LinkedIn", href: "#", icon: Linkedin, color: "hover:text-blue-600" },
  ]

  const contactInfo = [
    { icon: Mail, text: "hello@dolab.com", href: "mailto:hello@dolab.com" },
    { icon: Phone, text: "+1 (555) 123-4567", href: "tel:+15551234567" },
    { icon: MapPin, text: "San Francisco, CA", href: "#" },
  ]

  return (
    <footer className="border-t border-border/40 bg-background/80 backdrop-blur-sm">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="xl:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                  <Lightbulb className="h-7 w-7 text-primary-foreground" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 animate-pulse" />
              </div>
              <div>
                <span className="font-bold text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">DoLab</span>
                <p className="text-sm text-muted-foreground">AI Learning Platform</p>
              </div>
            </div>
            
            <p className="text-muted-foreground leading-relaxed max-w-md">
              Transform learning into action with AI-powered educational tools and intelligent assistance. 
              Join thousands of learners who have revolutionized their education journey.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              {contactInfo.map((contact, index) => (
                <Link
                  key={index}
                  href={contact.href}
                  className="flex items-center space-x-3 text-muted-foreground hover:text-primary transition-colors duration-300 group"
                >
                  <contact.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">{contact.text}</span>
                </Link>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className={`w-10 h-10 bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg flex items-center justify-center text-muted-foreground transition-all duration-300 hover:scale-110 ${social.color}`}
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          {Object.entries(quickLinks).map(([category, links], index) => (
            <div key={category} className="space-y-4">
              <h3 className="font-semibold text-lg text-primary">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm group flex items-center space-x-2"
                    >
                      <span>{link.name}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-t border-border/40 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
              Stay Updated with AI Learning
            </h3>
            <p className="text-muted-foreground mb-8">
              Get the latest updates on new AI tools, learning tips, and educational insights delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>&copy; {currentYear} DoLab. All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Powered by Advanced AI Technology</span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary transition-colors duration-300">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors duration-300">
                Terms
              </Link>
              <Link href="/cookies" className="hover:text-primary transition-colors duration-300">
                Cookies
              </Link>
              <div className="flex items-center space-x-1">
                <span>Made with</span>
                <Heart className="h-4 w-4 text-red-500 animate-pulse" />
                <span>for learners</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
