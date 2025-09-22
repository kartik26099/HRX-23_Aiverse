import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { team_id, message } = body;

    if (!team_id || !message) {
      return NextResponse.json({ error: 'Missing team_id or message' }, { status: 400 });
    }

    // Verify user is a member of this team
    const { data: team, error: teamError } = await supabase
      .from('collab_teams')
      .select('*')
      .eq('id', team_id)
      .or(`member1_clerk_id.eq.${userId},member2_clerk_id.eq.${userId}`)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    // Get user profile for username
    const { data: profile } = await supabase
      .from('collab_profiles')
      .select('username')
      .eq('clerk_id', userId)
      .single();

    const username = profile?.username || 'Anonymous';

    // Create the chat message
    const { data: chatMessage, error } = await supabase
      .from('collab_chat_messages')
      .insert({
        team_id,
        sender_clerk_id: userId,
        sender_username: username,
        message: message.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ message: chatMessage });
  } catch (error) {
    console.error('Error in POST /api/collab/chat/send:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 