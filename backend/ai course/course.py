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
CORS(app, origins=[
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",  # Keep for backward compatibility
    "http://127.0.0.1:3000"   # Keep for backward compatibility
])  

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
        if not SCRAPINGDOG_API_KEY:
            print("Warning: SCRAPINGDOG_API_KEY is not set. Using mock videos.")
            return add_mock_youtube_videos(course)
            
        # Use the correct ScrapingDog YouTube Search API endpoint
        search_url = "https://api.scrapingdog.com/youtube/search"
        
        for module in course.get("modules", []):
            query = module.get("title", "")
            if not query:
                continue

            print(f"Searching for videos for module: {query}")
            
            params = {
                'api_key': SCRAPINGDOG_API_KEY,
                'search_query': query,
                'country': 'us'
            }
            
            try:
                response = requests.get(search_url, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Ensure data is a list of videos
                    videos_data = data if isinstance(data, list) else data.get('results', [])
                    if not isinstance(videos_data, list):
                        videos_data = [] # Fallback if format is unexpected

                    videos = []
                    for video in videos_data[:3]: # Get top 3 videos
                        if isinstance(video, dict):
                            videos.append({
                                'title': video.get('title', 'N/A'),
                                'link': video.get('link', ''),
                                'channel': video.get('channel', {}).get('name', 'N/A') if isinstance(video.get('channel'), dict) else 'N/A',
                                'duration': video.get('length', 'N/A'),
                            })
                    module['videos'] = videos
                    print(f"Found {len(videos)} videos for '{query}'")
                else:
                    print(f"Error fetching videos for '{query}': {response.status_code} - {response.text}")
                    module['videos'] = generate_mock_videos_for_topic(query)

            except requests.exceptions.RequestException as e:
                print(f"Request failed for '{query}': {e}")
                module['videos'] = generate_mock_videos_for_topic(query)
                
    except Exception as e:
        print(f"An unexpected error occurred in add_youtube_videos: {e}")
        traceback.print_exc()

    return course

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