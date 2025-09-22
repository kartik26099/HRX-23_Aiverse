import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collaborator_id } = body;

    if (!collaborator_id) {
      return NextResponse.json({ error: 'Collaborator ID is required' }, { status: 400 });
    }

    // Get the current user's profile
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from('collab_profiles')
      .select('*')
      .eq('clerk_id', 'current-user-id') // This should be replaced with actual user ID
      .single();

    if (currentUserError || !currentUserProfile) {
      return NextResponse.json({ error: 'Current user profile not found' }, { status: 404 });
    }

    // Get the collaborator's profile
    const { data: collaboratorProfile, error: collaboratorError } = await supabase
      .from('collab_profiles')
      .select('*')
      .eq('id', collaborator_id)
      .single();

    if (collaboratorError || !collaboratorProfile) {
      return NextResponse.json({ error: 'Collaborator profile not found' }, { status: 404 });
    }

    // Create a new team
    const { data: team, error: teamError } = await supabase
      .from('collab_teams')
      .insert({
        project_name: currentUserProfile.project_name,
        member1_clerk_id: currentUserProfile.clerk_id,
        member1_username: currentUserProfile.username,
        member2_clerk_id: collaboratorProfile.clerk_id,
        member2_username: collaboratorProfile.username
      })
      .select()
      .single();

    if (teamError) {
      console.error('Error creating team:', teamError);
      return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Team created successfully!',
      team
    });

  } catch (error) {
    console.error('Error in accept collaboration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 