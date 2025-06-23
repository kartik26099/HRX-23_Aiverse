-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (for additional profile info beyond Clerk)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  type TEXT DEFAULT 'post' CHECK (type IN ('post', 'question', 'experience')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'flagged')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'flagged')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Reactions table (for likes, upvotes, etc.)
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, user_id, type)
);

-- 5. Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Post_Tags table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (post_id, tag_id)
);

-- 7. Reports table (for reporting inappropriate content)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_reports_post_id ON reports(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_comment_id ON reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- 9. Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::text = clerk_id);

-- Posts policies
CREATE POLICY "Anyone can view active posts" ON posts FOR SELECT USING (status = 'active');
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = posts.user_id));
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = posts.user_id));

-- Comments policies
CREATE POLICY "Anyone can view active comments" ON comments FOR SELECT USING (status = 'active');
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = comments.user_id));
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = comments.user_id));

-- Reactions policies
CREATE POLICY "Anyone can view reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reactions" ON reactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own reactions" ON reactions FOR DELETE USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = reactions.user_id));

-- Tags policies
CREATE POLICY "Anyone can view tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tags" ON tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Post_tags policies
CREATE POLICY "Anyone can view post tags" ON post_tags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create post tags" ON post_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reports policies
CREATE POLICY "Anyone can view reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reports" ON reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 10. Functions for common operations
-- Function to get post with user info and reaction counts
CREATE OR REPLACE FUNCTION get_posts_with_details(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_tag_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  type TEXT,
  is_anonymous BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  user_username TEXT,
  user_avatar_url TEXT,
  reaction_count BIGINT,
  comment_count BIGINT,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.content,
    p.type,
    p.is_anonymous,
    p.created_at,
    u.username,
    u.avatar_url,
    COALESCE(r.reaction_count, 0) as reaction_count,
    COALESCE(c.comment_count, 0) as comment_count,
    COALESCE(t.tags, ARRAY[]::TEXT[]) as tags
  FROM posts p
  LEFT JOIN users u ON p.user_id = u.id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as reaction_count
    FROM reactions
    GROUP BY post_id
  ) r ON p.id = r.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as comment_count
    FROM comments
    WHERE status = 'active'
    GROUP BY post_id
  ) c ON p.id = c.post_id
  LEFT JOIN (
    SELECT pt.post_id, ARRAY_AGG(t.name) as tags
    FROM post_tags pt
    JOIN tags t ON pt.tag_id = t.id
    GROUP BY pt.post_id
  ) t ON p.id = t.post_id
  WHERE p.status = 'active'
    AND (p_tag_filter IS NULL OR p_tag_filter = ANY(t.tags))
  ORDER BY p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending posts
CREATE OR REPLACE FUNCTION get_trending_posts(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  content TEXT,
  type TEXT,
  reaction_count BIGINT,
  comment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.content,
    p.type,
    COALESCE(r.reaction_count, 0) as reaction_count,
    COALESCE(c.comment_count, 0) as comment_count
  FROM posts p
  LEFT JOIN (
    SELECT post_id, COUNT(*) as reaction_count
    FROM reactions
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY post_id
  ) r ON p.id = r.post_id
  LEFT JOIN (
    SELECT post_id, COUNT(*) as comment_count
    FROM comments
    WHERE status = 'active' AND created_at > NOW() - INTERVAL '7 days'
    GROUP BY post_id
  ) c ON p.id = c.post_id
  WHERE p.status = 'active'
  ORDER BY (COALESCE(r.reaction_count, 0) + COALESCE(c.comment_count, 0)) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get most active users
CREATE OR REPLACE FUNCTION get_most_active_users(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  username TEXT,
  avatar_url TEXT,
  post_count BIGINT,
  comment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.avatar_url,
    COALESCE(p.post_count, 0) as post_count,
    COALESCE(c.comment_count, 0) as comment_count
  FROM users u
  LEFT JOIN (
    SELECT user_id, COUNT(*) as post_count
    FROM posts
    WHERE status = 'active' AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY user_id
  ) p ON u.id = p.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as comment_count
    FROM comments
    WHERE status = 'active' AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY user_id
  ) c ON u.id = c.user_id
  ORDER BY (COALESCE(p.post_count, 0) + COALESCE(c.comment_count, 0)) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;



ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags DISABLE ROW LEVEL SECURITY;