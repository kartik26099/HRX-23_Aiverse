"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/community/PostCard';
import { TagFilter } from '@/components/community/TagFilter';
import { ReportModal } from '@/components/community/ReportModal';
import { CommunityGuidelines } from '@/components/community/CommunityGuidelines';
import { supabase } from '@/lib/supabaseClient';

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
    
    try {
      const { error } = await supabase.from('reports').insert([
        {
          post_id: reportingPostId,
          reason,
          // user_id will be set by RLS
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
    try {
      const { error } = await supabase.from('reactions').insert([
        {
          post_id: postId,
          type: 'like',
          // user_id will be set by RLS
        }
      ]);
      
      if (error) throw error;
      await fetchPosts(selectedTag); // Refresh posts
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  return (
    <div className="container mx-auto px-2 py-6 max-w-5xl">
      <div className="flex flex-col md:flex-row md:space-x-8">
        {/* Main Feed */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Community</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setGuidelinesOpen(true)}>
                Guidelines
              </Button>
              <Button asChild>
                <Link href="/community/new">Share a Post</Link>
              </Button>
            </div>
          </div>
          
          {/* Tag Filter */}
          <div className="mb-4">
            <TagFilter selectedTag={selectedTag} onSelect={handleTagSelect} />
          </div>
          
          {/* Feed */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No posts found. Be the first to share something!
              </div>
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
        
        {/* Trending/Sidebar */}
        <aside className="w-full md:w-72 mt-8 md:mt-0">
          <div className="bg-muted rounded p-4 mb-4">
            <h2 className="font-semibold mb-2">Trending Discussions</h2>
            {trendingPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trending posts yet</p>
            ) : (
              <ul className="text-sm space-y-2">
                {trendingPosts.map((post) => (
                  <li key={post.id}>
                    <Link href={`/community/${post.id}`} className="hover:underline block">
                      <div className="font-medium line-clamp-2">{post.content}</div>
                      <div className="text-xs text-muted-foreground">
                        {post.reaction_count + post.comment_count} interactions
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="bg-muted rounded p-4">
            <h2 className="font-semibold mb-2">Most Active Users</h2>
            {activeUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active users yet</p>
            ) : (
              <ul className="text-sm space-y-2">
                {activeUsers.map((user) => (
                  <li key={user.id} className="flex items-center gap-2">
                    {user.avatar_url && (
                      <img src={user.avatar_url} alt="avatar" className="w-6 h-6 rounded-full" />
                    )}
                    <span className="font-medium">{user.username}</span>
                    <span className="text-xs text-muted-foreground">
                      ({user.post_count + user.comment_count} activities)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
      
      {/* Report Modal */}
      <ReportModal
        open={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setReportingPostId(null);
        }}
        onSubmit={handleReportSubmit}
      />
      
      {/* Community Guidelines */}
      <CommunityGuidelines
        open={guidelinesOpen}
        onClose={() => setGuidelinesOpen(false)}
      />
    </div>
  );
} 