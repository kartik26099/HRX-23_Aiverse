-- AI Collab Connector Database Schema
-- This schema supports the 3-part collaboration system: Profile, Find Collaborator, and Team Chat

-- Drop old tables if they exist (CAUTION: this deletes all data!)
DROP TABLE IF EXISTS collab_chat_messages CASCADE;
DROP TABLE IF EXISTS collab_teams CASCADE;
DROP TABLE IF EXISTS collab_requests CASCADE;
DROP TABLE IF EXISTS collab_profiles CASCADE;
DROP TABLE IF EXISTS collab_preferences CASCADE;

-- 1. User Profiles Table (replaces collab_preferences)
CREATE TABLE IF NOT EXISTS collab_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    project_name TEXT NOT NULL,
    skills TEXT NOT NULL,
    hours_per_week INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Collaboration Requests Table
CREATE TABLE IF NOT EXISTS collab_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_clerk_id TEXT NOT NULL,
    requester_username TEXT NOT NULL,
    project_name TEXT NOT NULL,
    required_skills TEXT NOT NULL,
    required_hours INTEGER DEFAULT 10,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'completed')),
    matched_with_clerk_id TEXT,
    matched_with_username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Teams Table
CREATE TABLE IF NOT EXISTS collab_teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_name TEXT NOT NULL,
    member1_clerk_id TEXT NOT NULL,
    member1_username TEXT NOT NULL,
    member2_clerk_id TEXT NOT NULL,
    member2_username TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Chat Messages Table
CREATE TABLE IF NOT EXISTS collab_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES collab_teams(id) ON DELETE CASCADE,
    sender_clerk_id TEXT NOT NULL,
    sender_username TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collab_profiles_clerk_id ON collab_profiles(clerk_id);
CREATE INDEX IF NOT EXISTS idx_collab_requests_requester ON collab_requests(requester_clerk_id);
CREATE INDEX IF NOT EXISTS idx_collab_requests_status ON collab_requests(status);
CREATE INDEX IF NOT EXISTS idx_collab_teams_member1 ON collab_teams(member1_clerk_id);
CREATE INDEX IF NOT EXISTS idx_collab_teams_member2 ON collab_teams(member2_clerk_id);
CREATE INDEX IF NOT EXISTS idx_collab_chat_messages_team_id ON collab_chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_collab_chat_messages_created_at ON collab_chat_messages(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE collab_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON collab_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON collab_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = clerk_id);

CREATE POLICY "Users can update their own profile" ON collab_profiles
    FOR UPDATE USING (auth.uid()::text = clerk_id);

-- Requests policies
CREATE POLICY "Users can view all requests" ON collab_requests
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own requests" ON collab_requests
    FOR INSERT WITH CHECK (auth.uid()::text = requester_clerk_id);

CREATE POLICY "Users can update their own requests" ON collab_requests
    FOR UPDATE USING (auth.uid()::text = requester_clerk_id);

-- Teams policies
CREATE POLICY "Team members can view their teams" ON collab_teams
    FOR SELECT USING (
        auth.uid()::text = member1_clerk_id OR 
        auth.uid()::text = member2_clerk_id
    );

CREATE POLICY "Users can insert teams they're part of" ON collab_teams
    FOR INSERT WITH CHECK (
        auth.uid()::text = member1_clerk_id OR 
        auth.uid()::text = member2_clerk_id
    );

-- Chat messages policies
CREATE POLICY "Team members can view chat messages" ON collab_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collab_teams 
            WHERE id = team_id 
            AND (member1_clerk_id = auth.uid()::text OR member2_clerk_id = auth.uid()::text)
        )
    );

CREATE POLICY "Team members can insert chat messages" ON collab_chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM collab_teams 
            WHERE id = team_id 
            AND (member1_clerk_id = auth.uid()::text OR member2_clerk_id = auth.uid()::text)
        )
    );

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_collab_profiles_updated_at 
    BEFORE UPDATE ON collab_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collab_requests_updated_at 
    BEFORE UPDATE ON collab_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO collab_profiles (clerk_id, username, project_name, skills, hours_per_week) VALUES
-- ('user_test1', 'Alice', 'AI Chat App', 'React, TypeScript, OpenAI', 15),
-- ('user_test2', 'Bob', 'E-commerce Platform', 'Node.js, PostgreSQL, Stripe', 20),
-- ('user_test3', 'Charlie', 'Mobile Game', 'Unity, C#, Game Design', 25); 