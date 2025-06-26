-- Check if userinfo table exists and show its structure
-- Run this in your Supabase SQL Editor

-- Check if table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'userinfo' 
AND table_schema = 'public';

-- If table exists, show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'userinfo' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if table has any data
SELECT 
    'userinfo' as table_name,
    COUNT(*) as row_count
FROM userinfo;

-- Show sample data (if any exists)
SELECT * FROM userinfo LIMIT 5;

-- If table doesn't exist, create it
-- Uncomment the following if the table doesn't exist:

/*
CREATE TABLE userinfo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT UNIQUE NOT NULL,
    username TEXT,
    age INTEGER,
    education_level TEXT,
    domain_interest TEXT,
    previous_projects TEXT[],
    skills TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE userinfo ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON userinfo 
FOR SELECT USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own profile" ON userinfo 
FOR INSERT WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile" ON userinfo 
FOR UPDATE USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own profile" ON userinfo 
FOR DELETE USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
*/ 