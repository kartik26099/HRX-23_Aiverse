# Profile System Setup Guide

This guide will help you set up the new profile system for your EduAI platform.

## 🗄️ Database Setup

### 1. Create the userinfo table in Supabase

Run the following SQL query in your Supabase SQL editor:

```sql
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

-- Enable Row Level Security (RLS)
ALTER TABLE userinfo ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only read and update their own profile
CREATE POLICY "Users can view own profile" ON userinfo
    FOR SELECT USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own profile" ON userinfo
    FOR INSERT WITH CHECK (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile" ON userinfo
    FOR UPDATE USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

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
```

## 🔧 Environment Configuration

Make sure your `.env.local` file has the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 🚀 Features Implemented

### ✅ Profile Page (`/profile`)
- Beautiful UI that matches your existing theme
- Editable profile fields:
  - Username (required)
  - Age (optional, 13-120)
  - Education Level (dropdown selection)
  - Domain of Interest (free text)
  - Skills (textarea with badge display for comma-separated skills)
  - Previous Projects/Experience (textarea)
- Real-time form validation
- Success/error notifications
- Profile completion indicator
- Member since and last updated timestamps
- Skills count in profile stats

### ✅ API Routes
- `GET /api/profile` - Fetch user profile
- `PUT /api/profile` - Create or update user profile
- Proper authentication with Clerk
- Row Level Security (RLS) policies

### ✅ Navigation Integration
- Profile link added to header (desktop and mobile)
- Automatic redirect to profile page after login
- Responsive design

### ✅ Database Features
- UUID primary keys
- Automatic timestamps
- Data validation constraints
- Indexed for performance
- RLS policies for security

## 🎨 UI Features

### Design Elements
- Gradient backgrounds matching your theme
- Glassmorphism effects with backdrop blur
- Smooth animations and transitions
- Responsive grid layouts
- Icon integration with Lucide React
- Dark mode support

### User Experience
- Loading states with spinners
- Form validation with error messages
- Success notifications
- Edit/Cancel/Save workflow
- Profile completion tracking
- Avatar display with fallbacks

## 🔒 Security Features

- Clerk authentication integration
- Row Level Security (RLS) policies
- User can only access their own profile
- Input validation and sanitization
- Secure API endpoints

## 📱 Responsive Design

- Mobile-first approach
- Responsive grid layouts
- Touch-friendly interface
- Optimized for all screen sizes
- Mobile navigation integration

## 🚀 Getting Started

1. **Run the SQL query** in your Supabase dashboard
2. **Install dependencies** (if not already done):
   ```bash
   cd frontend
   npm install sonner --legacy-peer-deps
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
4. **Test the profile system**:
   - Sign in with Clerk
   - You'll be redirected to `/profile`
   - Fill out your profile information
   - Test editing and saving

## 🔧 Customization

### Adding New Fields
To add new profile fields:

1. Update the SQL table schema
2. Modify the API routes in `/api/profile/route.ts`
3. Update the profile page component
4. Add validation as needed

### Styling Changes
The profile page uses your existing design system:
- Tailwind CSS classes
- Shadcn/ui components
- Your color scheme and gradients

## 🐛 Troubleshooting

### Common Issues

1. **Profile not loading**: Check Supabase connection and RLS policies
2. **Authentication errors**: Verify Clerk configuration
3. **Toast notifications not working**: Ensure sonner is installed
4. **Database errors**: Check SQL query execution and table creation
5. **RLS Policy Violation**: If you get "new row violates row-level security policy" error

### RLS Policy Issues

If you encounter RLS policy violations, try these solutions:

#### Option 1: Use Permissive Policies (Recommended for testing)
Run this SQL in your Supabase dashboard:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON userinfo;
DROP POLICY IF EXISTS "Users can insert own profile" ON userinfo;
DROP POLICY IF EXISTS "Users can update own profile" ON userinfo;

-- Create permissive policies for testing
CREATE POLICY "Allow all operations for authenticated users" ON userinfo
    FOR ALL USING (true) WITH CHECK (true);
```

#### Option 2: Disable RLS Temporarily
If you're still having issues, you can temporarily disable RLS:

```sql
ALTER TABLE userinfo DISABLE ROW LEVEL SECURITY;
```

**Note**: Remember to re-enable RLS with proper policies once everything is working.

#### Option 3: Test Database Connection
Visit `/api/test-db` in your browser to test the database connection.

### Debug Steps

1. Check browser console for errors
2. Verify environment variables
3. Test API endpoints directly
4. Check Supabase logs
5. Verify RLS policies are active
6. Test database connection at `/api/test-db`

## 📝 API Reference

### GET /api/profile
Returns the current user's profile data.

**Response:**
```json
{
  "profile": {
    "id": "uuid",
    "clerk_id": "clerk_user_id",
    "username": "string",
    "age": 25,
    "education_level": "Bachelor's Degree",
    "domain_of_interest": "Web Development",
    "skills": "skill1, skill2",
    "previous_projects": "text",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### PUT /api/profile
Creates or updates the user's profile.

**Request Body:**
```json
{
  "username": "required_string",
  "age": "optional_number",
  "education_level": "optional_string",
  "domain_of_interest": "optional_string",
  "skills": "optional_string",
  "previous_projects": "optional_string"
}
```

**Response:**
```json
{
  "profile": {
    // Updated profile data
  }
}
```

## 🎯 Next Steps

Consider adding these features in the future:
- Profile picture upload
- Social media links
- Skills and certifications
- Learning preferences
- Privacy settings
- Profile sharing
- Achievement badges

---

The profile system is now fully integrated with your existing EduAI platform! Users will be automatically redirected to their profile page after signing in, where they can manage their learning preferences and personal information. 