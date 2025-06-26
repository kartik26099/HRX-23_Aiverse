from flask import Flask, request, jsonify
import requests
import os
import json
from flask_cors import CORS
import time
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",  # Keep for backward compatibility
    "http://127.0.0.1:3000"   # Keep for backward compatibility
])

# Configuration
API_CONFIG = {
    'scrapingdog': {
        'scholar_url': "https://api.scrapingdog.com/google_scholar",
        'youtube_url': "https://api.scrapingdog.com/youtube/search",
        'api_key': os.getenv('Scholarly_api')
    },
    'fallback': {
        'enabled': True,
        'cache_duration': 3600  # 1 hour cache
    }
}

# Simple in-memory cache (in production, use Redis or similar)
cache = {}

def get_cached_data(key):
    """Get data from cache if not expired"""
    if key in cache:
        data, timestamp = cache[key]
        if time.time() - timestamp < API_CONFIG['fallback']['cache_duration']:
            return data
    return None

def set_cached_data(key, data):
    """Store data in cache with timestamp"""
    cache[key] = (data, time.time())

def get_fallback_scholar_data(query):
    """Provide fallback academic data when API is unavailable"""
    return [
        {
            'title': f'Research on {query}',
            'authors': 'Various Authors',
            'abstract': f'This is a placeholder for research related to {query}. The actual API data is currently unavailable due to rate limits.',
            'citations': 'N/A',
            'year': datetime.now().year,
            'url': '#',
            'source': 'Fallback Data'
        }
    ]

def get_fallback_youtube_data(query):
    """Provide fallback YouTube data when API is unavailable"""
    return [
        {
            'title': f'Video about {query}',
            'link': '#',
            'thumbnail': '',
            'channel': 'Various Channels',
            'views': 'N/A',
            'published_date': 'N/A',
            'length': 'N/A',
            'description': f'This is a placeholder for YouTube content related to {query}. The actual API data is currently unavailable due to rate limits.',
            'source': 'Fallback Data'
        }
    ]

def clean_youtube_data(data):
    """Clean and extract relevant YouTube data"""
    videos = []
    
    # For debugging - log the structure of the data
    print("YouTube API Response Structure:")
    print(json.dumps(data, indent=2))
    
    # Process all possible paths where videos might be found
    possible_paths = ['channels_new_to_you', 'from_related_searches', 'videos', 'results']
    
    for path in possible_paths:
        if path in data and isinstance(data[path], list):
            for item in data[path]:
                if isinstance(item, dict) and 'title' in item:
                    video = {
                        'title': item.get('title', ''),
                        'link': item.get('link', ''),
                        'thumbnail': item.get('thumbnail', {}).get('static', '') if isinstance(item.get('thumbnail'), dict) else item.get('thumbnail', ''),
                        'channel': item.get('channel', {}).get('name', '') if isinstance(item.get('channel'), dict) else item.get('channel', ''),
                        'views': item.get('views', ''),
                        'published_date': item.get('published_date', ''),
                        'length': item.get('length', ''),
                        'description': item.get('description', ''),
                        'source': 'YouTube API'
                    }
                    videos.append(video)
    
    # If no videos found but we have data, try to extract from the root level
    if not videos and isinstance(data, list):
        for item in data:
            if isinstance(item, dict) and 'title' in item:
                video = {
                    'title': item.get('title', ''),
                    'link': item.get('link', ''),
                    'thumbnail': item.get('thumbnail', {}).get('static', '') if isinstance(item.get('thumbnail'), dict) else item.get('thumbnail', ''),
                    'channel': item.get('channel', {}).get('name', '') if isinstance(item.get('channel'), dict) else item.get('channel', ''),
                    'views': item.get('views', ''),
                    'published_date': item.get('published_date', ''),
                    'length': item.get('length', ''),
                    'description': item.get('description', ''),
                    'source': 'YouTube API'
                }
                videos.append(video)
    
    print(f"Found {len(videos)} videos")
    return videos

def make_api_request(url, params, service_name):
    """Make API request with proper error handling"""
    try:
        print(f"Making {service_name} API request: {url} with params: {params}")
        response = requests.get(url, params=params, timeout=15)
        print(f"{service_name} API response status: {response.status_code}")
        
        if response.status_code == 200:
            return response.json(), None
        elif response.status_code == 403:
            error_msg = f"{service_name} API limit reached. Please upgrade your account or try again later."
            print(f"{service_name} API error: {error_msg}")
            return None, error_msg
        else:
            error_msg = f"{service_name} API error: {response.status_code} - {response.text}"
            print(error_msg)
            return None, error_msg
            
    except requests.exceptions.Timeout:
        error_msg = f"{service_name} API request timed out"
        print(error_msg)
        return None, error_msg
    except requests.exceptions.RequestException as e:
        error_msg = f"{service_name} API request failed: {str(e)}"
        print(error_msg)
        return None, error_msg
    except Exception as e:
        error_msg = f"Unexpected error with {service_name} API: {str(e)}"
        print(error_msg)
        return None, error_msg

