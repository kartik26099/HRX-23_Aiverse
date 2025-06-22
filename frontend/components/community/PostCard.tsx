"use client"

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ReactionBar } from './ReactionBar';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    type: string;
    created_at: string;
    is_anonymous: boolean;
    user?: {
      username?: string;
      avatar_url?: string;
    };
    tags?: { name: string }[];
    reactions?: { type: string; count: number }[];
    commentCount?: number;
  };
  onReport?: () => void;
  onReact?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onReport, onReact }) => {
  const reactionCount = post.reactions?.find(r => r.type === 'like')?.count || 0;

  return (
    <div className="bg-card rounded p-4 shadow flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <div className="flex items-center gap-2">
          {post.is_anonymous ? (
            <span className="italic">Anonymous</span>
          ) : (
            <>
              {post.user?.avatar_url && (
                <img src={post.user.avatar_url} alt="avatar" className="w-6 h-6 rounded-full" />
              )}
              <span>{post.user?.username || 'User'}</span>
            </>
          )}
          <span className="mx-2">•</span>
          <span>{new Date(post.created_at).toLocaleString()}</span>
        </div>
        <span className="capitalize px-2 py-1 rounded bg-muted text-xs">{post.type}</span>
      </div>
      
      <Link href={`/community/${post.id}`} className="block">
        <div className="mb-2 whitespace-pre-line cursor-pointer hover:bg-muted/50 rounded p-2 -m-2 transition-colors">
          {post.content}
        </div>
      </Link>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {post.tags?.map((tag) => (
          <span key={tag.name} className="bg-accent text-xs px-2 py-1 rounded">#{tag.name}</span>
        ))}
      </div>
      
      <div className="flex items-center gap-4 text-sm">
        <Link href={`/community/${post.id}`} className="hover:underline">
          {post.commentCount ?? 0} Comments
        </Link>
        <ReactionBar
          initialCount={reactionCount}
          reacted={false} // TODO: Check if user has reacted
          onReact={onReact || (() => {})}
        />
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onReport}>
          Report
        </Button>
      </div>
    </div>
  );
}; 