"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const POST_TYPES = [
  { label: 'Post', value: 'post' },
  { label: 'Question', value: 'question' },
  { label: 'Experience', value: 'experience' },
];

const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000000';

export default function NewPostPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [type, setType] = useState('post');
  const [tags, setTags] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create dummy user for testing
  useEffect(() => {
    const createDummyUser = async () => {
      try {
        // First, test if we can connect to the database
        console.log('Testing database connection...');
        const { data: testData, error: testError } = await supabase
          .from('posts')
          .select('count')
          .limit(1);
        
        if (testError) {
          console.error('Database connection test failed:', testError);
          setError(`Database connection failed: ${testError.message}`);
          return;
        }
        
        console.log('Database connection successful');
        
        // Check if dummy user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', DUMMY_USER_ID)
          .single();

        if (!existingUser) {
          // Create dummy user
          await supabase
            .from('users')
            .insert([
              {
                id: DUMMY_USER_ID,
                clerk_id: 'dummy_clerk_id',
                username: 'TestUser',
              }
            ]);
          console.log('Dummy user created for testing');
        }
      } catch (error) {
        console.log('Dummy user already exists or error creating:', error);
      }
    };

    createDummyUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    
    try {
      // For testing purposes, we'll create a post with a dummy user_id
      // This bypasses the authentication requirement temporarily
      const postData = {
        content,
        type,
        is_anonymous: isAnonymous,
        user_id: DUMMY_USER_ID, // Dummy UUID for testing
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
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Posting...' : 'Post'}
        </Button>
      </form>
    </div>
  );
} 