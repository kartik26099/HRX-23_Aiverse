from flask import Flask, request, jsonify
import requests
import os
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

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
                        'description': item.get('description', '')
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
                    'description': item.get('description', '')
                }
                videos.append(video)
    
    print(f"Found {len(videos)} videos")
    return videos

@app.route('/search', methods=['GET'])
def search_api():
    query = request.args.get('query', '')
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400
    
    # Get API key from environment variable or use the default
    api_key = os.getenv('Scholarly_api')
    
    results = {
        'scholar': [],
        'youtube': []
    }
    
    # Google Scholar API request
    scholar_url = "https://api.scrapingdog.com/google_scholar"
    scholar_params = {
        "api_key": api_key,
        "query": query,
        "language": "en",
        "page": 0,
        "results": 10
    }
    
    try:
        print(f"Making Scholar API request: {scholar_url} with params: {scholar_params}")
        scholar_response = requests.get(scholar_url, params=scholar_params, timeout=10)
        print(f"Scholar API response status: {scholar_response.status_code}")
        
        if scholar_response.status_code == 200:
            scholar_data = scholar_response.json()
            if isinstance(scholar_data, dict) and 'scholar_results' in scholar_data:
                results['scholar'] = scholar_data['scholar_results']
            else:
                print("Unexpected Scholar API response format:", scholar_data)
        else:
            print(f"Scholar API error response: {scholar_response.text}")
    except Exception as e:
        print(f"Scholar API error: {str(e)}")
    
    # YouTube API request
    youtube_url = "https://api.scrapingdog.com/youtube/search"
    youtube_params = {
        "api_key": api_key,
        "search_query": query,
        "country": "us",
        "language": "en",
        "sp": "",
    }
    
    try:
        print(f"Making YouTube API request: {youtube_url} with params: {youtube_params}")
        youtube_response = requests.get(youtube_url, params=youtube_params, timeout=10)
        print(f"YouTube API response status: {youtube_response.status_code}")
        
        if youtube_response.status_code == 200:
            youtube_data = youtube_response.json()
            results['youtube'] = clean_youtube_data(youtube_data)
        else:
            print(f"YouTube API error response: {youtube_response.text}")
    except Exception as e:
        print(f"YouTube API error: {str(e)}")
    
    # Include response sizes for debugging
    response_info = {
        'query': query,
        'scholar_results_count': len(results['scholar']),
        'youtube_results_count': len(results['youtube']),
    }
    print(f"Response info: {response_info}")
    
    # Add the response info to the results
    results['debug_info'] = response_info
    
    return jsonify(results)

@app.route('/test_youtube', methods=['GET'])
def test_youtube():
    """Endpoint to directly test the YouTube API"""
    query = request.args.get('query', 'python programming')
    api_key = os.getenv('Scholarly_api')
    
    youtube_url = "https://api.scrapingdog.com/youtube/search"
    youtube_params = {
        "api_key": api_key,
        "search_query": query,
        "country": "us",
        "language": "en",
        "sp": "",
    }
    
    try:
        youtube_response = requests.get(youtube_url, params=youtube_params, timeout=10)
        if youtube_response.status_code == 200:
            youtube_data = youtube_response.json()
            # Return raw response and processed videos
            return jsonify({
                "raw_response": youtube_data,
                "processed_videos": clean_youtube_data(youtube_data)
            })
        else:
            return jsonify({
                "error": "YouTube API request failed",
                "status_code": youtube_response.status_code,
                "response": youtube_response.text
            })
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 4001))
    print(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)  # Enable debug mode for development