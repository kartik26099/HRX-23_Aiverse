import { NextRequest, NextResponse } from 'next/server';

const SENTIMENT_BASE_URL = 'http://localhost:5001/api';

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
  throw new Error('All retry attempts failed');
}

export async function GET(request: NextRequest) {
  try {
    const targetUrl = `${SENTIMENT_BASE_URL}/sentiment-analysis`;
    
    console.log(`Proxying sentiment analysis request to: ${targetUrl}`);
    
    const response = await fetchWithRetry(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
    
  } catch (error) {
    console.error('Sentiment analysis proxy error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch sentiment data',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
} 