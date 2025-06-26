import os
import json
import traceback
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai
import requests
import random
from flask_cors import CORS
import re

load_dotenv()

# API Key Configuration - Use consistent naming
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("gemini_api_key_research") or os.getenv("gemini_api_key_road_map")
SCRAPINGDOG_API_KEY = os.getenv("SCRAPINGDOG_API_KEY")

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",  # Keep for backward compatibility
    "http://127.0.0.1:3000"   # Keep for backward compatibility
])

# Configure Gemini with better error handling
model = None
try:
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        print(f"✅ Gemini API configured successfully")
    else:
        print("⚠️ GEMINI_API_KEY not found. Course generation will use fallback.")
except Exception as e:
    print(f"❌ Error configuring Gemini API: {str(e)}")

# Simple test route to verify server is working
@app.route('/test', methods=['GET'])
def test():
    return jsonify({
        "message": "AI Course Generator is working!",
        "gemini_configured": model is not None,
        "scrapingdog_configured": bool(SCRAPINGDOG_API_KEY),
        "port": int(os.getenv('PORT', 4007))
    }), 200

@app.route('/test-youtube-api', methods=['GET'])
def test_youtube_api():
    """Test endpoint to verify YouTube API functionality"""
    try:
        if not SCRAPINGDOG_API_KEY:
            return jsonify({
                "status": "warning",
                "message": "SCRAPINGDOG_API_KEY not configured",
                "fallback": "Mock videos will be used"
            }), 200
        
        # Test with a simple query
        search_url = "https://api.scrapingdog.com/youtube/search"
        params = {
            'api_key': SCRAPINGDOG_API_KEY,
            'search_query': 'Node.js tutorial',
            'country': 'us'
        }
        
        response = requests.get(search_url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            videos_data = data if isinstance(data, list) else data.get('results', [])
            
            return jsonify({
                "status": "success",
                "api_key_configured": True,
                "response_status": response.status_code,
                "videos_found": len(videos_data) if isinstance(videos_data, list) else 0,
                "sample_response": data[:2] if isinstance(data, list) and len(data) > 0 else "No videos found"
            }), 200
        else:
            return jsonify({
                "status": "error",
                "api_key_configured": True,
                "response_status": response.status_code,
                "error_message": response.text,
                "fallback": "Mock videos will be used"
            }), 200
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "api_key_configured": bool(SCRAPINGDOG_API_KEY),
            "error": str(e),
            "fallback": "Mock videos will be used"
        }), 200

@app.route('/generatecourse', methods=['POST'])
def generate_course():
    try:
        data = request.get_json()
        print(f"Received data: {data}")
        
        # Check for required fields with better validation
        required_fields = ['title', 'level', 'goal', 'currentState']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "required_fields": required_fields
            }), 400
        
        # Validate level
        level = data['level'].lower()
        valid_levels = ['beginner', 'intermediate', 'advanced']
        if level not in valid_levels:
            return jsonify({
                "error": f"Invalid level '{level}'. Choose from: {', '.join(valid_levels)}"
            }), 400
        
        # Validate input lengths
        if len(data['title']) < 3:
            return jsonify({"error": "Course title must be at least 3 characters long"}), 400
        
        if len(data['goal']) < 10:
            return jsonify({"error": "Learning goal must be at least 10 characters long"}), 400
        
        if len(data['currentState']) < 5:
            return jsonify({"error": "Current knowledge must be at least 5 characters long"}), 400
        
        # Generate course using Gemini or fallback
        if model:
            course = gen_course(data['title'], level, data['goal'], data['currentState'])
        else:
            course = generate_fallback_course(data['title'], level, data['goal'], data['currentState'])
        
        # Enhance course with YouTube videos
        enhanced_course = add_youtube_videos(course)
        
        return jsonify(enhanced_course), 200
        
    except Exception as e:
        print(f"Error in generate_course: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "error": f"Error generating course: {str(e)}",
            "fallback_available": True
        }), 500

