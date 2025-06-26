import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('userinfo')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: data || null });
  } catch (error) {
    console.error('Error in GET /api/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, age, education_level, domain_of_interest, skills, previous_projects } = body;

    console.log('Profile update request:', { userId, username, age, education_level, domain_of_interest, skills, previous_projects });

    // Validate required fields
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('userinfo')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', fetchError);
      return NextResponse.json({ error: 'Failed to check existing profile' }, { status: 500 });
    }

    let result;
    if (existingProfile) {
      // Update existing profile
      console.log('Updating existing profile for user:', userId);
      const { data, error } = await supabase
        .from('userinfo')
        .update({
          username,
          age: age || null,
          education_level: education_level || null,
          domain_of_interest: domain_of_interest || null,
          skills: skills || null,
          previous_projects: previous_projects || null,
        })
        .eq('clerk_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile', details: error }, { status: 500 });
      }

      result = data;
    } else {
      // Create new profile
      console.log('Creating new profile for user:', userId);
      const { data, error } = await supabase
        .from('userinfo')
        .insert([{
          clerk_id: userId,
          username,
          age: age || null,
          education_level: education_level || null,
          domain_of_interest: domain_of_interest || null,
          skills: skills || null,
          previous_projects: previous_projects || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return NextResponse.json({ error: 'Failed to create profile', details: error }, { status: 500 });
      }

      result = data;
    }

    console.log('Profile operation successful:', result);
    return NextResponse.json({ profile: result });
  } catch (error) {
    console.error('Error in PUT /api/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 