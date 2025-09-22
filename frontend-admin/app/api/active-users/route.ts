import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:5001/api/active-users';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch active users',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
} 