@app.route('/generatemultiplecourses', methods=['POST'])
def generate_multiple_courses():
    """Generate multiple courses based on a single topic with different approaches"""
    try:
        data = request.get_json()
        print(f"Received data for multiple courses: {data}")
        
        # Check for required fields
        required_fields = ['title', 'level', 'goal', 'currentState']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                "error": f"Missing required fields: {', '.join(missing_fields)}",
                "required_fields": required_fields
            }), 400
        
        # Validate input
        level = data['level'].lower()
        valid_levels = ['beginner', 'intermediate', 'advanced']
        if level not in valid_levels:
            return jsonify({
                "error": f"Invalid level '{level}'. Choose from: {', '.join(valid_levels)}"
            }), 400
        
        if len(data['title']) < 3:
            return jsonify({"error": "Course title must be at least 3 characters long"}), 400
        
        # Generate multiple courses with different approaches
        courses = []
        
        # Course 1: Theoretical/Conceptual approach
        theoretical_prompt = f"""
        Create a {level} level course titled "{data['title']}" with a theoretical/conceptual approach.
        Focus on understanding core concepts, principles, and foundational knowledge.
        
        Course Goal: {data['goal']}
        Current Knowledge Level: {data['currentState']}
        
        Requirements:
        - Each module description should be 100-150 words maximum
        - Each subsection content should be 80-120 words maximum
        - Focus on concepts, theories, and understanding
        - Structure should be logical and progressive
        
        Return ONLY valid JSON with this exact structure:
        {{
            "title": "Course Title (Theoretical Approach)",
            "level": "{level}",
            "goal": "{data['goal']}",
            "modules": [
                {{
                    "title": "Module Title",
                    "description": "Concise module description (100-150 words)",
                    "subsections": [
                        {{
                            "title": "Subsection Title",
                            "content": "Concise subsection content (80-120 words)"
                        }}
                    ]
                }}
            ]
        }}
        """
        
        # Course 2: Practical/Hands-on approach
        practical_prompt = f"""
        Create a {level} level course titled "{data['title']}" with a practical/hands-on approach.
        Focus on real-world applications, projects, and practical skills.
        
        Course Goal: {data['goal']}
        Current Knowledge Level: {data['currentState']}
        
        Requirements:
        - Each module description should be 100-150 words maximum
        - Each subsection content should be 80-120 words maximum
        - Focus on practical applications, projects, and hands-on learning
        - Structure should be logical and progressive
        
        Return ONLY valid JSON with this exact structure:
        {{
            "title": "Course Title (Practical Approach)",
            "level": "{level}",
            "goal": "{data['goal']}",
            "modules": [
                {{
                    "title": "Module Title",
                    "description": "Concise module description (100-150 words)",
                    "subsections": [
                        {{
                            "title": "Subsection Title",
                            "content": "Concise subsection content (80-120 words)"
                        }}
                    ]
                }}
            ]
        }}
        """
        
        # Course 3: Industry-focused approach
        industry_prompt = f"""
        Create a {level} level course titled "{data['title']}" with an industry-focused approach.
        Focus on industry standards, best practices, and career preparation.
        
        Course Goal: {data['goal']}
        Current Knowledge Level: {data['currentState']}
        
        Requirements:
        - Each module description should be 100-150 words maximum
        - Each subsection content should be 80-120 words maximum
        - Focus on industry standards, tools, and career preparation
        - Structure should be logical and progressive
        
        Return ONLY valid JSON with this exact structure:
        {{
            "title": "Course Title (Industry Approach)",
            "level": "{level}",
            "goal": "{data['goal']}",
            "modules": [
                {{
                    "title": "Module Title",
                    "description": "Concise module description (100-150 words)",
                    "subsections": [
                        {{
                            "title": "Subsection Title",
                            "content": "Concise subsection content (80-120 words)"
                        }}
                    ]
                }}
            ]
        }}
        """
        
        prompts = [theoretical_prompt, practical_prompt, industry_prompt]
        
        for i, prompt in enumerate(prompts):
            try:
                print(f"Generating course {i+1}...")
                response = model.generate_content(prompt)
                parsed_json = parse_gemini_response(response.text)
                
                if parsed_json:
                    # Enhance with videos
                    enhanced_course = add_youtube_videos(parsed_json)
                    courses.append(enhanced_course)
                else:
                    # Use fallback for this course
                    fallback_course = generate_fallback_course(
                        f"{data['title']} - Course {i+1}", 
                        level, 
                        data['goal'], 
                        data['currentState']
                    )
                    enhanced_course = add_youtube_videos(fallback_course)
                    courses.append(enhanced_course)
                    
            except Exception as e:
                print(f"Error generating course {i+1}: {str(e)}")
                # Use fallback for this course
                fallback_course = generate_fallback_course(
                    f"{data['title']} - Course {i+1}", 
                    level, 
                    data['goal'], 
                    data['currentState']
                )
                enhanced_course = add_youtube_videos(fallback_course)
                courses.append(enhanced_course)
        
        return jsonify({"courses": courses}), 200
        
    except Exception as e:
        print(f"Error in generate_multiple_courses: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "error": f"Error generating multiple courses: {str(e)}",
            "fallback_available": True
        }), 500

