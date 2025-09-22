import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('collab_profiles')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: profile || null });
  } catch (error) {
    console.error('Error in GET /api/collab/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, project_name, skills, hours_per_week } = body;

    // Validate required fields
    if (!username || !project_name || !skills) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('collab_profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    let result;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('collab_profiles')
        .update({
          username,
          project_name,
          skills,
          hours_per_week: hours_per_week || 10,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }

      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('collab_profiles')
        .insert({
          clerk_id: userId,
          username,
          project_name,
          skills,
          hours_per_week: hours_per_week || 10
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({ profile: result });
  } catch (error) {
    console.error('Error in POST /api/collab/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 