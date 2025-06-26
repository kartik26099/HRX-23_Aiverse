"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/community/PostCard';
import { TagFilter } from '@/components/community/TagFilter';
import { ReportModal } from '@/components/community/ReportModal';
import { CommunityGuidelines } from '@/components/community/CommunityGuidelines';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, TrendingUp, MessageSquare, Heart, Sparkles, Globe, Award, Activity } from 'lucide-react';
import { useSupabaseUser } from '@/hooks/use-supabase-user';

interface Post {
  id: string;
  content: string;
  type: string;
  created_at: string;
  is_anonymous: boolean;
  user_username?: string;
  user_avatar_url?: string;
  reaction_count: number;
  comment_count: number;
  tags: string[];
}

interface TrendingPost {
  id: string;
  content: string;
  type: string;
  reaction_count: number;
  comment_count: number;
}

interface ActiveUser {
  id: string;
  username: string;
  avatar_url?: string;
  post_count: number;
  comment_count: number;
}

export default function CommunityPage() {
  const { supabaseUser, isSignedIn } = useSupabaseUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  const fetchPosts = async (tagFilter?: string | null) => {
    try {
      let query = supabase.rpc('get_posts_with_details', {
        p_limit: 20,
        p_offset: 0,
        p_tag_filter: tagFilter
      });

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchTrendingPosts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_trending_posts', { p_limit: 5 });
      if (error) throw error;
      setTrendingPosts(data || []);
    } catch (error) {
      console.error('Error fetching trending posts:', error);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_most_active_users', { p_limit: 5 });
      if (error) throw error;
      setActiveUsers(data || []);
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPosts(selectedTag),
        fetchTrendingPosts(),
        fetchActiveUsers()
      ]);
      setLoading(false);
    };
    loadData();
  }, [selectedTag]);

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag);
  };

  const handleReport = (postId: string) => {
    setReportingPostId(postId);
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (reason: string) => {
    if (!reportingPostId) return;
    
    if (!isSignedIn) {
      alert('Please sign in to report posts');
      return;
    }

    if (!supabaseUser) {
      alert('User profile not ready. Please try again.');
      return;
    }
    
    try {
      const { error } = await supabase.from('reports').insert([
        {
          post_id: reportingPostId,
          reason,
          user_id: supabaseUser.id,
        }
      ]);
      
      if (error) throw error;
      alert('Report submitted successfully');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report');
    }
  };

  const handleReaction = async (postId: string) => {
    if (!isSignedIn) {
      alert('Please sign in to react to posts');
      return;
    }

    if (!supabaseUser) {
      alert('User profile not ready. Please try again.');
      return;
    }

    try {
      const { error } = await supabase.from('reactions').insert([
        {
          post_id: postId,
          type: 'like',
          user_id: supabaseUser.id,
        }
      ]);
      
      if (error) throw error;
      await fetchPosts(selectedTag); // Refresh posts
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50/30 to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Community Hub
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
                Connect, share, and learn with fellow learners
              </p>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed">
              Join our vibrant community of learners. Share your projects, ask questions, and discover amazing content from fellow students and developers.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                  <MessageSquare className="h-6 w-6 text-emerald-600" />
                  <span>Community Feed</span>
                </h2>
                {selectedTag && (
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
                    {selectedTag}
                  </Badge>
                )}
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setGuidelinesOpen(true)}
                  className="border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <Award className="mr-2 h-4 w-4" />
                  Guidelines
                </Button>
                <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/community/new" className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Share a Post</span>
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Tag Filter */}
            <div className="mb-6">
              <TagFilter selectedTag={selectedTag} onSelect={handleTagSelect} />
            </div>
            
            {/* Feed */}
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                      No posts found
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Be the first to share something amazing with the community!
                    </p>
                    <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <Link href="/community/new" className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Create First Post</span>
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={{
                      id: post.id,
                      content: post.content,
                      type: post.type,
                      created_at: post.created_at,
                      is_anonymous: post.is_anonymous,
                      user: {
                        username: post.user_username,
                        avatar_url: post.user_avatar_url,
                      },
                      tags: post.tags.map(name => ({ name })),
                      reactions: [{ type: 'like', count: post.reaction_count }],
                      commentCount: post.comment_count,
                    }}
                    onReport={() => handleReport(post.id)}
                    onReact={() => handleReaction(post.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Posts */}
            <Card className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                <CardTitle className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <span>Trending Posts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {trendingPosts.map((post, index) => (
                    <div key={post.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                          {post.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 mb-2">
                        {post.content}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-3 w-3" />
                          <span>{post.reaction_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{post.comment_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Users */}
            <Card className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <CardTitle className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Most Active Users</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {activeUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="relative">
                        <Avatar className="w-10 h-10 border-2 border-slate-200 dark:border-slate-600">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {user.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                          {user.username}
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-500">
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{user.post_count} posts</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-3 w-3" />
                            <span>{user.comment_count} comments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <CardTitle className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <Globe className="h-5 w-5 text-green-600" />
                  <span>Community Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Total Members</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">1,234</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Total Posts</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">5,678</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">Total Reactions</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">12,345</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modals */}
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          onSubmit={handleReportSubmit}
        />
        <CommunityGuidelines
          isOpen={guidelinesOpen}
          onClose={() => setGuidelinesOpen(false)}
        />
      </div>
    </div>
  );
} 