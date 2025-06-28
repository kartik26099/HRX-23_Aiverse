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

def get_curated_scholar_data(query):
    """Provide curated academic and external resources when API is unavailable"""
    query_lower = query.lower()
    
    # Curated external resources database
    curated_resources = {
        'artificial intelligence': [
            {
                'title': 'Introduction to Artificial Intelligence - Stanford CS221',
                'authors': 'Stanford University',
                'abstract': 'Comprehensive introduction to AI concepts, machine learning, and intelligent systems.',
                'citations': 'Highly Cited',
                'year': 2023,
                'url': 'https://stanford-cs221.github.io/',
                'link': 'https://stanford-cs221.github.io/',
                'snippet': 'Comprehensive introduction to AI concepts, machine learning, and intelligent systems.',
                'publication_info': {
                    'summary': 'Stanford University - 2023'
                },
                'source': 'Stanford University'
            },
            {
                'title': 'MIT OpenCourseWare - Introduction to Computer Science and Programming',
                'authors': 'MIT',
                'abstract': 'Free course materials covering programming fundamentals and computational thinking.',
                'citations': 'Educational Resource',
                'year': 2023,
                'url': 'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/',
                'link': 'https://ocw.mit.edu/courses/6-0001-introduction-to-computer-science-and-programming-in-python-fall-2016/',
                'snippet': 'Free course materials covering programming fundamentals and computational thinking.',
                'publication_info': {
                    'summary': 'MIT OpenCourseWare - 2023'
                },
                'source': 'MIT OpenCourseWare'
            },
            {
                'title': 'Deep Learning Specialization - Coursera',
                'authors': 'Andrew Ng',
                'abstract': 'Comprehensive deep learning course covering neural networks, CNNs, RNNs, and more.',
                'citations': 'Popular Course',
                'year': 2023,
                'url': 'https://www.coursera.org/specializations/deep-learning',
                'link': 'https://www.coursera.org/specializations/deep-learning',
                'snippet': 'Comprehensive deep learning course covering neural networks, CNNs, RNNs, and more.',
                'publication_info': {
                    'summary': 'Coursera - Andrew Ng - 2023'
                },
                'source': 'Coursera'
            }
        ],
        'machine learning': [
            {
                'title': 'Machine Learning Course - Andrew Ng',
                'authors': 'Andrew Ng',
                'abstract': 'Foundational machine learning course covering algorithms, applications, and best practices.',
                'citations': 'Highly Cited',
                'year': 2023,
                'url': 'https://www.coursera.org/learn/machine-learning',
                'link': 'https://www.coursera.org/learn/machine-learning',
                'snippet': 'Foundational machine learning course covering algorithms, applications, and best practices.',
                'publication_info': {
                    'summary': 'Coursera - Andrew Ng - 2023'
                },
                'source': 'Coursera'
            },
            {
                'title': 'Scikit-learn Documentation and Tutorials',
                'authors': 'Scikit-learn Contributors',
                'abstract': 'Comprehensive documentation and tutorials for machine learning with Python.',
                'citations': 'Official Documentation',
                'year': 2023,
                'url': 'https://scikit-learn.org/stable/tutorial/',
                'link': 'https://scikit-learn.org/stable/tutorial/',
                'snippet': 'Comprehensive documentation and tutorials for machine learning with Python.',
                'publication_info': {
                    'summary': 'Scikit-learn - Official Documentation - 2023'
                },
                'source': 'Scikit-learn'
            }
        ],
        'python': [
            {
                'title': 'Python for Everybody - University of Michigan',
                'authors': 'Dr. Charles Severance',
                'abstract': 'Complete Python programming course for beginners to advanced users.',
                'citations': 'Educational Resource',
                'year': 2023,
                'url': 'https://www.py4e.com/',
                'link': 'https://www.py4e.com/',
                'snippet': 'Complete Python programming course for beginners to advanced users.',
                'publication_info': {
                    'summary': 'University of Michigan - Dr. Charles Severance - 2023'
                },
                'source': 'University of Michigan'
            },
            {
                'title': 'Real Python Tutorials',
                'authors': 'Real Python Team',
                'abstract': 'High-quality Python tutorials covering everything from basics to advanced topics.',
                'citations': 'Popular Resource',
                'year': 2023,
                'url': 'https://realpython.com/',
                'link': 'https://realpython.com/',
                'snippet': 'High-quality Python tutorials covering everything from basics to advanced topics.',
                'publication_info': {
                    'summary': 'Real Python - Tutorials - 2023'
                },
                'source': 'Real Python'
            }
        ],
        'web development': [
            {
                'title': 'The Odin Project - Full Stack Web Development',
                'authors': 'The Odin Project Community',
                'abstract': 'Free curriculum for learning full-stack web development from scratch.',
                'citations': 'Community Resource',
                'year': 2023,
                'url': 'https://www.theodinproject.com/',
                'link': 'https://www.theodinproject.com/',
                'snippet': 'Free curriculum for learning full-stack web development from scratch.',
                'publication_info': {
                    'summary': 'The Odin Project - Community Resource - 2023'
                },
                'source': 'The Odin Project'
            },
            {
                'title': 'MDN Web Docs - Web Development Resources',
                'authors': 'Mozilla Developer Network',
                'abstract': 'Comprehensive documentation for web technologies and development.',
                'citations': 'Official Documentation',
                'year': 2023,
                'url': 'https://developer.mozilla.org/',
                'link': 'https://developer.mozilla.org/',
                'snippet': 'Comprehensive documentation for web technologies and development.',
                'publication_info': {
                    'summary': 'Mozilla Developer Network - Official Documentation - 2023'
                },
                'source': 'Mozilla'
            }
        ],
        'data science': [
            {
                'title': 'Data Science Specialization - Johns Hopkins',
                'authors': 'Johns Hopkins University',
                'abstract': 'Comprehensive data science course covering R programming, statistics, and machine learning.',
                'citations': 'Academic Course',
                'year': 2023,
                'url': 'https://www.coursera.org/specializations/jhu-data-science',
                'link': 'https://www.coursera.org/specializations/jhu-data-science',
                'snippet': 'Comprehensive data science course covering R programming, statistics, and machine learning.',
                'publication_info': {
                    'summary': 'Johns Hopkins University - Academic Course - 2023'
                },
                'source': 'Johns Hopkins University'
            },
            {
                'title': 'Kaggle Learn - Data Science Courses',
                'authors': 'Kaggle',
                'abstract': 'Free data science courses covering Python, SQL, machine learning, and more.',
                'citations': 'Platform Resource',
                'year': 2023,
                'url': 'https://www.kaggle.com/learn',
                'link': 'https://www.kaggle.com/learn',
                'snippet': 'Free data science courses covering Python, SQL, machine learning, and more.',
                'publication_info': {
                    'summary': 'Kaggle - Platform Resource - 2023'
                },
                'source': 'Kaggle'
            }
        ]
    }
    
    # Find matching resources
    matching_resources = []
    for topic, resources in curated_resources.items():
        if topic in query_lower or any(word in query_lower for word in topic.split()):
            matching_resources.extend(resources)
    
    # If no specific match, return general programming resources
    if not matching_resources:
        matching_resources = [
            {
                'title': 'freeCodeCamp - Learn to Code for Free',
                'authors': 'freeCodeCamp',
                'abstract': 'Learn web development, data science, and programming with free interactive tutorials.',
                'citations': 'Popular Platform',
                'year': 2023,
                'url': 'https://www.freecodecamp.org/',
                'link': 'https://www.freecodecamp.org/',
                'snippet': 'Learn web development, data science, and programming with free interactive tutorials.',
                'publication_info': {
                    'summary': 'freeCodeCamp - Popular Platform - 2023'
                },
                'source': 'freeCodeCamp'
            },
            {
                'title': 'GitHub Learning Lab',
                'authors': 'GitHub',
                'abstract': 'Learn Git and GitHub through interactive courses and real-world projects.',
                'citations': 'Official Resource',
                'year': 2023,
                'url': 'https://lab.github.com/',
                'link': 'https://lab.github.com/',
                'snippet': 'Learn Git and GitHub through interactive courses and real-world projects.',
                'publication_info': {
                    'summary': 'GitHub - Official Resource - 2023'
                },
                'source': 'GitHub'
            }
        ]
    
    return matching_resources[:5]  # Return top 5 results

