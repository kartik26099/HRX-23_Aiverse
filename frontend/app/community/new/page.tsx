"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { SignInButton } from '@clerk/nextjs';
import { useSupabaseUser } from '@/hooks/use-supabase-user';

const POST_TYPES = [
  { label: 'Post', value: 'post' },
  { label: 'Question', value: 'question' },
  { label: 'Experience', value: 'experience' },
];

export default function NewPostPage() {
  const router = useRouter();
  const { supabaseUser, loading: userLoading, isSignedIn } = useSupabaseUser();
  const [content, setContent] = useState('');
  const [type, setType] = useState('post');
  const [tags, setTags] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      alert('Please sign in to create a post');
      return;
    }

    if (!supabaseUser) {
      alert('User profile not ready. Please try again.');
      return;
    }

    setLoading(true);
    setError('');
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    
    try {
      const postData = {
        content,
        type,
        is_anonymous: isAnonymous,
        user_id: supabaseUser.id,
      };
      
      console.log('Attempting to create post with data:', postData);
      
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();
      
      if (postError) {
        console.error('Post creation error:', postError);
        console.error('Error details:', {
          code: postError.code,
          message: postError.message,
          details: postError.details,
          hint: postError.hint
        });
        setError(`Post creation failed: ${postError.message || postError.details || 'Unknown error'}`);
        return;
      }
      
      console.log('Post created successfully:', post);
      
      // Insert tags if any
      if (tagList.length > 0) {
        for (const tagName of tagList) {
          try {
            // Upsert tag
            const { data: tag, error: tagError } = await supabase
              .from('tags')
              .upsert([{ name: tagName }], { onConflict: ['name'] })
              .select()
              .single();
            
            if (tagError) {
              console.error('Tag creation error:', tagError);
              continue; // Skip this tag but continue with others
            }
            
            // Link post and tag
            const { error: linkError } = await supabase
              .from('post_tags')
              .insert([{ post_id: post.id, tag_id: tag.id }]);
            
            if (linkError) {
              console.error('Post-tag link error:', linkError);
            }
          } catch (tagErr) {
            console.error('Error processing tag:', tagName, tagErr);
          }
        }
      }
      
      router.push('/community');
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="max-w-xl mx-auto py-8 px-2">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Sign in to Create a Post</h1>
          <p className="text-muted-foreground">You need to be signed in to share with the community.</p>
          <SignInButton mode="modal">
            <Button>Sign In</Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-2">
      <h1 className="text-2xl font-bold mb-4">Share Something with the Community</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded shadow">
        <div>
          <label className="block font-medium mb-1">Type</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {POST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Content</label>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[100px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="What's on your mind?"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Tags (comma separated)</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. AI, Learning, Python"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          <label htmlFor="anonymous" className="text-sm">Post Anonymously</label>
        </div>
        {error && (
          <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}
        <Button type="submit" disabled={loading || !supabaseUser || userLoading} className="w-full">
          {loading ? 'Posting...' : 'Post'}
        </Button>
      </form>
    </div>
  );
} 