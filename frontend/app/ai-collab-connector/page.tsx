"use client"

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Users, Search, MessageSquare, User, Loader2 } from 'lucide-react';

export default function AICollabConnectorPage() {
  const { user, isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Simple form states
  const [username, setUsername] = useState('');
  const [projectName, setProjectName] = useState('');
  const [skills, setSkills] = useState('');
  const [hours, setHours] = useState(10);
  
  // Data states
  const [profiles, setProfiles] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (isSignedIn) {
      loadData();
    }
  }, [isSignedIn]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load profiles
      const profileResponse = await fetch('/api/collab/profile');
      const profileData = await profileResponse.json();
      if (profileData.profile) {
        setUsername(profileData.profile.username || '');
        setProjectName(profileData.profile.project_name || '');
        setSkills(profileData.profile.skills || '');
        setHours(profileData.profile.hours_per_week || 10);
      }

      // Load teams
      const teamsResponse = await fetch('/api/collab/teams');
      const teamsData = await teamsResponse.json();
      setTeams(teamsData.teams || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!username || !projectName || !skills) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/collab/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          project_name: projectName,
          skills,
          hours_per_week: hours
        }),
      });

      if (response.ok) {
        toast.success('Profile saved successfully!');
      } else {
        toast.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const findCollaborator = async () => {
    if (!projectName || !skills) {
      toast.error('Please fill in project name and skills');
      return;
    }

    setSearching(true);
    try {
      const response = await fetch('/api/collab/find-collaborator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: projectName,
          username,
          required_skills: skills,
          required_hours: hours
        }),
      });

      const data = await response.json();
      if (response.ok && data.collaborator) {
        toast.success('Found a collaborator!');
      } else {
        toast.error('No suitable collaborator found');
      }
    } catch (error) {
      console.error('Error finding collaborator:', error);
      toast.error('Failed to find collaborator');
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">AI Collab Connector</h1>
        <p className="text-xl text-muted-foreground">
          Find the perfect teammate. Split the workload. Build faster & better.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="find">Find Collaborator</TabsTrigger>
          <TabsTrigger value="chat">Team Chat</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Your Project Profile</CardTitle>
              <CardDescription>
                Tell us about your project and skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                />
              </div>
              
              <div>
                <Label htmlFor="project">Project Name</Label>
                <Input
                  id="project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="What are you building?"
                />
              </div>
              
              <div>
                <Label htmlFor="skills">Skills</Label>
                <Input
                  id="skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g., React, Python, UI/UX"
                />
              </div>
              
              <div>
                <Label htmlFor="hours">Hours per Week</Label>
                <Input
                  id="hours"
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  placeholder="How many hours can you dedicate?"
                />
              </div>
              
              <Button 
                onClick={saveProfile} 
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Find Collaborator Tab */}
        <TabsContent value="find">
          <Card>
            <CardHeader>
              <CardTitle>Find Your Perfect Collaborator</CardTitle>
              <CardDescription>
                Describe what you're looking for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="find_project">Project Name</Label>
                <Input
                  id="find_project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Your project name"
                />
              </div>
              
              <div>
                <Label htmlFor="find_skills">Skills Needed</Label>
                <Input
                  id="find_skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g., UI/UX, Backend, Data Science"
                />
              </div>
              
              <div>
                <Label htmlFor="find_hours">Hours Needed</Label>
                <Input
                  id="find_hours"
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  placeholder="How many hours do you need?"
                />
              </div>
              
              <Button 
                onClick={findCollaborator} 
                disabled={searching}
                className="w-full"
              >
                {searching ? 'Finding...' : 'Find Collaborator'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Team Chat</CardTitle>
              <CardDescription>
                Chat with your team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teams.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No teams yet. Create a team first!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teams.map((team: any) => (
                    <div key={team.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{team.project_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {team.member1_username} + {team.member2_username}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 