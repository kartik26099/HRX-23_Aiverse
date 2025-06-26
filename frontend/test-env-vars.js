// Test environment variables
// Run this in your browser console

console.log('=== Environment Variables Test ===');

// Check if environment variables are available
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length);

// Check if supabase client is properly configured
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Supabase client is available');
  
  // Test the client configuration
  const supabaseUrl = window.supabase.supabaseUrl;
  const supabaseKey = window.supabase.supabaseKey;
  
  console.log('Supabase URL from client:', supabaseUrl);
  console.log('Supabase Key exists:', !!supabaseKey);
  console.log('Supabase Key length:', supabaseKey?.length);
  
  if (supabaseUrl && supabaseKey) {
    console.log('✅ Supabase client appears to be properly configured');
  } else {
    console.log('❌ Supabase client configuration is incomplete');
  }
} else {
  console.log('❌ Supabase client not found');
}

// Test a simple query
async function testSimpleQuery() {
  try {
    console.log('\n=== Testing Simple Query ===');
    
    const { data, error } = await window.supabase
      .from('userinfo')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Query failed:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
    } else {
      console.log('✅ Query successful:', data);
    }
  } catch (error) {
    console.log('❌ Exception during query:', error);
  }
}

// Run the test
testSimpleQuery(); 