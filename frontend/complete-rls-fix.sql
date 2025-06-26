-- Complete RLS Fix Script
-- Run this in your Supabase SQL Editor to completely fix RLS issues

-- Step 1: Disable RLS on all relevant tables
ALTER TABLE userinfo DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON userinfo;
DROP POLICY IF EXISTS "Users can insert own profile" ON userinfo;
DROP POLICY IF EXISTS "Users can update own profile" ON userinfo;
DROP POLICY IF EXISTS "Users can delete own profile" ON userinfo;

DROP POLICY IF EXISTS "Anyone can view active comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Step 3: Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS ENABLED' 
        ELSE 'RLS DISABLED' 
    END as status
FROM pg_tables 
WHERE tablename IN ('userinfo', 'comments', 'posts', 'users', 'reactions')
AND schemaname = 'public'
ORDER BY tablename;

-- Step 4: Test query to verify access
-- This should return data without errors
SELECT 
    'userinfo' as table_name,
    COUNT(*) as row_count
FROM userinfo
UNION ALL
SELECT 
    'comments' as table_name,
    COUNT(*) as row_count
FROM comments
UNION ALL
SELECT 
    'posts' as table_name,
    COUNT(*) as row_count
FROM posts
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as row_count
FROM users
UNION ALL
SELECT 
    'reactions' as table_name,
    COUNT(*) as row_count
FROM reactions;

-- Step 5: Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'userinfo' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Note: This script completely disables RLS for development
-- For production, you should re-enable RLS and set up proper policies
-- using the fix-rls-policies.sql script 