def validate_course_structure(course):
    """Validate that the generated course has the required structure"""
    try:
        required_fields = ['title', 'level', 'goal', 'modules']
        if not all(field in course for field in required_fields):
            return False
        
        if not isinstance(course['modules'], list) or len(course['modules']) == 0:
            return False
        
        for module in course['modules']:
            if not isinstance(module, dict):
                return False
            if 'title' not in module or 'description' not in module or 'subsections' not in module:
                return False
            if not isinstance(module['subsections'], list) or len(module['subsections']) == 0:
                return False
            
            for subsection in module['subsections']:
                if not isinstance(subsection, dict):
                    return False
                if 'title' not in subsection or 'content' not in subsection:
                    return False
        
        return True
    except Exception:
        return False

def generate_fallback_course(title, level, goal, current_state):
    """Generate a fallback course when AI generation fails"""
    return {
        "title": title,
        "level": level,
        "goal": goal,
        "modules": [
            {
                "title": f"Introduction to {title}",
                "description": f"Learn the fundamental concepts and principles of {title}. This module provides the essential foundation needed to understand the core concepts and their practical applications in real-world scenarios.",
                "subsections": [
                    {
                        "title": "Core Concepts",
                        "content": f"Understand the basic principles and key concepts of {title}. Learn about the fundamental building blocks and how they work together to achieve your learning goals."
                    },
                    {
                        "title": "Getting Started",
                        "content": f"Set up your learning environment and prepare for hands-on practice. Learn about essential tools, resources, and best practices for effective learning."
                    }
                ]
            },
            {
                "title": f"Practical Applications of {title}",
                "description": f"Apply your knowledge through hands-on projects and real-world examples. This module focuses on practical implementation and building confidence through active learning.",
                "subsections": [
                    {
                        "title": "Hands-on Practice",
                        "content": f"Work through practical exercises and mini-projects to reinforce your understanding. Apply theoretical concepts to solve real problems and build practical skills."
                    },
                    {
                        "title": "Common Use Cases",
                        "content": f"Explore typical applications and scenarios where {title} is used. Understand industry best practices and how to approach different types of challenges."
                    }
                ]
            },
            {
                "title": f"Advanced {title} Techniques",
                "description": f"Master advanced techniques and optimization strategies. Learn how to improve performance, handle complex scenarios, and implement best practices for professional development.",
                "subsections": [
                    {
                        "title": "Optimization Strategies",
                        "content": f"Learn techniques to improve efficiency and performance. Understand how to optimize your approach and handle more complex scenarios effectively."
                    },
                    {
                        "title": "Best Practices",
                        "content": f"Master industry-standard practices and methodologies. Learn how to write maintainable, scalable solutions and avoid common pitfalls."
                    }
                ]
            }
        ]
    }

