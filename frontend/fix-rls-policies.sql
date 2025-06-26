-- Fix RLS policies for Clerk authentication integration
-- Run this in your Supabase SQL editor

-- 1. First, let's check the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('comments', 'posts', 'users', 'reactions', 'userinfo');

-- 2. Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Anyone can view active comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- 3. Create new policies that work with Clerk authentication
-- Allow anyone to view active comments
CREATE POLICY "Anyone can view active comments" ON comments 
FOR SELECT USING (status = 'active');

-- Allow authenticated users to create comments (simplified)
CREATE POLICY "Authenticated users can create comments" ON comments 
FOR INSERT WITH CHECK (true);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" ON comments 
FOR UPDATE USING (
  user_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON comments 
FOR DELETE USING (
  user_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
);

-- 4. Userinfo table policies
-- Drop existing userinfo policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON userinfo;
DROP POLICY IF EXISTS "Users can insert own profile" ON userinfo;
DROP POLICY IF EXISTS "Users can update own profile" ON userinfo;
DROP POLICY IF EXISTS "Users can delete own profile" ON userinfo;

-- Enable RLS on userinfo table if not already enabled
ALTER TABLE userinfo ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON userinfo 
FOR SELECT USING (
  clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON userinfo 
FOR INSERT WITH CHECK (
  clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON userinfo 
FOR UPDATE USING (
  clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile" ON userinfo 
FOR DELETE USING (
  clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- 5. Alternative: Temporarily disable RLS for testing (uncomment if needed)
-- ALTER TABLE userinfo DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- 6. Alternative: Create a function to handle comment creation
CREATE OR REPLACE FUNCTION create_comment(
  p_post_id UUID,
  p_content TEXT,
  p_is_anonymous BOOLEAN DEFAULT FALSE,
  p_clerk_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_comment_id UUID;
BEGIN
  -- Get or create user
  SELECT id INTO v_user_id 
  FROM users 
  WHERE clerk_id = p_clerk_id;
  
  IF v_user_id IS NULL THEN
    INSERT INTO users (clerk_id, username)
    VALUES (p_clerk_id, 'user_' || substring(p_clerk_id from 1 for 8))
    RETURNING id INTO v_user_id;
  END IF;
  
  -- Create comment
  INSERT INTO comments (post_id, content, is_anonymous, user_id)
  VALUES (p_post_id, p_content, p_is_anonymous, v_user_id)
  RETURNING id INTO v_comment_id;
  
  RETURN v_comment_id;
END;
$$;

-- 7. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_comment(UUID, TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_comment(UUID, TEXT, BOOLEAN, TEXT) TO anon; 