# Community Authentication Setup

## Quick Fix (Recommended for Testing)

If you're getting "Failed to add comment" errors, the quickest solution is to temporarily disable RLS:

### 1. Run this SQL in your Supabase SQL Editor:

```sql
-- Temporarily disable RLS for testing
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;
```

### 2. Test the comment functionality
- Sign in to your application
- Try adding a comment to a post
- It should work immediately

### 3. Re-enable RLS later (when ready for production):
```sql
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
```

## Issue Description
The community section was not allowing users to add comments because the Supabase Row Level Security (RLS) policies required authentication, but the frontend was not properly integrating Clerk authentication with Supabase.

## Solution Implemented

### 1. Created a Custom Hook (`useSupabaseUser`)
- **File**: `frontend/hooks/use-supabase-user.ts`
- **Purpose**: Manages the integration between Clerk authentication and Supabase user management
- **Features**:
  - Automatically creates a Supabase user when a Clerk user signs in
  - Handles user profile synchronization
  - Provides loading states and authentication status

### 2. Server-Side API Solution
- **File**: `frontend/app/api/comments/route.ts`
- **Purpose**: Handles comment creation server-side to bypass RLS policies
- **Features**:
  - Uses Supabase service role key (bypasses RLS)
  - Handles user creation and authentication
  - Provides proper error handling

### 3. Server-Side Supabase Client
- **File**: `frontend/lib/supabase-server.ts`
- **Purpose**: Server-side Supabase client that can bypass RLS policies
- **Security**: Uses service role key only on server-side

### 4. Updated Community Components

#### Post Detail Page (`frontend/app/community/[postId]/page.tsx`)
- Added authentication checks before allowing comments
- Integrated with the `useSupabaseUser` hook
- Uses API route for comment creation (bypasses RLS)
- Proper error handling for unauthenticated users

#### Comment List Component (`frontend/components/community/CommentList.tsx`)
- Added sign-in prompt for unauthenticated users
- Integrated authentication checks
- Improved user experience with clear messaging

#### Main Community Page (`frontend/app/community/page.tsx`)
- Added authentication for reactions and reports
- Integrated with the `useSupabaseUser` hook
- Proper error handling

#### New Post Page (`frontend/app/community/new/page.tsx`)
- Replaced dummy user approach with proper authentication
- Added sign-in requirement for post creation
- Integrated with the `useSupabaseUser` hook

### 3. Database Schema Requirements

The solution assumes the following Supabase database structure:

```sql
-- Users table with Clerk integration
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Comments table with user reference
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'flagged')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

## Environment Variables Required

### Create `.env.local` file in the frontend directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase Service Role Key (SERVER-SIDE ONLY - never expose to client)
# This key bypasses Row Level Security (RLS) policies
# Get this from your Supabase dashboard > Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### How to Get the Service Role Key:

1. Go to your Supabase dashboard
2. Navigate to **Settings** > **API**
3. Copy the **service_role** key (not the anon key)
4. Add it to your `.env.local` file as `SUPABASE_SERVICE_ROLE_KEY`

**⚠️ IMPORTANT**: The service role key should NEVER be exposed to the client-side. It's only used in server-side API routes.

## How It Works

1. **User Signs In**: When a user signs in through Clerk, the `useSupabaseUser` hook automatically:
   - Checks if a Supabase user exists for the Clerk user ID
   - Creates a new Supabase user if one doesn't exist
   - Syncs user profile information (username, avatar, etc.)

2. **Comment Creation**: When a user tries to add a comment:
   - The system checks if the user is authenticated
   - If not authenticated, shows a sign-in prompt
   - If authenticated, sends a request to the server-side API
   - The API uses the service role key to bypass RLS and create the comment
   - The comment is properly linked to the user in the database

3. **Error Handling**: The system provides clear error messages for:
   - Unauthenticated users trying to perform actions
   - Database connection issues
   - User profile synchronization problems

## Testing the Fix

1. **Set up environment variables** in `.env.local`
2. **Sign In**: Users must sign in through Clerk to access community features
3. **Create Posts**: Users can create new posts (requires authentication)
4. **Add Comments**: Users can add comments to posts (requires authentication)
5. **React to Posts**: Users can like/react to posts (requires authentication)
6. **Report Content**: Users can report posts/comments (requires authentication)

## Troubleshooting

### Common Issues

1. **"User profile not ready" error**:
   - This occurs when the Supabase user hasn't been created yet
   - Wait a moment and try again, or refresh the page

2. **"Please sign in" error**:
   - User needs to sign in through Clerk
   - Click the sign-in button in the header

3. **"Failed to create comment" error**:
   - Check that the `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
   - Verify that the service role key is correct
   - Check browser console for detailed error messages

4. **Database connection errors**:
   - Check that Supabase environment variables are properly set
   - Verify that the database schema is correctly implemented

### Debug Steps

1. Check browser console for error messages
2. Verify environment variables are loaded (check Network tab for API calls)
3. Test database connection
4. Check Clerk authentication status
5. Verify Supabase user creation
6. Check server logs for API route errors

## Security Considerations

- **Service Role Key**: Only used server-side, never exposed to client
- **RLS Bypass**: Only used for specific operations that require it
- **Authentication**: All operations still require user authentication
- **User Data**: Properly isolated and secured
- **API Protection**: Server-side validation of all requests

## Alternative Solutions

If you prefer not to use the service role key, you can:

1. **Disable RLS** for the comments table (less secure)
2. **Modify RLS policies** to work with Clerk authentication
3. **Use Supabase Auth** instead of Clerk (requires migration)

The current solution provides the best balance of security and functionality. 