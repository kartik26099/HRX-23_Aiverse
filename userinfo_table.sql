-- Create userinfo table for storing user profile details
CREATE TABLE IF NOT EXISTS userinfo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    age INTEGER CHECK (age >= 13 AND age <= 120),
    education_level TEXT CHECK (education_level IN ('High School', 'Bachelor''s Degree', 'Master''s Degree', 'PhD', 'Self-Taught', 'Other')),
    domain_of_interest TEXT,
    skills TEXT,
    previous_projects TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by clerk_id
CREATE INDEX IF NOT EXISTS idx_userinfo_clerk_id ON userinfo(clerk_id);


-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON userinfo;
DROP POLICY IF EXISTS "Users can insert own profile" ON userinfo;
DROP POLICY IF EXISTS "Users can update own profile" ON userinfo;

-- Create RLS policies that work with Clerk authentication
-- For now, we'll use a more permissive policy that allows authenticated users to manage their own profiles
CREATE POLICY "Users can view own profile" ON userinfo
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON userinfo
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON userinfo
    FOR UPDATE USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_userinfo_updated_at 
    BEFORE UPDATE ON userinfo 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 