@app.route('/search', methods=['GET'])
def search_api():
    query = request.args.get('query', '')
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400
    
    # Check cache first
    cache_key = f"search_{query.lower().replace(' ', '_')}"
    cached_result = get_cached_data(cache_key)
    if cached_result:
        print(f"Returning cached result for query: {query}")
        return jsonify(cached_result)
    
    results = {
        'scholar': [],
        'youtube': [],
        'api_status': {
            'scholar': 'unknown',
            'youtube': 'unknown'
        },
        'errors': []
    }
    
    # Google Scholar API request
    scholar_params = {
        "api_key": API_CONFIG['scrapingdog']['api_key'],
        "query": query,
        "language": "en",
        "page": 0,
        "results": 10
    }
    
    scholar_data, scholar_error = make_api_request(
        API_CONFIG['scrapingdog']['scholar_url'], 
        scholar_params, 
        'Scholar'
    )
    
    if scholar_data:
        if isinstance(scholar_data, dict) and 'scholar_results' in scholar_data:
            results['scholar'] = scholar_data['scholar_results']
            results['api_status']['scholar'] = 'success'
        else:
            print("Unexpected Scholar API response format:", scholar_data)
            results['api_status']['scholar'] = 'error'
            results['errors'].append("Unexpected Scholar API response format")
    else:
        results['api_status']['scholar'] = 'error'
        results['errors'].append(scholar_error)
        # Use fallback data if API fails
        if API_CONFIG['fallback']['enabled']:
            results['scholar'] = get_fallback_scholar_data(query)
            results['api_status']['scholar'] = 'fallback'
    
    # YouTube API request
    youtube_params = {
        "api_key": API_CONFIG['scrapingdog']['api_key'],
        "search_query": query,
        "country": "us",
        "language": "en",
        "sp": "",
    }
    
    youtube_data, youtube_error = make_api_request(
        API_CONFIG['scrapingdog']['youtube_url'], 
        youtube_params, 
        'YouTube'
    )
    
    if youtube_data:
        results['youtube'] = clean_youtube_data(youtube_data)
        results['api_status']['youtube'] = 'success'
    else:
        results['api_status']['youtube'] = 'error'
        results['errors'].append(youtube_error)
        # Use fallback data if API fails
        if API_CONFIG['fallback']['enabled']:
            results['youtube'] = get_fallback_youtube_data(query)
            results['api_status']['youtube'] = 'fallback'
    
    # Include response info for debugging
    response_info = {
        'query': query,
        'scholar_results_count': len(results['scholar']),
        'youtube_results_count': len(results['youtube']),
        'timestamp': datetime.now().isoformat(),
        'cache_hit': False
    }
    
    # Add the response info to the results
    results['debug_info'] = response_info
    
    # Cache the result
    set_cached_data(cache_key, results)
    
    return jsonify(results)

@app.route('/test_youtube', methods=['GET'])
def test_youtube():
    """Endpoint to directly test the YouTube API"""
    query = request.args.get('query', 'python programming')
    
    youtube_params = {
        "api_key": API_CONFIG['scrapingdog']['api_key'],
        "search_query": query,
        "country": "us",
        "language": "en",
        "sp": "",
    }
    
    youtube_data, youtube_error = make_api_request(
        API_CONFIG['scrapingdog']['youtube_url'], 
        youtube_params, 
        'YouTube'
    )
    
    if youtube_data:
        return jsonify({
            "raw_response": youtube_data,
            "processed_videos": clean_youtube_data(youtube_data),
            "status": "success"
        })
    else:
        return jsonify({
            "error": youtube_error,
            "status": "error",
            "fallback_available": API_CONFIG['fallback']['enabled']
        })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "api_config": {
            "scrapingdog_configured": bool(API_CONFIG['scrapingdog']['api_key']),
            "fallback_enabled": API_CONFIG['fallback']['enabled']
        }
    })

@app.route('/cache/clear', methods=['POST'])
def clear_cache():
    """Clear the cache"""
    global cache
    cache.clear()
    return jsonify({"message": "Cache cleared successfully"})

@app.route('/cache/stats', methods=['GET'])
def cache_stats():
    """Get cache statistics"""
    return jsonify({
        "cache_size": len(cache),
        "cache_keys": list(cache.keys()),
        "cache_config": {
            "duration": API_CONFIG['fallback']['cache_duration'],
            "enabled": API_CONFIG['fallback']['enabled']
        }
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 4004))  # Use PORT env var or default to 4004
    print(f"[ROCKET] AI Library Service starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)