import os
import json
import traceback
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai
import requests
import random
from flask_cors import CORS                        

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SCRAPINGDOG_API_KEY = os.getenv("SCRAPINGDOG_API_KEY")

 #  Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)  

# Configure Gemini
try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")
except Exception as e:
    print(f"Error configuring Gemini API: {str(e)}")

# Simple test route to verify server is working
@app.route('/test', methods=['GET'])
def test():
    return jsonify({"message": "Server is working!"}), 200

@app.route('/generatecourse', methods=['POST'])
def generate_course():
    try:
        data = request.get_json()
        print(f"Received data: {data}")
        
        # Check for required fields
        required_fields = ['title', 'level', 'goal', 'currentState']
        if not all(k in data for k in required_fields):
            return jsonify({"error": f"Missing required fields: {', '.join(required_fields)}"}), 400
        
        level = data['level'].lower()
        if level not in ['beginner', 'intermediate', 'advanced']:
            return jsonify({"error": "Invalid level. Choose from 'beginner', 'intermediate', or 'advanced'."}), 400
        
        # Generate course using Gemini
        course = gen_course(data['title'], level, data['goal'], data['currentState'])
        
        # Enhance course with YouTube videos
        enhanced_course = add_youtube_videos(course)
        
        return jsonify(enhanced_course), 200
    except Exception as e:
        print(f"Error in generate_course: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"error": f"Error generating course: {str(e)}"}), 500

def gen_course(title, level, goal, current_state):
    try:
        prompt = f"""
        Create a {level} level course titled "{title}" with 2 to 3 modules (each with 500 words description).
        Each module should have 2-3 subsections (each with at least 300 words description).
        The course should help a learner achieve the goal: "{goal}".
        Assume the learner is currently at this level of knowledge: "{current_state}".
        Format the output as strict JSON with this structure:
        {{
            "title": "...",
            "level": "...",
            "goal": "...",
            "modules": [
                {{
                    "title": "...",
                    "description": "...",
                    "subsections": [
                        {{
                            "title": "...",
                            "content": "..."
                        }},
                        ...
                    ]
                }},
                ...
            ]
        }}
        """
        
        print("Sending request to Gemini API...")
        response = model.generate_content(prompt)
        print(f"Gemini API response received (first 100 chars): {response.text[:100]}...")
        
        # Handle potential JSON parsing issues
        try:
            # Try direct JSON parsing first
            parsed_json = json.loads(response.text)
            return parsed_json
        except json.JSONDecodeError:
            # Try to extract JSON from markdown if it's formatted that way
            text = response.text
            if "```json" in text and "```" in text:
                json_text = text.split("```json")[1].split("```")[0].strip()
                try:
                    parsed_json = json.loads(json_text)
                    return parsed_json
                except json.JSONDecodeError:
                    pass
                
            # Try to extract without markdown formatting if it has other delimiter
            if "```" in text:
                json_text = text.split("```")[1].split("```")[0].strip()
                try:
                    parsed_json = json.loads(json_text)
                    return parsed_json
                except json.JSONDecodeError:
                    pass
            
            # Final fallback - create a basic structure
            print("Failed to parse JSON from Gemini response")
            # Convert to proper subsection format for consistency
            return {
                "title": title,
                "level": level,
                "goal": goal,
                "modules": [
                    {
                        "title": "Error in Course Generation",
                        "description": "There was an error generating the course content.",
                        "subsections": [
                            {
                                "title": "Try Again",
                                "content": "Please try again later"
                            }
                        ]
                    }
                ]
            }
    except Exception as e:
        print(f"Error in gen_course: {str(e)}")
        print(traceback.format_exc())
        raise

def generate_mock_videos_for_topic(topic):
    """Generate relevant mock YouTube videos for a given topic"""
    # Clean up topic for use in video titles
    clean_topic = topic.strip().rstrip('.').replace('&', 'and')
    
    # Common educational YouTube channels
    channels = [
        "Coursera", "Khan Academy", "edX", "Udacity", "MIT OpenCourseWare", 
        "freeCodeCamp.org", "Traversy Media", "Programming with Mosh",
        "CS Dojo", "Coding Tech", "The Net Ninja", "Academind", "DevEd"
    ]
    
    # Video title templates based on topic
    title_templates = [
        f"Introduction to {clean_topic}",
        f"{clean_topic} Tutorial for Beginners",
        f"{clean_topic} Crash Course",
        f"Complete {clean_topic} Guide",
        f"{clean_topic} Fundamentals",
        f"Learn {clean_topic} in 30 Minutes",
        f"{clean_topic} Masterclass",
        f"Advanced {clean_topic} Concepts",
        f"{clean_topic} Best Practices",
        f"Understanding {clean_topic}"
    ]
    
    # Format video IDs for common educational content
    # Using popular educational videos as fallback
    common_video_ids = [
        "rfscVS0vtbw",  # Python full course
        "OK_JCtrrv-c",  # Web development
        "Ke90Tje7VS0",  # React tutorial
        "PkZNo7MFNFg",  # JavaScript full course
        "8mAITcNt710",  # Bootstrap tutorial
        "fis26HvvDII",  # MySQL tutorial
        "srvUrASNj0s",  # Flask tutorial
        "ua-CiDNNj30",  # Data structures
        "zOjov-2OZ0E",  # UI/UX Design
        "XvHRfCJUM3g",  # Programming fundamentals
        "eIrMbAQSU34",  # Java tutorial
        "YS4e4q9oBaU",  # Full stack development
        "pQN-pnXPaVg"   # HTML & CSS
    ]
    
    videos = []
    
    # Generate 3 mock videos
    for i in range(3):
        # Create a relevant title based on the topic
        title = random.choice(title_templates)
        # Select a channel
        channel = random.choice(channels)
        # Select a video ID - we're using fixed IDs for important topics, random for others
        video_id = random.choice(common_video_ids)
        
        # Add specific video IDs for common programming topics
        if "python" in topic.lower():
            video_id = "rfscVS0vtbw"  # Comprehensive Python course
        elif "javascript" in topic.lower() or "js" in topic.lower():
            video_id = "PkZNo7MFNFg"  # JavaScript course
        elif "react" in topic.lower():
            video_id = "Ke90Tje7VS0"  # React tutorial
        elif "flask" in topic.lower():
            video_id = "srvUrASNj0s"  # Flask tutorial
        elif "html" in topic.lower() or "css" in topic.lower():
            video_id = "pQN-pnXPaVg"  # HTML & CSS
        elif "sql" in topic.lower() or "database" in topic.lower():
            video_id = "fis26HvvDII"  # MySQL tutorial
        elif "web" in topic.lower() and "develop" in topic.lower():
            video_id = "OK_JCtrrv-c"  # Web development
        
        # Create the video object
        video = {
            "title": title,
            "link": f"https://www.youtube.com/watch?v={video_id}",
            "channel": channel,
            "duration": f"{random.randint(5, 45)}:{random.randint(10, 59):02d}"
        }
        videos.append(video)
    
    return videos

def add_youtube_videos(course):
    try:
        # Check if API key is available
        if not SCRAPINGDOG_API_KEY:
            print("Warning: SCRAPINGDOG_API_KEY is not set or empty")
            return add_mock_youtube_videos(course)
            
        # Use the correct endpoint format for ScrapingDog
        url = "https://api.scrapingdog.com/scrape"
        api_key = SCRAPINGDOG_API_KEY
        
        for module in course.get("modules", []):
            query = module.get("title", "")
            if not query:
                continue
            
            # Construct a YouTube search URL that ScrapingDog can scrape
            youtube_search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
            
            # Updated parameters for ScrapingDog API
            params = {
                "api_key": api_key,
                "url": youtube_search_url,
                "dynamic": "true"  # Use dynamic scraping for JavaScript-rendered content
            }
            
            # Add proper headers
            headers = {
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            try:
                print(f"Sending request to ScrapingDog API for query: {query}")
                print(f"Request URL: {url} with YouTube search: {youtube_search_url}")
                
                response = requests.get(url, params=params, headers=headers, timeout=30)
                print(f"ScrapingDog API status code: {response.status_code}")
                
                if response.status_code == 200:
                    # Handle the raw response
                    raw_response = response.text
                    
                    # Check if the response is HTML instead of JSON
                    if raw_response.strip().startswith('<!DOCTYPE html>') or '<html' in raw_response:
                        print("Received HTML response instead of JSON")
                        print(f"HTML response preview: {raw_response[:500]}")  # Print first 500 chars to see error messages
                        module["recommended_videos"] = generate_mock_videos_for_topic(query)
                        continue
                        
                    try:
                        data = response.json()
                        
                        # Parse the scraped YouTube search results
                        videos = []
                        video_count = 0
                        
                        # This parsing will depend on the structure of the response
                        # ScrapingDog might return the HTML structure of YouTube search results
                        # Let's try to extract video information from common patterns
                        
                        # Look for video containers
                        video_items = data.get('videoRenderers', [])
                        if not video_items and isinstance(data, dict):
                            # Try to find video items in different locations of the response
                            # This is just an example - you'll need to adapt to the actual structure
                            contents = data.get('contents', {})
                            if contents:
                                two_column_browse = contents.get('twoColumnBrowseResultsRenderer', {})
                                if two_column_browse:
                                    tabs = two_column_browse.get('tabs', [{}])[0]
                                    tab_renderer = tabs.get('tabRenderer', {})
                                    if tab_renderer:
                                        content = tab_renderer.get('content', {})
                                        section_list = content.get('sectionListRenderer', {})
                                        if section_list:
                                            items = section_list.get('contents', [{}])[0]
                                            item_section = items.get('itemSectionRenderer', {})
                                            if item_section:
                                                video_items = item_section.get('contents', [])
                        
                        for item in video_items:
                            if video_count >= 1:  # Limit to 3 videos
                                break
                                
                            video_renderer = item.get('videoRenderer', {})
                            if not video_renderer:
                                continue
                                
                            video_id = video_renderer.get('videoId', '')
                            title_runs = video_renderer.get('title', {}).get('runs', [{}])
                            title = title_runs[0].get('text', 'No title') if title_runs else 'No title'
                            
                            channel_runs = video_renderer.get('ownerText', {}).get('runs', [{}])
                            channel = channel_runs[0].get('text', 'Unknown channel') if channel_runs else 'Unknown channel'
                            
                            length_text = video_renderer.get('lengthText', {}).get('simpleText', 'Unknown duration')
                            
                            if video_id:
                                video_data = {
                                    "title": title,
                                    "link": f"https://www.youtube.com/watch?v={video_id}",
                                    "channel": channel,
                                    "duration": length_text
                                }
                                videos.append(video_data)
                                video_count += 1
                        
                        # If we couldn't parse any videos, fall back to a simpler approach
                        if not videos:
                            # Try to find video IDs directly using regex
                            import re
                            video_ids = re.findall(r'watch\?v=([a-zA-Z0-9_-]{11})', raw_response)
                            
                            # Use found video IDs to create basic video objects
                            for i, vid_id in enumerate(video_ids[:1]):  # Limit to first 3 found
                                videos.append({
                                    "title": f"{query} - Video {i+1}",
                                    "link": f"https://www.youtube.com/watch?v={vid_id}",
                                    "channel": "YouTube Channel",
                                    "duration": "Unknown"
                                })
                        
                        # If we still don't have videos, use mock videos
                        if videos:
                            module["recommended_videos"] = videos
                        else:
                            print("Failed to extract videos from response, using mock videos")
                            module["recommended_videos"] = generate_mock_videos_for_topic(query)
                    except json.JSONDecodeError as e:
                        print(f"Failed to parse JSON response: {e}")
                        print(f"Response text (first 200 chars): {raw_response[:200]}...")
                        module["recommended_videos"] = generate_mock_videos_for_topic(query)
                else:
                    print(f"ScrapingDog API error: {response.status_code} - {response.text[:200]}")
                    module["recommended_videos"] = generate_mock_videos_for_topic(query)
            except requests.exceptions.RequestException as e:
                print(f"Request error fetching videos for module '{query}': {str(e)}")
                module["recommended_videos"] = generate_mock_videos_for_topic(query)
                
        return course
    except Exception as e:
        print(f"Error in add_youtube_videos: {str(e)}")
        print(traceback.format_exc())
        # Fall back to mock videos
        return add_mock_youtube_videos(course)
        
def add_mock_youtube_videos(course):
    """Add mock YouTube videos to all modules in the course"""
    for module in course.get("modules", []):
        topic = module.get("title", "")
        if topic:
            module["recommended_videos"] = generate_mock_videos_for_topic(topic)
    return course

if __name__ == '__main__':
    # Run the Flask app
    
   
    app.run(host='0.0.0.0', debug=True,port=5002)