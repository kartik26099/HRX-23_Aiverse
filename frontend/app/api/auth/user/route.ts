import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from Supabase or create if doesn't exist
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Supabase error:', error);
      throw error;
    }

    if (!user) {
      // Create new user in Supabase
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            clerk_id: userId,
            username: `user_${userId.slice(0, 8)}`, // Generate a default username
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error('Create user error:', createError);
        throw createError;
      }
      user = newUser;
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in /api/auth/user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 