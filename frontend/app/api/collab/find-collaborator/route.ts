import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_name, username, required_skills, required_hours } = body;

    // Validate required fields
    if (!project_name || !required_skills) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a collaborator request
    const { data: collabRequest, error: requestError } = await supabase
      .from('collab_requests')
      .insert({
        requester_clerk_id: userId,
        requester_username: username || 'Anonymous',
        project_name,
        required_skills,
        required_hours: required_hours || 10,
        status: 'pending'
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating request:', requestError);
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    // Find potential collaborators
    // Look for profiles that have skills matching the requirements
    const { data: potentialCollaborators, error: searchError } = await supabase
      .from('collab_profiles')
      .select('*')
      .neq('clerk_id', userId) // Don't match with self
      .not('clerk_id', 'is', null);

    if (searchError) {
      console.error('Error searching for collaborators:', searchError);
      return NextResponse.json({ error: 'Failed to search for collaborators' }, { status: 500 });
    }

    // Simple matching logic - find someone with similar skills and availability
    const requiredSkillsArray = required_skills.toLowerCase().split(',').map(s => s.trim());
    let bestMatch = null;
    let bestScore = 0;

    for (const profile of potentialCollaborators || []) {
      const profileSkills = profile.skills.toLowerCase().split(',').map(s => s.trim());
      
      // Calculate skill match score
      const skillMatches = requiredSkillsArray.filter(skill => 
        profileSkills.some(profileSkill => 
          profileSkill.includes(skill) || skill.includes(profileSkill)
        )
      );
      
      const skillScore = skillMatches.length / requiredSkillsArray.length;
      
      // Calculate availability score
      const availabilityScore = Math.min(profile.hours_per_week, required_hours) / Math.max(profile.hours_per_week, required_hours);
      
      // Combined score
      const totalScore = (skillScore * 0.7) + (availabilityScore * 0.3);
      
      if (totalScore > bestScore && totalScore > 0.3) { // Minimum 30% match
        bestScore = totalScore;
        bestMatch = profile;
      }
    }

    if (bestMatch) {
      // Update the request with the match
      await supabase
        .from('collab_requests')
        .update({
          status: 'matched',
          matched_with_clerk_id: bestMatch.clerk_id,
          matched_with_username: bestMatch.username
        })
        .eq('id', collabRequest.id);

      return NextResponse.json({ 
        collaborator: {
          id: collabRequest.id,
          username: bestMatch.username,
          skills: bestMatch.skills,
          hours_per_week: bestMatch.hours_per_week,
          project_name: bestMatch.project_name,
          match_score: Math.round(bestScore * 100)
        }
      });
    } else {
      return NextResponse.json({ 
        error: 'No suitable collaborator found. Try adjusting your requirements or check back later.' 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error in POST /api/collab/find-collaborator:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 