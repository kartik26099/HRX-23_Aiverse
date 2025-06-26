import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabaseClient';

// Function to extract skills using AI (OpenRouter/Gemini)
async function extractSkillsFromProject(projectData: any) {
  try {
    // Check if OpenRouter API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      console.log('OpenRouter API key not available, using fallback skill extraction');
      return extractSkillsFallback(projectData);
    }

    // Create a comprehensive project description for AI analysis
    const projectDescription = `
Project Title: ${projectData.title}
Domain: ${projectData.domain || 'Software Development'}
Experience Level: ${projectData.experienceLevel}
Duration: ${projectData.totalDuration}

Project Overview: ${projectData.projectOverview || ''}

Tools Used: ${projectData.tools?.join(', ') || ''}
Software Tools: ${projectData.softwareTools?.tools?.map((t: any) => t.name).join(', ') || ''}
Prerequisites: ${projectData.prerequisites?.join(', ') || ''}
Learning Objectives: ${projectData.learningObjectives?.join(', ') || ''}

Project Type: ${projectData.category || 'software'}
    `.trim();

    // Use OpenRouter API to extract refined skills
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'EduAI Project Skills Extractor'
      },
      body: JSON.stringify({
        model: 'google/gemini-pro',
        messages: [
          {
            role: 'user',
            content: `Analyze this project and extract exactly 5 main  skills that were learned or used(and which we can update on Linkedin or use in resume) for example (Web Development, Mobile Development, Machine Learning, AI Development, Data Science, Programming, Problem Solving, etc.). 

Focus on:
- Programming languages and frameworks
- Key technologies and tools
- Core development concepts
- Industry-relevant skills

IMPORTANT RULES:
- Return EXACTLY 5 skills, no more, no less
- Use concise, professional skill names
- Avoid generic terms like "Basic understanding of..."
- Don't include project-specific details
- Don't include tools like "Computer with internet access" or "Text editor"
- Focus on transferable technical skills

Project details:
${projectDescription}

Return ONLY a comma-separated list of 5 skills, nothing else. Example format:
JavaScript, React, API Integration, State Management, Responsive Design`
          }
        ],
        temperature: 0.2,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      console.log(`OpenRouter API error: ${response.status}, using fallback`);
      return extractSkillsFallback(projectData);
    }

    const data = await response.json();
    const extractedSkills = data.choices[0]?.message?.content?.trim() || '';
    
    // Clean up the response - remove any extra text and just get the skills
    const skillsList = extractedSkills
      .replace(/^Skills:\s*/i, '')
      .replace(/^Here are the skills:\s*/i, '')
      .replace(/^The skills are:\s*/i, '')
      .replace(/^5 main skills:\s*/i, '')
      .replace(/^Main skills:\s*/i, '')
      .replace(/\.$/, '')
      .trim();

    // Validate that we have exactly 5 skills
    const skillsArray = skillsList.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    
    if (skillsArray.length === 5) {
      console.log('Successfully extracted 5 refined skills:', skillsArray);
      return skillsList;
    } else {
      console.log(`Expected 5 skills, got ${skillsArray.length}. Using fallback.`);
      return extractSkillsFallback(projectData);
    }
  } catch (error) {
    console.log('AI skill extraction failed, using fallback:', error instanceof Error ? error.message : 'Unknown error');
    // Fallback to basic skill extraction
    return extractSkillsFallback(projectData);
  }
}

// Fallback function to extract skills without AI
function extractSkillsFallback(projectData: any) {
  const fallbackSkills = [];
  
  // Extract from software tools (most important)
  if (projectData.softwareTools?.tools && Array.isArray(projectData.softwareTools.tools)) {
    const toolNames = projectData.softwareTools.tools.map((t: any) => t.name);
    // Take only the most important tools (limit to 3)
    fallbackSkills.push(...toolNames.slice(0, 3));
  }
  
  // Extract from learning objectives (second most important)
  if (projectData.learningObjectives && Array.isArray(projectData.learningObjectives)) {
    const objectives = projectData.learningObjectives.slice(0, 2); // Take first 2
    fallbackSkills.push(...objectives);
  }
  
  // Add domain-specific skills based on project type
  if (projectData.category === 'software' || projectData.domain?.toLowerCase().includes('web')) {
    if (!fallbackSkills.some(s => s.toLowerCase().includes('web'))) {
      fallbackSkills.push('Web Development');
    }
  }
  
  if (projectData.domain?.toLowerCase().includes('ai') || projectData.domain?.toLowerCase().includes('machine learning')) {
    if (!fallbackSkills.some(s => s.toLowerCase().includes('ai') || s.toLowerCase().includes('machine'))) {
      fallbackSkills.push('Machine Learning');
    }
  }
  
  if (projectData.domain?.toLowerCase().includes('mobile')) {
    if (!fallbackSkills.some(s => s.toLowerCase().includes('mobile'))) {
      fallbackSkills.push('Mobile Development');
    }
  }
  
  // Remove duplicates and limit to 5 skills
  const uniqueSkills = [...new Set(fallbackSkills)];
  const limitedSkills = uniqueSkills.slice(0, 5);
  
  console.log('Fallback skills extracted:', limitedSkills);
  return limitedSkills.join(', ');
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectData } = body;

    if (!projectData) {
      return NextResponse.json({ error: 'Project data is required' }, { status: 400 });
    }

    console.log('Processing project completion for user:', userId);

    // Extract skills from the project
    const extractedSkills = await extractSkillsFromProject(projectData);
    console.log('Extracted skills:', extractedSkills);
    console.log('Skills count:', extractedSkills.split(',').length);

    // Create project summary for previous_projects
    const projectSummary = `${projectData.title} (Completed: ${new Date().toLocaleDateString()})`;

    // Get current user profile
    const { data: currentProfile, error: fetchError } = await supabase
      .from('userinfo')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching current profile:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch current profile' }, { status: 500 });
    }

    // Prepare updated data
    let updatedSkills = extractedSkills;
    let updatedProjects = projectSummary;

    if (currentProfile) {
      // Merge with existing skills
      const existingSkills = currentProfile.skills || '';
      const existingProjects = currentProfile.previous_projects || '';
      
      // Combine skills (avoid duplicates)
      const existingSkillsList = existingSkills ? existingSkills.split(',').map((s: string) => s.trim()) : [];
      const newSkillsList = extractedSkills ? extractedSkills.split(',').map((s: string) => s.trim()) : [];
      const combinedSkills = [...new Set([...existingSkillsList, ...newSkillsList])];
      updatedSkills = combinedSkills.join(', ');
      
      // Add new project to existing projects
      updatedProjects = existingProjects ? `${existingProjects}, ${projectSummary}` : projectSummary;
    }

    // Update or create profile
    let result;
    if (currentProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('userinfo')
        .update({
          skills: updatedSkills,
          previous_projects: updatedProjects,
        })
        .eq('clerk_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ 
          error: 'Failed to update profile', 
          details: error.message || 'Database update failed'
        }, { status: 500 });
      }

      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('userinfo')
        .insert([{
          clerk_id: userId,
          username: `user_${userId.slice(0, 8)}`,
          skills: updatedSkills,
          previous_projects: updatedProjects,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return NextResponse.json({ 
          error: 'Failed to create profile', 
          details: error.message || 'Database creation failed'
        }, { status: 500 });
      }

      result = data;
    }

    console.log('Project completion successful:', result);
    return NextResponse.json({ 
      success: true,
      profile: result,
      extractedSkills,
      projectSummary
    });

  } catch (error) {
    console.error('Error in project completion:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 