"use client"

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  User, 
  Edit3, 
  Save, 
  X, 
  GraduationCap, 
  Briefcase, 
  Calendar,
  Globe,
  Award,
  CheckCircle,
  Loader2,
  Code,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2
} from 'lucide-react';

interface ProfileData {
  id: string;
  clerk_id: string;
  username: string;
  age: number | null;
  education_level: string | null;
  domain_of_interest: string | null;
  skills: string | null;
  previous_projects: string | null;
  created_at: string;
  updated_at: string;
}

const educationLevels = [
  'High School',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'PhD',
  'Self-Taught',
  'Other'
];

export default function ProfilePage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Skills management state
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  
  // Projects management state
  const [projectsList, setProjectsList] = useState<string[]>([]);
  const [newProject, setNewProject] = useState('');
  const [showProjectInput, setShowProjectInput] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    age: '',
    education_level: '',
    domain_of_interest: '',
    skills: '',
    previous_projects: ''
  });

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isSignedIn) return;

      try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        
        if (response.ok) {
          setProfile(data.profile);
          if (data.profile) {
            setFormData({
              username: data.profile.username || '',
              age: data.profile.age?.toString() || '',
              education_level: data.profile.education_level || '',
              domain_of_interest: data.profile.domain_of_interest || '',
              skills: data.profile.skills || '',
              previous_projects: data.profile.previous_projects || ''
            });
            // Initialize skills list
            if (data.profile.skills) {
              setSkillsList(data.profile.skills.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill));
            }
            // Initialize projects list
            if (data.profile.previous_projects) {
              setProjectsList(data.profile.previous_projects.split(',').map((project: string) => project.trim()).filter((project: string) => project));
            }
          } else {
            // Set default username from Clerk
            setFormData(prev => ({
              ...prev,
              username: user?.username || user?.firstName || 'User'
            }));
          }
        } else {
          toast.error('Failed to load profile');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && isSignedIn) {
      fetchProfile();
    }
  }, [isSignedIn, isLoaded, user]);

  // Update formData.skills when skillsList changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      skills: skillsList.join(', ')
    }));
  }, [skillsList]);

  // Update formData.previous_projects when projectsList changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      previous_projects: projectsList.join(', ')
    }));
  }, [projectsList]);

  const handleSave = async () => {
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          age: formData.age ? parseInt(formData.age) : null,
          education_level: formData.education_level || null,
          domain_of_interest: formData.domain_of_interest.trim() || null,
          skills: formData.skills.trim() || null,
          previous_projects: formData.previous_projects.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.profile);
        setIsEditing(false);
        setShowSkillInput(false);
        setNewSkill('');
        setShowProjectInput(false);
        setNewProject('');
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        age: profile.age?.toString() || '',
        education_level: profile.education_level || '',
        domain_of_interest: profile.domain_of_interest || '',
        skills: profile.skills || '',
        previous_projects: profile.previous_projects || ''
      });
      // Reset skills list
      if (profile.skills) {
        setSkillsList(profile.skills.split(',').map((skill: string) => skill.trim()).filter((skill: string) => skill));
      } else {
        setSkillsList([]);
      }
      // Reset projects list
      if (profile.previous_projects) {
        setProjectsList(profile.previous_projects.split(',').map((project: string) => project.trim()).filter((project: string) => project));
      } else {
        setProjectsList([]);
      }
    }
    setIsEditing(false);
    setShowSkillInput(false);
    setNewSkill('');
    setShowProjectInput(false);
    setNewProject('');
  };

  const addSkill = () => {
    if (newSkill.trim() && !skillsList.includes(newSkill.trim())) {
      setSkillsList(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
      setShowSkillInput(false);
      toast.success('Skill added successfully!');
    } else if (skillsList.includes(newSkill.trim())) {
      toast.error('Skill already exists!');
    } else {
      toast.error('Please enter a valid skill!');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkillsList(prev => prev.filter(skill => skill !== skillToRemove));
    toast.success('Skill removed successfully!');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const addProject = () => {
    if (newProject.trim() && !projectsList.includes(newProject.trim())) {
      setProjectsList(prev => [...prev, newProject.trim()]);
      setNewProject('');
      setShowProjectInput(false);
      toast.success('Project added successfully!');
    } else if (projectsList.includes(newProject.trim())) {
      toast.error('Project already exists!');
    } else {
      toast.error('Please enter a valid project!');
    }
  };

  const removeProject = (projectToRemove: string) => {
    setProjectsList(prev => prev.filter(project => project !== projectToRemove));
    toast.success('Project removed successfully!');
  };

  const handleProjectKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addProject();
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-gray-600 dark:text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your personal information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-gray-200 dark:border-gray-600">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'User'} />
                    <AvatarFallback className="text-2xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {profile?.username || user?.firstName || 'User'}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {profile?.domain_of_interest || 'No domain specified'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {user?.emailAddresses?.[0]?.emailAddress || 'No email'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {profile?.age ? `${profile.age} years old` : 'Age not specified'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {profile?.education_level || 'Education not specified'}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {skillsList.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Skills</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {projectsList.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Projects</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Button */}
            <div className="flex justify-end">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>

            {/* Personal Information */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username *
                    </Label>
                    {isEditing ? (
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Enter your username"
                        className="border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white"
                      />
                    ) : (
                      <div className="text-gray-900 dark:text-white font-medium">
                        {profile?.username || 'Not set'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Age
                    </Label>
                    {isEditing ? (
                      <Input
                        id="age"
                        type="number"
                        min="13"
                        max="120"
                        value={formData.age}
                        onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                        placeholder="Enter your age"
                        className="border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white"
                      />
                    ) : (
                      <div className="text-gray-900 dark:text-white">
                        {profile?.age ? `${profile.age} years old` : 'Not specified'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="education" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Education Level
                    </Label>
                    {isEditing ? (
                      <Select
                        value={formData.education_level}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, education_level: value }))}
                      >
                        <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white">
                          <SelectValue placeholder="Select education level" />
                        </SelectTrigger>
                        <SelectContent>
                          {educationLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-gray-900 dark:text-white">
                        {profile?.education_level || 'Not specified'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="domain" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Domain of Interest
                    </Label>
                    {isEditing ? (
                      <Input
                        id="domain"
                        value={formData.domain_of_interest}
                        onChange={(e) => setFormData(prev => ({ ...prev, domain_of_interest: e.target.value }))}
                        placeholder="e.g., Web Development, AI/ML, Data Science"
                        className="border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white"
                      />
                    ) : (
                      <div className="text-gray-900 dark:text-white">
                        {profile?.domain_of_interest || 'Not specified'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Technical Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Skills Display */}
                    <div className="flex flex-wrap gap-2">
                      {skillsList.map((skill, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 pr-2"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-2 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    {/* Add Skill Input */}
                    {showSkillInput ? (
                      <div className="flex space-x-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Enter a skill"
                          className="flex-1 border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white"
                          autoFocus
                        />
                        <Button
                          onClick={addSkill}
                          size="sm"
                          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                        >
                          Add
                        </Button>
                        <Button
                          onClick={() => {
                            setShowSkillInput(false);
                            setNewSkill('');
                          }}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 dark:border-gray-600"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowSkillInput(true)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Skill
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    {skillsList.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skillsList.map((skill, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary" 
                            className="bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No skills specified</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Previous Projects */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Previous Projects & Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Projects Display */}
                    <div className="space-y-3">
                      {projectsList.map((project, index) => (
                        <div 
                          key={index} 
                          className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-start justify-between"
                        >
                          <div className="flex items-start space-x-2 flex-1">
                            <Award className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                              {project}
                            </p>
                          </div>
                          <button
                            onClick={() => removeProject(project)}
                            className="ml-2 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Project Input */}
                    {showProjectInput ? (
                      <div className="flex space-x-2">
                        <Input
                          value={newProject}
                          onChange={(e) => setNewProject(e.target.value)}
                          onKeyPress={handleProjectKeyPress}
                          placeholder="Enter a project or experience"
                          className="flex-1 border-gray-300 dark:border-gray-600 focus:border-gray-900 dark:focus:border-white"
                          autoFocus
                        />
                        <Button
                          onClick={addProject}
                          size="sm"
                          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                        >
                          Add
                        </Button>
                        <Button
                          onClick={() => {
                            setShowProjectInput(false);
                            setNewProject('');
                          }}
                          variant="outline"
                          size="sm"
                          className="border-gray-300 dark:border-gray-600"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowProjectInput(true)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Project
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    {projectsList.length > 0 ? (
                      <div className="space-y-3">
                        {projectsList.map((project, index) => (
                          <div 
                            key={index} 
                            className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                          >
                            <div className="flex items-start space-x-2">
                              <Award className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-gray-700 dark:text-gray-300 text-sm">
                                {project}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No previous projects or experience specified</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Stats */}
            {profile && (
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Profile Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Member Since</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Last Updated</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {profile.education_level ? '✓' : '○'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Profile Complete</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {skillsList.length}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Skills Listed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 