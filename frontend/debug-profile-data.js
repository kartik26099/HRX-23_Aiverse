// Debug script to check profile data structure
// Run this in your browser console on the DIY generator page

async function debugProfileData() {
  console.log('=== Profile Data Debug ===');
  
  if (!window.supabase) {
    console.log('❌ Supabase client not found');
    return;
  }

  try {
    // Get the current user ID (you'll need to replace this with your actual user ID)
    const userResponse = await fetch('/api/profile');
    const userData = await userResponse.json();
    
    console.log('Profile data from API:', userData);
    
    if (userData.profile) {
      const profile = userData.profile;
      console.log('\n=== Profile Details ===');
      console.log('Skills (raw):', profile.skills);
      console.log('Skills type:', typeof profile.skills);
      console.log('Skills length:', profile.skills?.length);
      
      console.log('\nPrevious Projects (raw):', profile.previous_projects);
      console.log('Previous Projects type:', typeof profile.previous_projects);
      console.log('Previous Projects length:', profile.previous_projects?.length);
      
      // Test the counting logic
      if (typeof profile.skills === 'string') {
        const skillsArray = profile.skills.split(',').map(s => s.trim()).filter(s => s);
        console.log('\nProcessed skills array:', skillsArray);
        console.log('Skills count:', skillsArray.length);
      }
      
      if (typeof profile.previous_projects === 'string') {
        const projectsArray = profile.previous_projects.split(',').map(p => p.trim()).filter(p => p);
        console.log('\nProcessed projects array:', projectsArray);
        console.log('Projects count:', projectsArray.length);
      }
      
      console.log('\nAll profile fields:', Object.keys(profile));
      console.log('Full profile object:', profile);
    } else {
      console.log('❌ No profile data found');
    }
    
  } catch (error) {
    console.log('❌ Error debugging profile data:', error);
  }
}

// Run the debug
debugProfileData(); 