const SENTIMENT_API_BASE = '/api/sentiment';

interface SentimentResponse {
  sentiment_data: any;
  recommendations: string;
  cache_age: number;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
}

async function fetchWithRetry<T>(
  url: string, 
  options: RequestInit = {}, 
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Add cache-busting parameter
      const cacheBuster = `_t=${Date.now()}`;
      const urlWithCacheBuster = url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;
      
      const response = await fetch(urlWithCacheBuster, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed for ${url}:`, error);
      
      if (i === retries - 1) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw new Error('All retry attempts failed');
}

export async function getSentimentAnalysis(forceRefresh = false): Promise<SentimentResponse> {
  try {
    const url = `${SENTIMENT_API_BASE}/sentiment-analysis${forceRefresh ? '?force_refresh=true' : ''}`;
    return await fetchWithRetry<SentimentResponse>(url);
  } catch (error) {
    console.error('Failed to fetch sentiment analysis:', error);
    throw new Error(`Failed to fetch sentiment data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function testSentiment(text: string): Promise<any> {
  try {
    const response = await fetchWithRetry(
      `${SENTIMENT_API_BASE}/test-sentiment`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to test sentiment:', error);
    throw new Error(`Failed to test sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getHealthStatus(): Promise<any> {
  try {
    const response = await fetchWithRetry(
      `${SENTIMENT_API_BASE}/health`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    return response;
  } catch (error) {
    console.error('Failed to get health status:', error);
    throw new Error(`Failed to get health status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getActiveUsers(): Promise<{ active_users: number }> {
  try {
    return await fetchWithRetry<{ active_users: number }>('/api/active-users');
  } catch (error) {
    throw new Error(`Failed to fetch active users: ${error}`);
  }
}

export async function forceRefreshData(): Promise<{ status: string; message: string }> {
  try {
    const response = await fetch(`${SENTIMENT_API_BASE}/force-refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to force refresh: ${error}`);
  }
} 