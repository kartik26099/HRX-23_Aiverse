'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { 
  Users, 
  Search, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Target, 
  Trophy,
  Star,
  Calendar,
  Zap,
  Brain,
  Code,
  Palette,
  Database,
  Globe,
  Heart,
  Sparkles
} from 'lucide-react'

interface UserProfile {
  id: string
  username: string
  skills: string[]
  experience_level: string
  interests: string[]
  compatibility_score: number
  skill_complementarity: string
  learning_potential: string
  recommended_role: string
  challenges: string[]
}

interface Team {
  id: string
  name: string
  members: UserProfile[]
  tasks: Task[]
  status: string
}

interface Task {
  id: string
  title: string
  description: string
  assigned_to: string
  status: string
  priority: string
  estimated_hours: number
  deadline: string
}

interface ChatMessage {
  id: string
  sender_username: string
  message: string
  created_at: string
}

type Collaborator = UserProfile & { user_id?: string };

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4011"

export default function AICollabConnectorPage() {
  const { user, isSignedIn } = useUser()
  
  // State management
  const [activeTab, setActiveTab] = useState('find')
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [collaborators, setCollaborators] = useState<UserProfile[]>([])
  const [selectedCollaborators, setSelectedCollaborators] = useState<Collaborator[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    username: '',
    skills: '',
    interests: '',
    experience_level: 'beginner'
  })
  
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    required_skills: '',
    estimated_duration: '2 weeks',
    team_size: 2
  })

  // Load user profile on component mount
  useEffect(() => {
    if (isSignedIn && user) {
      loadUserProfile()
    }
  }, [isSignedIn, user])

  // Load team chat when currentTeam changes
  useEffect(() => {
    if (currentTeam) {
      loadTeamChat(currentTeam.id)
    }
  }, [currentTeam])

  // Load team chat when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && currentTeam) {
      loadTeamChat(currentTeam.id)
    }
  }, [activeTab, currentTeam])

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/user-profile/${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.profile)
        if (data.profile) {
          setProfileForm({
            username: data.profile.username || '',
            skills: data.profile.skills?.join(', ') || '',
            interests: data.profile.interests?.join(', ') || '',
            experience_level: data.profile.experience_level || 'beginner'
          })
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const createUserProfile = async () => {
    if (!isSignedIn || !user) {
      toast.error("Please sign in to create your profile.")
      return
    }

    setIsLoading(true)
    try {
      const profileData = {
        clerk_id: user.id,
        username: profileForm.username,
        email: user.emailAddresses[0]?.emailAddress || '',
        skills: profileForm.skills.split(',').map(s => s.trim()).filter(s => s),
        interests: profileForm.interests.split(',').map(s => s.trim()).filter(s => s),
        experience_level: profileForm.experience_level,
        availability: { timezone: 'UTC', hours_per_week: 10 },
        preferred_domains: [],
        working_style: 'balanced',
        completed_projects: [],
        personality_traits: []
      }

      const response = await fetch(`${BACKEND_URL}/api/create-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        const data = await response.json()
        setUserProfile({ ...profileData, id: data.profile_id })
        toast.success("Profile created successfully!")
        loadUserProfile()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to create profile. Please try again.")
      }
    } catch (error) {
      toast.error("Failed to create profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const findCollaborators = async () => {
    if (!userProfile) {
      toast.error("Please create your profile first.")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${BACKEND_URL}/api/find-collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_id: userProfile.id,
          project_requirements: {
            title: projectForm.title,
            description: projectForm.description,
            required_skills: projectForm.required_skills.split(',').map(s => s.trim()).filter(s => s),
            preferred_domains: [],
            estimated_duration: projectForm.estimated_duration,
            team_size: projectForm.team_size
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCollaborators(data.matches || [])
        
        // Show success animation if collaborators found
        if (data.matches && data.matches.length > 0) {
          setShowSuccessAnimation(true)
          setTimeout(() => setShowSuccessAnimation(false), 4000) // Show for 4 seconds
        }
        
        toast.success(`Found ${data.total_matches || data.matches?.length || 0} potential collaborators!`)
      } else {
        throw new Error('Failed to find collaborators')
      }
    } catch (error) {
      console.error('Error finding collaborators:', error)
      toast.error("Failed to find collaborators. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const createTeam = async () => {
    if (selectedCollaborators.length === 0) {
      toast.error("Please select at least one collaborator.")
      return
    }

    setIsLoading(true)
    try {
      const teamData = {
        team_name: `Team for ${projectForm.title}`,
        project_id: Date.now().toString(),
        members: [
          { user_id: userProfile.id, role: 'Project Lead' },
          ...selectedCollaborators.map(collab => ({
            user_id: collab.user_id || collab.id,
            role: collab.recommended_role || 'Member'
          }))
        ]
      }

      const response = await fetch(`${BACKEND_URL}/api/create-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      })

      if (response.ok) {
        const data = await response.json()
        const newTeam = {
          id: data.team_id,
          name: teamData.team_name,
          members: [userProfile, ...selectedCollaborators],
          tasks: [],
          status: 'active'
        }
        setTeams([...teams, newTeam])
        setCurrentTeam(newTeam)
        setSelectedCollaborators([])
        setActiveTab('chat')
        toast.success("Team created successfully!")
        generateTasks(data.team_id)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || "Failed to create team. Please try again.")
      }
    } catch (error) {
      toast.error("Failed to create team. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const generateTasks = async (teamId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          project_requirements: {
            title: projectForm.title,
            description: projectForm.description,
            required_skills: projectForm.required_skills.split(',').map(s => s.trim()).filter(s => s),
            preferred_domains: [],
            estimated_duration: projectForm.estimated_duration,
            team_size: projectForm.team_size
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        loadTeamTasks(teamId)
        toast.success("Tasks generated for your team!")
      }
    } catch (error) {
      console.error('Error generating tasks:', error)
    }
  }

  const loadTeamTasks = async (teamId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/team/${teamId}/tasks`)
      if (response.ok) {
        const data = await response.json()
        setTeams(prev => prev.map(team => 
          team.id === teamId 
            ? { ...team, tasks: data.tasks || [] }
            : team
        ))
        if (currentTeam?.id === teamId) {
          setCurrentTeam(prev => prev ? { ...prev, tasks: data.tasks || [] } : null)
        }
      }
    } catch (error) {
      console.error('Error loading team tasks:', error)
    }
  }

  const loadTeamChat = async (teamId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/team/${teamId}/chat`)
      if (response.ok) {
        const data = await response.json()
        setChatMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error loading team chat:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentTeam) return

    try {
      const response = await fetch(`${BACKEND_URL}/api/team/${currentTeam.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: userProfile.id,
          message: newMessage,
          message_type: 'text'
        })
      })

      if (response.ok) {
        setNewMessage('')
        loadTeamChat(currentTeam.id)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const getExperienceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSkillIcon = (skill: string) => {
    const skillLower = skill.toLowerCase()
    if (skillLower.includes('python') || skillLower.includes('javascript')) return <Code className="w-4 h-4" />
    if (skillLower.includes('design') || skillLower.includes('figma')) return <Palette className="w-4 h-4" />
    if (skillLower.includes('data') || skillLower.includes('ml')) return <Brain className="w-4 h-4" />
    if (skillLower.includes('database') || skillLower.includes('sql')) return <Database className="w-4 h-4" />
    if (skillLower.includes('web') || skillLower.includes('frontend')) return <Globe className="w-4 h-4" />
    return <Star className="w-4 h-4" />
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              AI Collab Connector
            </CardTitle>
            <CardDescription>
              Please sign in to access the collaboration features.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          AI Collab Connector
        </h1>
        <p className="text-xl text-muted-foreground">
          Find the perfect teammate. Split the workload. Build faster & better.
        </p>
      </div>

      {/* Success Animation */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-2xl animate-in zoom-in-95 duration-500 max-w-md mx-4">
            <div className="mb-6">
              <div className="relative">
                <Sparkles className="w-20 h-20 mx-auto text-green-500 animate-pulse" />
                <CheckCircle className="w-12 h-12 mx-auto text-green-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3 text-green-600">🎉 Perfect Match!</h2>
            <p className="text-xl text-muted-foreground mb-2">
              We found the perfect collaborator
            </p>
            <p className="text-lg text-muted-foreground">
              for your project!
            </p>
            <div className="mt-6">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="find">Find Collaborators</TabsTrigger>
          <TabsTrigger value="chat">Team Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Quick setup to help us find your perfect collaborators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Username & Experience Level Row */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                    placeholder="What should we call you?"
                    className="w-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-sm font-medium">Experience Level</label>
                  <select
                    value={profileForm.experience_level}
                    onChange={(e) => setProfileForm({...profileForm, experience_level: e.target.value})}
                    className="w-full rounded-md border border-input bg-muted text-muted-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                    style={{backgroundColor: '#23272f', color: '#a1a1aa'}} // grey bg/text for dark mode
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Skills & Interests Row */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <label className="text-sm font-medium">Skills (comma-separated)</label>
                  <Input
                    value={profileForm.skills}
                    onChange={(e) => setProfileForm({...profileForm, skills: e.target.value})}
                    placeholder="e.g., Python, React, UI/UX Design, Data Analysis"
                    className="w-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="text-sm font-medium">Interests (comma-separated)</label>
                  <Input
                    value={profileForm.interests}
                    onChange={(e) => setProfileForm({...profileForm, interests: e.target.value})}
                    placeholder="e.g., AI, Climate Tech, Education, Healthcare"
                    className="w-full"
                  />
                </div>
              </div>

              <Button 
                onClick={createUserProfile} 
                disabled={isLoading}
                className="w-full max-w-xs"
              >
                {isLoading ? 'Creating Profile...' : 'Create/Update Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="find" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Find Collaborators</CardTitle>
              <CardDescription>
                Describe your project and let AI find the perfect teammates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Title</label>
                <Input
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                  placeholder="e.g., Climate Education Platform, AI Chatbot, Mobile App"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Project Description</label>
                <Textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                  placeholder="Tell us about your project idea, goals, and what you want to achieve..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Required Skills</label>
                  <Input
                    value={projectForm.required_skills}
                    onChange={(e) => setProjectForm({...projectForm, required_skills: e.target.value})}
                    placeholder="e.g., Python, React, UI/UX, Data Analysis"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Estimated Duration</label>
                  <select
                    value={projectForm.estimated_duration}
                    onChange={(e) => setProjectForm({...projectForm, estimated_duration: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="1 week">1 week</option>
                    <option value="2 weeks">2 weeks</option>
                    <option value="4 weeks">4 weeks</option>
                    <option value="8 weeks">8 weeks</option>
                  </select>
                </div>
              </div>
              
              <Button 
                onClick={findCollaborators} 
                disabled={isLoading || !userProfile}
                className="w-full"
              >
                {isLoading ? 'Finding Collaborators...' : 'Find Collaborators'}
              </Button>
            </CardContent>
          </Card>

          {collaborators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Potential Collaborators</CardTitle>
                <CardDescription>
                  Select the collaborators you'd like to work with.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {collaborators.map((collaborator) => (
                    <Card key={collaborator.id || collaborator.username} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>{collaborator.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{collaborator.username}</h3>
                              <Badge className={getExperienceColor(collaborator.experience_level)}>
                                {collaborator.experience_level}
                              </Badge>
                              <Badge variant="secondary">
                                {collaborator.compatibility_score}% match
                              </Badge>
                            </div>
                            
                            <div className="mb-2">
                              <p className="text-sm text-muted-foreground mb-1">Skills:</p>
                              <div className="flex flex-wrap gap-1">
                                {collaborator.skills.map((skill) => (
                                  <Badge key={collaborator.id + '-' + skill} variant="outline" className="text-xs">
                                    {getSkillIcon(skill)}
                                    <span className="ml-1">{skill}</span>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              <p><strong>Recommended Role:</strong> {collaborator.recommended_role}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant={selectedCollaborators.find(c => c.id === collaborator.id) ? "default" : "outline"}
                          onClick={() => {
                            if (selectedCollaborators.find(c => c.id === collaborator.id)) {
                              setSelectedCollaborators(prev => prev.filter(c => c.id !== collaborator.id))
                            } else {
                              setSelectedCollaborators(prev => [...prev, collaborator])
                            }
                          }}
                        >
                          {selectedCollaborators.find(c => c.id === collaborator.id) ? 'Selected' : 'Select'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  {selectedCollaborators.length > 0 && (
                    <div className="mt-6">
                      <Button 
                        onClick={createTeam} 
                        disabled={isLoading}
                        className="w-full"
                        size="lg"
                      >
                        {isLoading ? 'Creating Team...' : `Create Team with ${selectedCollaborators.length} Collaborator${selectedCollaborators.length > 1 ? 's' : ''}`}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          {teams.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Teams Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first team by finding collaborators.
                </p>
                <Button onClick={() => setActiveTab('find')}>
                  Find Collaborators
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {teams.map((team) => (
                <Card key={team.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setCurrentTeam(team)}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{team.name}</span>
                      <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                        {team.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {team.members.length} members
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
              
              {currentTeam && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      {currentTeam.name} - Team Chat
                    </CardTitle>
                    <CardDescription>Collaborate with your team members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 border rounded-lg p-4 overflow-y-auto mb-4 bg-gray-50 dark:bg-gray-900">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                          <p className="mb-4">No messages yet. Start the conversation!</p>
                          <div className="text-sm space-y-2 text-left max-w-md mx-auto">
                            {[
                              {
                                color: 'blue',
                                bg: 'bg-blue-100 dark:bg-blue-900',
                                title: '💡 Try saying:',
                                text: '"Hi team! Let\'s discuss our project timeline."',
                              },
                              {
                                color: 'green',
                                bg: 'bg-green-100 dark:bg-green-900',
                                title: '🤝 Collaboration tips:',
                                text: 'Share your progress, ask questions, and coordinate tasks!',
                              },
                            ].map((tip) => (
                              <div key={tip.title} className={tip.bg + ' rounded-lg p-3'}>
                                <p className={`font-medium text-${tip.color}-800 dark:text-${tip.color}-200`}>{tip.title}</p>
                                <p className={`text-${tip.color}-700 dark:text-${tip.color}-300`}>{tip.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        chatMessages.map((message) => (
                          <div key={message.id} className="mb-4">
                            <div className="flex items-start gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>{message.sender_username[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm">{message.sender_username}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(message.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                                  <p className="text-sm">{message.message}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button onClick={sendMessage}>Send</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 