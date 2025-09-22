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
            content: `Extract exactly 5 professional technical skills from this project that would be valuable on a resume or LinkedIn profile.

CRITICAL RULES:
- Return ONLY skill names, not descriptions or sentences
- Use industry-standard skill names (e.g., "React", "Node.js", "Machine Learning", "Python", "API Development", "Arduino", "BPSK", "Signal Processing")
- Avoid verbose descriptions like "Implement real-time communication using Socket.IO" - instead use "Socket.IO" or "Real-time Communication"
- Focus on technologies, frameworks, programming languages, and core concepts
- Exclude generic tools like "Computer", "Text Editor", "Internet Access"
- Each skill should be 1-3 words maximum

PROJECT TYPE DETECTION:
- If this is a HARDWARE/ELECTRONICS project (Arduino, circuits, modulation, BPSK, etc.), focus on hardware skills like "Arduino", "BPSK", "Signal Processing", "Circuit Design", "Electronics"
- If this is a SOFTWARE project (web apps, mobile apps, etc.), focus on software skills like "React", "Node.js", "Python", "API Development"
- DO NOT mix hardware and software skills inappropriately

Examples of GOOD skills for HARDWARE projects:
- Arduino, BPSK, Signal Processing, Circuit Design, Electronics

Examples of GOOD skills for SOFTWARE projects:
- React, Node.js, MongoDB, API Development, TypeScript

Examples of BAD skills (too verbose):
- "Implement real-time communication using Socket.IO"
- "Build a responsive chat interface using ReactJS"
- "Integrate sensors with a microcontroller"

Project details:
${projectDescription}

Return ONLY a comma-separated list of 5 skills, nothing else. Example format:
React, Node.js, MongoDB, API Development, TypeScript`
          }
        ],
        temperature: 0.1,
        max_tokens: 100
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

    // Normalize and clean the skills
    const normalizedSkills = normalizeSkills(skillsList);
    
    // Validate that we have exactly 5 skills
    const skillsArray = normalizedSkills.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    
    if (skillsArray.length === 5) {
      console.log('Successfully extracted 5 refined skills:', skillsArray);
      return normalizedSkills;
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

// Function to normalize and clean skill names
function normalizeSkills(skillsString: string): string {
  const skillMappings: { [key: string]: string } = {
    // Programming Languages
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'typescript': 'TypeScript',
    'ts': 'TypeScript',
    'python': 'Python',
    'java': 'Java',
    'c++': 'C++',
    'c#': 'C#',
    'php': 'PHP',
    'ruby': 'Ruby',
    'go': 'Go',
    'rust': 'Rust',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    
    // Frameworks and Libraries
    'react': 'React',
    'reactjs': 'React',
    'react.js': 'React',
    'vue': 'Vue.js',
    'vuejs': 'Vue.js',
    'angular': 'Angular',
    'node': 'Node.js',
    'nodejs': 'Node.js',
    'node.js': 'Node.js',
    'express': 'Express.js',
    'expressjs': 'Express.js',
    'django': 'Django',
    'flask': 'Flask',
    'spring': 'Spring Boot',
    'springboot': 'Spring Boot',
    'laravel': 'Laravel',
    'rails': 'Ruby on Rails',
    'rubyonrails': 'Ruby on Rails',
    
    // Databases
    'mongodb': 'MongoDB',
    'mysql': 'MySQL',
    'postgresql': 'PostgreSQL',
    'postgres': 'PostgreSQL',
    'sqlite': 'SQLite',
    'redis': 'Redis',
    'firebase': 'Firebase',
    'supabase': 'Supabase',
    
    // Cloud and DevOps
    'aws': 'AWS',
    'amazon web services': 'AWS',
    'azure': 'Azure',
    'google cloud': 'Google Cloud',
    'gcp': 'Google Cloud',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'k8s': 'Kubernetes',
    'git': 'Git',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    
    // AI/ML
    'machine learning': 'Machine Learning',
    'ml': 'Machine Learning',
    'artificial intelligence': 'AI',
    'ai': 'AI',
    'deep learning': 'Deep Learning',
    'neural networks': 'Neural Networks',
    'tensorflow': 'TensorFlow',
    'pytorch': 'PyTorch',
    'scikit-learn': 'Scikit-learn',
    'scikitlearn': 'Scikit-learn',
    'opencv': 'OpenCV',
    'numpy': 'NumPy',
    'pandas': 'Pandas',
    'matplotlib': 'Matplotlib',
    'seaborn': 'Seaborn',
    
    // Web Technologies
    'html': 'HTML',
    'css': 'CSS',
    'html5': 'HTML5',
    'css3': 'CSS3',
    'bootstrap': 'Bootstrap',
    'tailwind': 'Tailwind CSS',
    'tailwindcss': 'Tailwind CSS',
    'sass': 'Sass',
    'scss': 'Sass',
    'less': 'Less',
    'jquery': 'jQuery',
    'ajax': 'AJAX',
    'rest api': 'REST API',
    'restapi': 'REST API',
    'graphql': 'GraphQL',
    'websocket': 'WebSocket',
    'socket.io': 'Socket.IO',
    'socketio': 'Socket.IO',
    
    // Mobile Development
    'react native': 'React Native',
    'reactnative': 'React Native',
    'flutter': 'Flutter',
    'ionic': 'Ionic',
    'xamarin': 'Xamarin',
    'android': 'Android Development',
    'ios': 'iOS Development',
    
    // Hardware and Electronics
    'arduino': 'Arduino',
    'raspberry pi': 'Raspberry Pi',
    'raspberrypi': 'Raspberry Pi',
    'microcontroller': 'Microcontroller Programming',
    'embedded systems': 'Embedded Systems',
    'circuit design': 'Circuit Design',
    'pcb design': 'PCB Design',
    'electronics': 'Electronics',
    'digital electronics': 'Digital Electronics',
    'analog electronics': 'Analog Electronics',
    'signal processing': 'Signal Processing',
    'modulation': 'Modulation',
    'demodulation': 'Demodulation',
    'bpsk': 'BPSK',
    'qpsk': 'QPSK',
    'ask': 'ASK',
    'fsk': 'FSK',
    'psk': 'PSK',
    'qam': 'QAM',
    'rf': 'RF Design',
    'radio frequency': 'RF Design',
    'wireless communication': 'Wireless Communication',
    'telecommunications': 'Telecommunications',
    'communication systems': 'Communication Systems',
    'digital communication': 'Digital Communication',
    'analog communication': 'Analog Communication',
    'antenna design': 'Antenna Design',
    'antenna': 'Antenna Design',
    'sensor': 'Sensor Integration',
    'sensors': 'Sensor Integration',
    'iot': 'IoT',
    'internet of things': 'IoT',
    'fpga': 'FPGA',
    'verilog': 'Verilog',
    'vhdl': 'VHDL',
    'hardware description language': 'HDL',
    'hdl': 'HDL',
    
    // Other Technologies
    'blockchain': 'Blockchain',
    'ethereum': 'Ethereum',
    'solidity': 'Solidity',
    'web3': 'Web3',
    
    // Development Concepts
    'api development': 'API Development',
    'api integration': 'API Integration',
    'responsive design': 'Responsive Design',
    'user experience': 'UX Design',
    'user interface': 'UI Design',
    'ui/ux': 'UI/UX Design',
    'ux/ui': 'UI/UX Design',
    'state management': 'State Management',
    'version control': 'Version Control',
    'agile': 'Agile Development',
    'scrum': 'Scrum',
    'test driven development': 'TDD',
    'tdd': 'TDD',
    'continuous integration': 'CI/CD',
    'cicd': 'CI/CD',
    'devops': 'DevOps',
    'microservices': 'Microservices',
    'serverless': 'Serverless',
    'full stack': 'Full Stack Development',
    'fullstack': 'Full Stack Development',
    'frontend': 'Frontend Development',
    'backend': 'Backend Development',
    'web development': 'Web Development',
    'mobile development': 'Mobile Development',
    'data science': 'Data Science',
    'data analysis': 'Data Analysis',
    'data visualization': 'Data Visualization',
    'problem solving': 'Problem Solving',
    'algorithms': 'Algorithms',
    'data structures': 'Data Structures',
    'object oriented programming': 'OOP',
    'oop': 'OOP',
    'functional programming': 'Functional Programming',
    'design patterns': 'Design Patterns'
  };

  // Helper function to escape regex special characters
  function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Split skills and normalize each one
  const skills = skillsString.split(',').map(skill => {
    const trimmedSkill = skill.trim().toLowerCase();
    
    // Check if we have a direct mapping
    if (skillMappings[trimmedSkill]) {
      return skillMappings[trimmedSkill];
    }
    
    // More precise partial matching - only match if the skill contains the key as a whole word
    for (const [key, value] of Object.entries(skillMappings)) {
      // Use word boundaries to avoid false matches, properly escape regex special characters
      const escapedKey = escapeRegex(key);
      const wordBoundaryPattern = new RegExp(`\\b${escapedKey}\\b`, 'i');
      if (wordBoundaryPattern.test(trimmedSkill)) {
        return value;
      }
    }
    
    // If no mapping found, capitalize the first letter of each word
    return skill.trim().replace(/\b\w/g, l => l.toUpperCase());
  });

  return skills.join(', ');
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
  
  // Extract from tools array
  if (projectData.tools && Array.isArray(projectData.tools)) {
    const tools = projectData.tools.slice(0, 2); // Take first 2
    fallbackSkills.push(...tools);
  }
  
  // Extract from prerequisites
  if (projectData.prerequisites && Array.isArray(projectData.prerequisites)) {
    const prereqs = projectData.prerequisites.slice(0, 2); // Take first 2
    fallbackSkills.push(...prereqs);
  }
  
  // Add domain-specific skills based on project type and domain
  const domain = projectData.domain?.toLowerCase() || '';
  const category = projectData.category?.toLowerCase() || '';
  const title = projectData.title?.toLowerCase() || '';
  const overview = projectData.projectOverview?.toLowerCase() || '';
  
  // Check for hardware/electronics projects first
  const hardwareKeywords = [
    'arduino', 'raspberry pi', 'microcontroller', 'circuit', 'electronics', 
    'hardware', 'sensor', 'iot', 'embedded', 'fpga', 'verilog', 'vhdl',
    'modulation', 'demodulation', 'bpsk', 'qpsk', 'ask', 'fsk', 'psk',
    'rf', 'radio frequency', 'wireless', 'communication', 'antenna',
    'signal processing', 'digital electronics', 'analog electronics'
  ];
  
  const isHardwareProject = hardwareKeywords.some(keyword => 
    domain.includes(keyword) || title.includes(keyword) || overview.includes(keyword)
  );
  
  if (isHardwareProject) {
    // Add hardware-specific skills
    if (domain.includes('arduino') || title.includes('arduino') || overview.includes('arduino')) {
      if (!fallbackSkills.some(s => s.toLowerCase().includes('arduino'))) {
        fallbackSkills.push('Arduino');
      }
    }
    
    if (domain.includes('modulation') || domain.includes('demodulation') || 
        title.includes('modulation') || title.includes('demodulation') ||
        overview.includes('modulation') || overview.includes('demodulation')) {
      if (!fallbackSkills.some(s => s.toLowerCase().includes('modulation'))) {
        fallbackSkills.push('Modulation');
      }
      if (!fallbackSkills.some(s => s.toLowerCase().includes('demodulation'))) {
        fallbackSkills.push('Demodulation');
      }
    }
    
    if (domain.includes('bpsk') || title.includes('bpsk') || overview.includes('bpsk')) {
      if (!fallbackSkills.some(s => s.toLowerCase().includes('bpsk'))) {
        fallbackSkills.push('BPSK');
      }
    }
    
    if (domain.includes('signal') || title.includes('signal') || overview.includes('signal')) {
      if (!fallbackSkills.some(s => s.toLowerCase().includes('signal'))) {
        fallbackSkills.push('Signal Processing');
      }
    }
    
    if (domain.includes('communication') || title.includes('communication') || overview.includes('communication')) {
      if (!fallbackSkills.some(s => s.toLowerCase().includes('communication'))) {
        fallbackSkills.push('Communication Systems');
      }
    }
    
    if (domain.includes('electronics') || title.includes('electronics') || overview.includes('electronics')) {
      if (!fallbackSkills.some(s => s.toLowerCase().includes('electronics'))) {
        fallbackSkills.push('Electronics');
      }
    }
    
    if (domain.includes('circuit') || title.includes('circuit') || overview.includes('circuit')) {
      if (!fallbackSkills.some(s => s.toLowerCase().includes('circuit'))) {
        fallbackSkills.push('Circuit Design');
      }
    }
    
    // Don't add software skills for hardware projects
    return normalizeSkills(fallbackSkills.join(', '));
  }
  
  // Software project skills (only if not hardware)
  if (category === 'software' || domain.includes('web') || domain.includes('frontend') || domain.includes('backend')) {
    if (!fallbackSkills.some(s => s.toLowerCase().includes('web'))) {
      fallbackSkills.push('Web Development');
    }
  }
  
  if (domain.includes('ai') || domain.includes('machine learning') || domain.includes('ml')) {
    if (!fallbackSkills.some(s => s.toLowerCase().includes('ai') || s.toLowerCase().includes('machine'))) {
      fallbackSkills.push('Machine Learning');
    }
  }
  
  if (domain.includes('mobile') || domain.includes('app')) {
    if (!fallbackSkills.some(s => s.toLowerCase().includes('mobile'))) {
      fallbackSkills.push('Mobile Development');
    }
  }
  
  if (domain.includes('data') || domain.includes('analytics')) {
    if (!fallbackSkills.some(s => s.toLowerCase().includes('data'))) {
      fallbackSkills.push('Data Analysis');
    }
  }
  
  if (domain.includes('iot') || domain.includes('arduino') || domain.includes('raspberry')) {
    if (!fallbackSkills.some(s => s.toLowerCase().includes('iot'))) {
      fallbackSkills.push('IoT');
    }
  }
  
  // Remove duplicates and limit to 5 skills
  const uniqueSkills = [...new Set(fallbackSkills)];
  const limitedSkills = uniqueSkills.slice(0, 5);
  
  // Normalize the skills using the same function
  const normalizedSkills = normalizeSkills(limitedSkills.join(', '));
  
  console.log('Fallback skills extracted:', normalizedSkills.split(', '));
  return normalizedSkills;
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