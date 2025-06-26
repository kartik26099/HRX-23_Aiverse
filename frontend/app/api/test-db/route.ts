import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('userinfo')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection test failed:', error);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Database connection failed', 
        error: error 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Database connection successful',
      data: data 
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Test endpoint failed', 
      error: error 
    }, { status: 500 });
  }
} 