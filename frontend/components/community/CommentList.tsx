import React, { useState } from 'react';
import { SignInButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { useSupabaseUser } from '@/hooks/use-supabase-user';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  is_anonymous: boolean;
  user?: {
    username?: string;
    avatar_url?: string;
  };
}

interface CommentListProps {
  comments: Comment[];
  onAddComment: (content: string, isAnonymous: boolean) => void;
}

export const CommentList: React.FC<CommentListProps> = ({ comments, onAddComment }) => {
  const { isSignedIn } = useSupabaseUser();
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      alert('Please sign in to add a comment');
      return;
    }
    setLoading(true);
    await onAddComment(content, isAnonymous);
    setContent('');
    setIsAnonymous(false);
    setLoading(false);
  };

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-2">Comments</h3>
      
      {!isSignedIn ? (
        <div className="mb-4 p-4 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-3">Sign in to add a comment</p>
          <SignInButton mode="modal">
            <Button size="sm">Sign In</Button>
          </SignInButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[60px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder="Add a comment..."
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="comment-anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            <label htmlFor="comment-anonymous" className="text-sm">Comment Anonymously</label>
            <button type="submit" className="ml-auto px-4 py-1 rounded bg-primary text-white" disabled={loading}>
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      )}
      
      <div className="space-y-4">
        {comments.length === 0 && <div className="text-muted-foreground text-sm">No comments yet.</div>}
        {comments.map((comment) => (
          <div key={comment.id} className="bg-muted rounded p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              {comment.is_anonymous ? (
                <span className="italic">Anonymous</span>
              ) : (
                <>
                  {comment.user?.avatar_url && (
                    <img src={comment.user.avatar_url} alt="avatar" className="w-5 h-5 rounded-full" />
                  )}
                  <span>{comment.user?.username || 'User'}</span>
                </>
              )}
              <span className="mx-2">•</span>
              <span>{new Date(comment.created_at).toLocaleString()}</span>
            </div>
            <div>{comment.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}; 