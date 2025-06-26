// Test script to debug Supabase connection and RLS issues
// Run this in your browser console on the DIY generator page

async function testSupabaseConnection() {
  console.log('=== Supabase Connection Test ===');
  
  // Check if supabase client is available
  if (typeof window !== 'undefined' && window.supabase) {
    console.log('✅ Supabase client found');
  } else {
    console.log('❌ Supabase client not found');
    return;
  }

  try {
    // Test 1: Basic connection test
    console.log('\n1. Testing basic connection...');
    const { data: testData, error: testError } = await window.supabase
      .from('userinfo')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Connection test failed:', testError);
    } else {
      console.log('✅ Connection test successful');
    }

    // Test 2: Check if userinfo table exists and is accessible
    console.log('\n2. Testing userinfo table access...');
    const { data: tableData, error: tableError } = await window.supabase
      .from('userinfo')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table access failed:', tableError);
      console.log('Error code:', tableError.code);
      console.log('Error message:', tableError.message);
    } else {
      console.log('✅ Table access successful');
      console.log('Sample data:', tableData);
    }

    // Test 3: Check RLS status (if we can access the table)
    console.log('\n3. Testing RLS status...');
    if (!tableError) {
      console.log('✅ RLS appears to be disabled or properly configured');
    } else if (tableError.code === 'PGRST116') {
      console.log('❌ RLS is blocking access - need to disable RLS or fix policies');
    }

  } catch (error) {
    console.log('❌ Exception during testing:', error);
  }
}

// Run the test
testSupabaseConnection();

// Also expose the function globally for manual testing
window.testSupabaseConnection = testSupabaseConnection; 