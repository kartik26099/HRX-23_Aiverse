"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  BookOpen,
  Video,
  FileText,
  Star,
  Eye,
  Bookmark,
  Grid3X3,
  List,
  Loader2,
  ExternalLink,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// --- Constants ---
const API_BASE_URL = "http://localhost:4001"

// --- Type Definitions ---
interface ScholarResource {
  title: string
  link: string
  source: string
  snippet: string
  publication_info: {
    summary: string
  }
  resources?: { title: string; link: string }[]
}

interface YoutubeResource {
  title: string
  link: string
  thumbnail: { static: string }
  channel: { name: string }
  views: string
  published_date: string
  length: string
}

interface UnifiedResource {
  id: string
  title:string
  type: "article" | "video"
  source: string // Channel for YouTube, Publication for Scholar
  snippet: string
  link: string
  thumbnail?: string
  bookmarked: boolean
}

// --- Main Component ---
export default function LibraryPage() {
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("Artificial Intelligence")
  const [submittedQuery, setSubmittedQuery] = useState("Artificial Intelligence")
  const [isLoading, setIsLoading] = useState(false)
  
  const [scholarResults, setScholarResults] = useState<ScholarResource[]>([])
  const [youtubeResults, setYoutubeResults] = useState<YoutubeResource[]>([])
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({})
  
  // --- API ---
  const handleSearch = async (query: string) => {
    if (!query.trim()) return
    
    setIsLoading(true)
    setSubmittedQuery(query)
    
    try {
      const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error("Network response was not ok")
      }
      const data = await response.json()
      
      setScholarResults(data.scholar || [])
      setYoutubeResults(data.youtube || [])
      
    } catch (error) {
      console.error("Failed to fetch search results:", error)
      toast({
        title: "Search Failed",
        description: "Could not fetch results. Please ensure the backend is running.",
        variant: "destructive",
      })
      setScholarResults([])
      setYoutubeResults([])
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    handleSearch(submittedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Data Transformation ---
  const unifiedResources: UnifiedResource[] = [
    ...scholarResults.map((item, index) => ({
      id: `scholar-${index}-${item.link}`,
      title: item.title,
      type: "article" as const,
      source: item.publication_info?.summary.split(" - ")[0] || "Unknown Publication",
      snippet: item.snippet,
      link: item.link,
      bookmarked: bookmarks[`scholar-${index}-${item.link}`] || false,
    })),
    ...youtubeResults.map((item, index) => ({
      id: `youtube-${index}-${item.link}`,
      title: item.title,
      type: "video" as const,
      source: item.channel?.name || "Unknown Channel",
      snippet: `Published: ${item.published_date} | Length: ${item.length} | Views: ${item.views}`,
      link: item.link,
      thumbnail: item.thumbnail?.static,
      bookmarked: bookmarks[`youtube-${index}-${item.link}`] || false,
    })),
  ]

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // --- Render ---
  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AI Library</h1>
        <p className="text-muted-foreground">
          Discover curated educational resources with intelligent search and filtering.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <form
          className="flex flex-col sm:flex-row gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch(searchQuery)
          }}
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search for articles and videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="min-w-[120px]">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
      
      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : unifiedResources.length === 0 ? (
        <div className="text-center h-64 flex flex-col justify-center items-center">
          <h2 className="text-2xl font-semibold">No Results Found</h2>
          <p className="text-muted-foreground">
            Try adjusting your search query or check if the server is running.
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }
        >
          {unifiedResources.map((resource) => (
            <Card key={resource.id} className={`flex flex-col ${viewMode === 'list' ? 'flex-row' : ''}`}>
              {resource.thumbnail && viewMode === "grid" && (
                <div className="aspect-video bg-muted overflow-hidden rounded-t-lg">
                   <img src={resource.thumbnail} alt={resource.title} className="w-full h-full object-cover"/>
                </div>
              )}
              <CardHeader className="flex-grow">
                <div className="flex justify-between items-start gap-2">
                  <Badge variant="outline" className="mb-2 flex-shrink-0">
                    {resource.type === 'video' ? <Video className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                    {resource.type}
                  </Badge>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => toggleBookmark(resource.id)}>
                    <Bookmark className={`w-4 h-4 ${resource.bookmarked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  </Button>
                </div>
                <CardTitle className="text-base leading-snug">{resource.title}</CardTitle>
                <CardDescription>{resource.source}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{resource.snippet}</p>
              </CardContent>
              <CardFooter>
                 <a href={resource.link} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="outline" className="w-full">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Resource
                    </Button>
                 </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
