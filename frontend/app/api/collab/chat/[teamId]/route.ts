import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamId } = params;

    // Verify user is a member of this team
    const { data: team, error: teamError } = await supabase
      .from('collab_teams')
      .select('*')
      .eq('id', teamId)
      .or(`member1_clerk_id.eq.${userId},member2_clerk_id.eq.${userId}`)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    // Get chat messages for this team
    const { data: messages, error } = await supabase
      .from('collab_chat_messages')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      return NextResponse.json({ error: 'Failed to fetch chat messages' }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error in GET /api/collab/chat/[teamId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 