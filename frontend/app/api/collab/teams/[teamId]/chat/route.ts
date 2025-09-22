import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Get chat messages for the team
    const { data: messages, error } = await supabase
      .from('collab_chat_messages')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });

  } catch (error) {
    console.error('Error in GET /api/collab/teams/[teamId]/chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { teamId } = params;
    const body = await request.json();
    const { message } = body;

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get the current user's profile to get their username
    const { data: userProfile, error: profileError } = await supabase
      .from('collab_profiles')
      .select('username')
      .eq('clerk_id', 'current-user-id') // This should be replaced with actual user ID
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Insert the new message
    const { data: newMessage, error } = await supabase
      .from('collab_chat_messages')
      .insert({
        team_id: teamId,
        sender_clerk_id: 'current-user-id', // This should be replaced with actual user ID
        sender_username: userProfile.username,
        message: message.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ message: newMessage });

  } catch (error) {
    console.error('Error in POST /api/collab/teams/[teamId]/chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 