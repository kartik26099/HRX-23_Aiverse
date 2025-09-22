-- Fix RLS policies for Clerk authentication
-- Since we're using Clerk instead of Supabase auth, we need to disable RLS for now
-- or create policies that work with the current setup

-- Option 1: Disable RLS temporarily for testing
ALTER TABLE collab_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE collab_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE collab_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE collab_chat_messages DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, use these policies instead:
-- (Uncomment the lines below and comment out the DISABLE lines above)

-- -- Drop existing policies
-- DROP POLICY IF EXISTS "Users can view all profiles" ON collab_profiles;
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON collab_profiles;
-- DROP POLICY IF EXISTS "Users can update their own profile" ON collab_profiles;
-- 
-- DROP POLICY IF EXISTS "Users can view all requests" ON collab_requests;
-- DROP POLICY IF EXISTS "Users can insert their own requests" ON collab_requests;
-- DROP POLICY IF EXISTS "Users can update their own requests" ON collab_requests;
-- 
-- DROP POLICY IF EXISTS "Team members can view their teams" ON collab_teams;
-- DROP POLICY IF EXISTS "Users can insert teams they're part of" ON collab_teams;
-- 
-- DROP POLICY IF EXISTS "Team members can view chat messages" ON collab_chat_messages;
-- DROP POLICY IF EXISTS "Team members can insert chat messages" ON collab_chat_messages;
-- 
-- -- Create new policies that work with Clerk
-- -- For now, allow all operations (you can restrict this later)
-- CREATE POLICY "Allow all operations on profiles" ON collab_profiles
--     FOR ALL USING (true) WITH CHECK (true);
-- 
-- CREATE POLICY "Allow all operations on requests" ON collab_requests
--     FOR ALL USING (true) WITH CHECK (true);
-- 
-- CREATE POLICY "Allow all operations on teams" ON collab_teams
--     FOR ALL USING (true) WITH CHECK (true);
-- 
-- CREATE POLICY "Allow all operations on chat messages" ON collab_chat_messages
--     FOR ALL USING (true) WITH CHECK (true); 