"use client"

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CommentList } from '@/components/community/CommentList';
import { ReactionBar } from '@/components/community/ReactionBar';
import { ReportModal } from '@/components/community/ReportModal';
import { supabase } from '@/lib/supabaseClient';
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

interface Comment {
  id: string;
  content: string;
  created_at: string;
  is_anonymous: boolean;
  user_username?: string;
  user_avatar_url?: string;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { supabaseUser, loading: userLoading, isSignedIn } = useSupabaseUser();
  const postId = params.postId as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingType, setReportingType] = useState<'post' | 'comment'>('post');
  const [reportingId, setReportingId] = useState<string | null>(null);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase.rpc('get_posts_with_details', {
        p_limit: 1,
        p_offset: 0,
        p_tag_filter: null
      });
      
      if (error) throw error;
      const postData = data?.find(p => p.id === postId);
      if (!postData) {
        router.push('/community');
        return;
      }
      setPost(postData);
    } catch (error) {
      console.error('Error fetching post:', error);
      router.push('/community');
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          is_anonymous,
          users!comments_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data?.map(c => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        is_anonymous: c.is_anonymous,
        user_username: c.users?.username,
        user_avatar_url: c.users?.avatar_url,
      })) || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPost(), fetchComments()]);
      setLoading(false);
    };
    loadData();
  }, [postId]);

  const handleAddComment = async (content: string, isAnonymous: boolean) => {
    if (!isSignedIn) {
      alert('Please sign in to add a comment');
      return;
    }

    if (!supabaseUser) {
      alert('User profile not ready. Please try again.');
      return;
    }

    try {
      // Try API route first
      console.log('Attempting to add comment via API:', {
        post_id: postId,
        content,
        is_anonymous: isAnonymous,
      });

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
          content,
          is_anonymous: isAnonymous,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Comment added successfully via API:', result);
        await fetchComments(); // Refresh comments
        return;
      }

      // If API fails, try direct Supabase call
      console.log('API failed, trying direct Supabase call...');
      
      const { data, error } = await supabase.from('comments').insert([
        {
          post_id: postId,
          content,
          is_anonymous: isAnonymous,
          user_id: supabaseUser.id,
        }
      ]).select();
      
      if (error) {
        console.error('Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Handle specific error cases
        if (error.code === '42501') {
          alert('Permission denied. Please run the SQL script to disable RLS temporarily.');
        } else if (error.code === '23503') {
          alert('Invalid post or user reference. Please refresh the page and try again.');
        } else if (error.code === '23505') {
          alert('Duplicate comment detected. Please try again.');
        } else {
          alert(`Failed to add comment: ${error.message || error.details || 'Unknown error'}`);
        }
        return;
      }

      console.log('Comment added successfully via direct call:', data);
      await fetchComments(); // Refresh comments
    } catch (error: any) {
      console.error('Error adding comment:', error);
      alert(`Failed to add comment: ${error.message || 'Network error'}`);
    }
  };

  const handleReaction = async () => {
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
      await fetchPost(); // Refresh post data
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleReport = (type: 'post' | 'comment', id: string) => {
    setReportingType(type);
    setReportingId(id);
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (reason: string) => {
    if (!reportingId) return;
    
    try {
      const reportData = reportingType === 'post' 
        ? { post_id: reportingId, reason }
        : { comment_id: reportingId, reason };

      const { error } = await supabase.from('reports').insert([reportData]);
      
      if (error) throw error;
      alert('Report submitted successfully');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-2 py-6 max-w-4xl">
        <div className="text-center py-8">Loading post...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-2 py-6 max-w-4xl">
        <div className="text-center py-8">Post not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-6 max-w-4xl">
      <div className="mb-4">
        <Button variant="ghost" asChild>
          <Link href="/community">← Back to Community</Link>
        </Button>
      </div>

      {/* Post */}
      <div className="bg-card rounded p-6 shadow mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-2">
            {post.is_anonymous ? (
              <span className="italic">Anonymous</span>
            ) : (
              <>
                {post.user_avatar_url && (
                  <img src={post.user_avatar_url} alt="avatar" className="w-8 h-8 rounded-full" />
                )}
                <span>{post.user_username || 'User'}</span>
              </>
            )}
            <span className="mx-2">•</span>
            <span>{new Date(post.created_at).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="capitalize px-2 py-1 rounded bg-muted text-xs">{post.type}</span>
            <Button variant="ghost" size="sm" onClick={() => handleReport('post', post.id)}>
              Report
            </Button>
          </div>
        </div>
        
        <div className="mb-4 whitespace-pre-line text-lg">{post.content}</div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span key={tag} className="bg-accent text-xs px-2 py-1 rounded">#{tag}</span>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <ReactionBar
            initialCount={post.reaction_count}
            reacted={false} // TODO: Check if user has reacted
            onReact={handleReaction}
          />
          <span className="text-sm text-muted-foreground">
            {post.comment_count} Comments
          </span>
        </div>
      </div>

      {/* Comments */}
      <CommentList
        comments={comments.map(c => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          is_anonymous: c.is_anonymous,
          user: {
            username: c.user_username,
            avatar_url: c.user_avatar_url,
          },
        }))}
        onAddComment={handleAddComment}
      />

      {/* Report Modal */}
      <ReportModal
        open={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setReportingId(null);
        }}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
} 