# RLS (Row Level Security) Troubleshooting Guide

## Issue: 400 Error when fetching user profile

If you're getting a 400 error when trying to fetch user profile data from Supabase, it's likely due to RLS (Row Level Security) policies blocking the request.

## Quick Fix (Temporary)

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following command to temporarily disable RLS:

```sql
-- Temporary fix: Disable RLS on userinfo table
ALTER TABLE userinfo DISABLE ROW LEVEL SECURITY;
```

## Proper Fix (Recommended)

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the contents of `fix-rls-policies.sql` file

This will set up proper RLS policies that allow users to:
- View their own profile data
- Insert their own profile data
- Update their own profile data
- Delete their own profile data

## Verify the Fix

After running the fix, you can verify it worked by:

1. Going to your Supabase dashboard
2. Navigate to Authentication > Policies
3. Check that the `userinfo` table has the following policies:
   - "Users can view own profile"
   - "Users can insert own profile"
   - "Users can update own profile"
   - "Users can delete own profile"

## Alternative: Use the temp-disable-rls.sql script

If you want to temporarily disable RLS for all tables during development, run the contents of `temp-disable-rls.sql` in your Supabase SQL Editor.

**Note:** Remember to re-enable RLS and set up proper policies before going to production.

## Common Error Codes

- `PGRST116`: Row Level Security policy violation
- `400`: Bad request, often due to RLS blocking the query
- `403`: Forbidden, user doesn't have permission

## Testing

After applying the fix:

1. Sign in to your application
2. Go to the Profile section and create/update your profile
3. Try generating a project in the DIY Generator
4. Check the browser console for any remaining errors

## Production Considerations

Before deploying to production:

1. Re-enable RLS: `ALTER TABLE userinfo ENABLE ROW LEVEL SECURITY;`
2. Ensure proper policies are in place
3. Test with different user accounts
4. Verify that users can only access their own data 