def get_curated_youtube_data(query):
    """Provide curated YouTube videos when API is unavailable"""
    query_lower = query.lower()
    
    # Curated YouTube videos database
    curated_videos = {
        'artificial intelligence': [
            {
                'title': 'Machine Learning & Artificial Intelligence: Crash Course Computer Science #34',
                'link': 'https://www.youtube.com/watch?v=z-EtmaFJieY',
                'thumbnail': 'https://img.youtube.com/vi/z-EtmaFJieY/mqdefault.jpg',
                'channel': 'CrashCourse',
                'views': '2.1M views',
                'published_date': '2017',
                'length': '11:51',
                'description': 'Learn about machine learning and artificial intelligence in this comprehensive overview.',
                'source': 'Curated YouTube'
            },
            {
                'title': 'What is Artificial Intelligence? | Artificial Intelligence In 5 Minutes | AI Explained',
                'link': 'https://www.youtube.com/watch?v=ad79nYk2keg',
                'thumbnail': 'https://img.youtube.com/vi/ad79nYk2keg/mqdefault.jpg',
                'channel': 'Simplilearn',
                'views': '1.8M views',
                'published_date': '2021',
                'length': '5:28',
                'description': 'Quick introduction to AI concepts and applications.',
                'source': 'Curated YouTube'
            }
        ],
        'machine learning': [
            {
                'title': 'Machine Learning for Everybody – Full Course',
                'link': 'https://www.youtube.com/watch?v=i_LwzRVP7bg',
                'thumbnail': 'https://img.youtube.com/vi/i_LwzRVP7bg/mqdefault.jpg',
                'channel': 'freeCodeCamp.org',
                'views': '1.2M views',
                'published_date': '2021',
                'length': '3:53:53',
                'description': 'Complete machine learning course for beginners.',
                'source': 'Curated YouTube'
            },
            {
                'title': 'Machine Learning Tutorial for Beginners - 2023',
                'link': 'https://www.youtube.com/watch?v=KNAWp2S3w94',
                'thumbnail': 'https://img.youtube.com/vi/KNAWp2S3w94/mqdefault.jpg',
                'channel': 'Programming with Mosh',
                'views': '890K views',
                'published_date': '2023',
                'length': '1:25:20',
                'description': 'Comprehensive ML tutorial with practical examples.',
                'source': 'Curated YouTube'
            }
        ],
        'python': [
            {
                'title': 'Python for Beginners - Learn Python in 1 Hour',
                'link': 'https://www.youtube.com/watch?v=kqtD5dpn9C8',
                'thumbnail': 'https://img.youtube.com/vi/kqtD5dpn9C8/mqdefault.jpg',
                'channel': 'Programming with Mosh',
                'views': '3.2M views',
                'published_date': '2021',
                'length': '1:03:21',
                'description': 'Complete Python tutorial for beginners.',
                'source': 'Curated YouTube'
            },
            {
                'title': 'Learn Python - Full Course for Beginners [Tutorial]',
                'link': 'https://www.youtube.com/watch?v=rfscVS0vtbw',
                'thumbnail': 'https://img.youtube.com/vi/rfscVS0vtbw/mqdefault.jpg',
                'channel': 'freeCodeCamp.org',
                'views': '44M views',
                'published_date': '2018',
                'length': '4:26:52',
                'description': 'Comprehensive Python course covering all fundamentals.',
                'source': 'Curated YouTube'
            }
        ],
        'web development': [
            {
                'title': 'Web Development Full Course - 10 Hours | Learn Web Development from Scratch',
                'link': 'https://www.youtube.com/watch?v=8jLOx1hD3_o',
                'thumbnail': 'https://img.youtube.com/vi/8jLOx1hD3_o/mqdefault.jpg',
                'channel': 'edureka!',
                'views': '1.5M views',
                'published_date': '2020',
                'length': '10:00:00',
                'description': 'Complete web development course covering HTML, CSS, JavaScript, and more.',
                'source': 'Curated YouTube'
            },
            {
                'title': 'Full Stack Web Development for Beginners (Full Course on HTML, CSS, JavaScript, Node.js, MongoDB)',
                'link': 'https://www.youtube.com/watch?v=Oe421EPjeBE',
                'thumbnail': 'https://img.youtube.com/vi/Oe421EPjeBE/mqdefault.jpg',
                'channel': 'freeCodeCamp.org',
                'views': '2.8M views',
                'published_date': '2021',
                'length': '6:31:07',
                'description': 'Complete full-stack development tutorial.',
                'source': 'Curated YouTube'
            }
        ],
        'data science': [
            {
                'title': 'Data Science Full Course - Learn Data Science in 10 Hours | Data Science For Beginners',
                'link': 'https://www.youtube.com/watch?v=ua-CiDNNj30',
                'thumbnail': 'https://img.youtube.com/vi/ua-CiDNNj30/mqdefault.jpg',
                'channel': 'edureka!',
                'views': '1.1M views',
                'published_date': '2020',
                'length': '10:00:00',
                'description': 'Complete data science course covering Python, statistics, and machine learning.',
                'source': 'Curated YouTube'
            },
            {
                'title': 'Data Science Tutorial For Beginners | Introduction to Data Science | Data Science Training',
                'link': 'https://www.youtube.com/watch?v=X3paOmcrTjQ',
                'thumbnail': 'https://img.youtube.com/vi/X3paOmcrTjQ/mqdefault.jpg',
                'channel': 'edureka!',
                'views': '2.3M views',
                'published_date': '2019',
                'length': '1:51:36',
                'description': 'Introduction to data science concepts and tools.',
                'source': 'Curated YouTube'
            }
        ]
    }
    
    # Find matching videos
    matching_videos = []
    for topic, videos in curated_videos.items():
        if topic in query_lower or any(word in query_lower for word in topic.split()):
            matching_videos.extend(videos)
    
    # If no specific match, return general programming videos
    if not matching_videos:
        matching_videos = [
            {
                'title': 'How to Learn to Code - 8 Hard Truths',
                'link': 'https://www.youtube.com/watch?v=VDXbzQvJQqE',
                'thumbnail': 'https://img.youtube.com/vi/VDXbzQvJQqE/mqdefault.jpg',
                'channel': 'Fireship',
                'views': '1.7M views',
                'published_date': '2022',
                'length': '8:09',
                'description': 'Honest advice for learning to code effectively.',
                'source': 'Curated YouTube'
            },
            {
                'title': 'Programming vs Coding - What\'s the difference?',
                'link': 'https://www.youtube.com/watch?v=GJ8jidDd3KA',
                'thumbnail': 'https://img.youtube.com/vi/GJ8jidDd3KA/mqdefault.jpg',
                'channel': 'Aaron Jack',
                'views': '2.1M views',
                'published_date': '2021',
                'length': '8:55',
                'description': 'Understanding the difference between programming and coding.',
                'source': 'Curated YouTube'
            }
        ]
    
    return matching_videos[:6]  # Return top 6 results

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
            'scholar': 'curated',
            'youtube': 'curated'
        },
        'errors': []
    }
    
    # Always provide curated resources first
    results['scholar'] = get_curated_scholar_data(query)
    results['youtube'] = get_curated_youtube_data(query)
    
    # Only try API calls if we have a valid API key and user specifically requests it
    use_api = request.args.get('use_api', 'false').lower() == 'true'
    api_key_available = bool(API_CONFIG['scrapingdog']['api_key'])
    
    if use_api and api_key_available:
        print(f"API requested for query: {query}")
        
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
                # Combine API results with curated results
                api_results = scholar_data['scholar_results']
                results['scholar'] = api_results + results['scholar'][:2]  # Keep top 2 curated as backup
                results['api_status']['scholar'] = 'success'
            else:
                print("Unexpected Scholar API response format:", scholar_data)
                results['api_status']['scholar'] = 'error'
                results['errors'].append("Unexpected Scholar API response format")
        else:
            results['api_status']['scholar'] = 'error'
            results['errors'].append(scholar_error)
        
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
            api_videos = clean_youtube_data(youtube_data)
            results['youtube'] = api_videos + results['youtube'][:2]  # Keep top 2 curated as backup
            results['api_status']['youtube'] = 'success'
        else:
            results['api_status']['youtube'] = 'error'
            results['errors'].append(youtube_error)
    
    # Include response info for debugging
    response_info = {
        'query': query,
        'scholar_results_count': len(results['scholar']),
        'youtube_results_count': len(results['youtube']),
        'timestamp': datetime.now().isoformat(),
        'cache_hit': False,
        'data_source': 'curated' if not use_api else 'mixed'
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

@app.route('/curated', methods=['GET'])
def get_curated_resources():
    """Get curated resources directly without API calls"""
    query = request.args.get('query', '')
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400
    
    results = {
        'scholar': get_curated_scholar_data(query),
        'youtube': get_curated_youtube_data(query),
        'api_status': {
            'scholar': 'curated',
            'youtube': 'curated'
        },
        'info': {
            'query': query,
            'timestamp': datetime.now().isoformat(),
            'data_source': 'curated',
            'description': 'High-quality curated educational resources'
        }
    }
    
    return jsonify(results)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "api_config": {
            "scrapingdog_configured": bool(API_CONFIG['scrapingdog']['api_key']),
            "fallback_enabled": API_CONFIG['fallback']['enabled']
        },
        "features": {
            "curated_resources": True,
            "youtube_videos": True,
            "external_links": True,
            "cache_enabled": True
        },
        "supported_topics": [
            "artificial intelligence",
            "machine learning", 
            "python",
            "web development",
            "data science"
        ]
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