def gen_course(title, level, goal, current_state):
    try:
        if not model:
            return generate_fallback_course(title, level, goal, current_state)
        
        prompt = f"""
        Create a structured {level} level course titled "{title}" with 3-4 modules.
        Each module should have 2-3 subsections with concise, practical content.
        
        Course Goal: {goal}
        Current Knowledge Level: {current_state}
        
        Requirements:
        - Each module description should be 100-150 words maximum
        - Each subsection content should be 80-120 words maximum
        - Content should be practical and actionable
        - Structure should be logical and progressive
        - Focus on key concepts and hands-on learning
        
        Return ONLY valid JSON with this exact structure:
        {{
            "title": "Course Title",
            "level": "{level}",
            "goal": "{goal}",
            "modules": [
                {{
                    "title": "Module Title",
                    "description": "Concise module description (100-150 words)",
                    "subsections": [
                        {{
                            "title": "Subsection Title",
                            "content": "Concise subsection content (80-120 words)"
                        }}
                    ]
                }}
            ]
        }}
        
        Ensure the JSON is properly formatted and valid.
        """
        
        print("Sending request to Gemini API...")
        response = model.generate_content(prompt)
        print(f"Gemini API response received (first 200 chars): {response.text[:200]}...")
        
        # Improved JSON parsing with multiple fallback strategies
        parsed_json = parse_gemini_response(response.text)
        
        if parsed_json:
            return parsed_json
        else:
            print("Failed to parse JSON from Gemini response, using fallback")
            return generate_fallback_course(title, level, goal, current_state)
            
    except Exception as e:
        print(f"Error in gen_course: {str(e)}")
        print(traceback.format_exc())
        return generate_fallback_course(title, level, goal, current_state)

def parse_gemini_response(text):
    """Parse Gemini response with multiple fallback strategies"""
    try:
        # Strategy 1: Direct JSON parsing
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    try:
        # Strategy 2: Extract JSON from markdown code blocks
        json_patterns = [
            r'```json\s*(\{.*?\})\s*```',
            r'```\s*(\{.*?\})\s*```',
            r'`(\{.*?\})`'
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, text, re.DOTALL)
            if matches:
                for match in matches:
                    try:
                        return json.loads(match)
                    except json.JSONDecodeError:
                        continue
    except Exception:
        pass
    
    try:
        # Strategy 3: Find JSON object in text
        # Look for content between { and } that might be JSON
        brace_count = 0
        start_index = -1
        json_text = ""
        
        for i, char in enumerate(text):
            if char == '{':
                if brace_count == 0:
                    start_index = i
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0 and start_index != -1:
                    json_text = text[start_index:i+1]
                    try:
                        return json.loads(json_text)
                    except json.JSONDecodeError:
                        continue
        
    except Exception:
        pass
    
    return None

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
        elif "node" in topic.lower() and "js" in topic.lower():
            video_id = "Oe421EPjeBE"  # Node.js tutorial
        elif "express" in topic.lower():
            video_id = "L72fhGm1tfE"  # Express.js tutorial
        elif "full stack" in topic.lower():
            video_id = "YS4e4q9oBaU"  # Full stack development
        
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
                    
                    # Use consistent field name
                    if videos:
                        module['recommended_videos'] = videos
                        print(f"Found {len(videos)} videos for '{query}'")
                    else:
                        print(f"No videos found for '{query}', using mock videos")
                        module['recommended_videos'] = generate_mock_videos_for_topic(query)
                else:
                    print(f"Error fetching videos for '{query}': {response.status_code} - {response.text}")
                    module['recommended_videos'] = generate_mock_videos_for_topic(query)

            except requests.exceptions.RequestException as e:
                print(f"Request failed for '{query}': {e}")
                module['recommended_videos'] = generate_mock_videos_for_topic(query)
                
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
    port = int(os.getenv('PORT', 4007))  # Use PORT env var or default to 4007
    print(f"[ROCKET] AI Course Service starting on port {port}...")
    app.run(host='0.0.0.0', debug=True, port=port)