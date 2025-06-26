-- Temporary script to disable RLS for testing
-- Run this in your Supabase SQL editor to temporarily disable RLS

-- Disable RLS on userinfo table for testing
ALTER TABLE userinfo DISABLE ROW LEVEL SECURITY;

-- Disable RLS on comments table for testing
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on posts table for testing
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Disable RLS on users table for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on reactions table for testing
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('userinfo', 'comments', 'posts', 'users', 'reactions')
AND schemaname = 'public';

-- Note: Remember to re-enable RLS and set up proper policies for production
-- To re-enable: ALTER TABLE userinfo ENABLE ROW LEVEL SECURITY; 