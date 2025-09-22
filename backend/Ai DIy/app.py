from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from urllib.parse import urlparse, parse_qs
import google.generativeai as genai
import json
import time
import os
import logging
import base64
import graphviz
from dotenv import load_dotenv
import sys

# Load environment variables from .env file
load_dotenv()

# Set up logging FIRST
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Import emotion detection module AFTER logger is set up
try:
    logger.info("Attempting to import emotion_detector module...")
    from emotion_detector import EmotionDetector
    logger.info("Successfully imported emotion_detector module")
    
    logger.info("Attempting to create EmotionDetector instance...")
    emotion_detector = EmotionDetector()
    logger.info("Emotion detector initialized successfully")
except ImportError as e:
    logger.error(f"Import error initializing emotion detector: {str(e)}")
    logger.error(f"Python path: {sys.path}")
    emotion_detector = None
except Exception as e:
    logger.error(f"Failed to initialize emotion detector: {str(e)}")
    import traceback
    logger.error(f"Full traceback: {traceback.format_exc()}")
    emotion_detector = None

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",  # Keep for backward compatibility
    "http://127.0.0.1:3000"   # Keep for backward compatibility
])

# Configuration - Use environment variables for security
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', "AIzaSyCRu9yLCGcmXcY17jZjdF6-z4udL9eOS0kcd f")
print(f"🔑 Gemini API Key Status: {'✅ Configured' if GEMINI_API_KEY else '❌ Not found'}")
if GEMINI_API_KEY:
    print(f"🔑 Gemini API Key (first 10 chars): {GEMINI_API_KEY[5:]}...")
else:
    print("⚠️ No Gemini API key found - using fallback configuration")

SCRAPINGDOG_API_KEY = os.getenv('SCRAPINGDOG_API_KEY', "685fc0721d8c134bc24de2c7")  

# GitHub API credentials
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', "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")

# OpenRouter API credentials for flowchart generation
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', "sk-or-v1-1234567890abcdef")  # Replace with your actual key
OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct:free"

# Azure LLM credentials for flowchart generation
AZURE_ENDPOINT = os.getenv('AZURE_ENDPOINT', "https://models.github.ai/inference")
AZURE_MODEL = os.getenv('AZURE_MODEL', "meta/Llama-4-Scout-17B-16E-Instruct")
AZURE_TOKEN = os.getenv('AZURE_TOKEN', "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")

# Configure Gemini AI
try:
    print(f"🤖 Attempting to configure Gemini AI...")
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
    logger.info("Gemini AI configured successfully")
    print("✅ Gemini AI configured successfully")
except Exception as e:
    logger.error(f"Failed to configure Gemini AI: {str(e)}")
    print(f"❌ Failed to configure Gemini AI: {str(e)}")
    model = None

def extract_video_id(youtube_url_or_id):
    """Extract video ID from YouTube URL or return the ID if already provided"""
    try:
        if "youtube.com" in youtube_url_or_id or "youtu.be" in youtube_url_or_id:
            if "youtu.be" in youtube_url_or_id:
                return youtube_url_or_id.split("/")[-1].split("?")[0]
            else:
                query = urlparse(youtube_url_or_id).query
                return parse_qs(query)["v"][0]
        return youtube_url_or_id
    except Exception as e:
        logger.error(f"Error extracting video ID: {str(e)}")
        return None

def get_available_languages(video_id):
    """Get list of available transcript languages for a video"""
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        available_languages = []
        for transcript in transcript_list:
            available_languages.append({
                'language': transcript.language,
                'language_code': transcript.language_code,
                'is_generated': transcript.is_generated,
                'is_translatable': transcript.is_translatable
            })
        return available_languages
    except Exception as e:
        logger.error(f"Error getting available languages: {str(e)}")
        return []

def get_transcript(video_id, preferred_languages=['en'], translate_to=None):
    """Get transcript from YouTube video with language priority"""
    try:
        if not video_id:
            return "No video ID provided"
            
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        transcript = None
        
        for lang in preferred_languages:
            try:
                transcript = transcript_list.find_transcript([lang])
                logger.info(f"Found transcript in language: {lang}")
                break
            except:
                continue
        
        if transcript is None:
            available_transcripts = list(transcript_list)
            if available_transcripts:
                transcript = available_transcripts[0]
                logger.info(f"Using available transcript in: {transcript.language_code}")
            else:
                return "No transcripts available for this video"
        
        if translate_to and transcript.is_translatable:
            transcript = transcript.translate(translate_to)
            logger.info(f"Translated transcript to: {translate_to}")
        
        fetched = transcript.fetch()
        formatter = TextFormatter()
        text = formatter.format_transcript(fetched)
        return text
        
    except Exception as e:
        logger.error(f"Could not retrieve transcript for video_id {video_id}: {str(e)}")
        # Return empty string to prevent polluting the prompt with error messages
        return ""

def assess_knowledge_level(description, skill_level):
    """Assess user's actual knowledge level based on their description"""
    try:
        if not model or not description.strip():
            return skill_level, "No detailed assessment available"
            
        prompt = f"""
        Analyze the following user description about their knowledge and experience to assess their actual skill level:
        
        User's self-reported skill level: {skill_level}
        User's description: "{description}"
        
        Based on the description, provide:
        1. Actual skill level (beginner/intermediate/advanced)
        2. Brief assessment reasoning
        3. Key knowledge gaps identified
        4. Strengths mentioned
        
        Format your response as:
        SKILL_LEVEL: [level]
        ASSESSMENT: [brief reasoning]
        GAPS: [key gaps identified]
        STRENGTHS: [strengths mentioned]
        """
        
        response = model.generate_content(prompt)
        assessment_text = response.text.strip()
        
        # Parse the assessment
        lines = assessment_text.split('\n')
        assessed_level = skill_level
        assessment_summary = "Assessment completed"
        
        for line in lines:
            if line.startswith('SKILL_LEVEL:'):
                level = line.split(':', 1)[1].strip().lower()
                if level in ['beginner', 'intermediate', 'advanced']:
                    assessed_level = level
            elif line.startswith('ASSESSMENT:'):
                assessment_summary = line.split(':', 1)[1].strip()
        
        return assessed_level, assessment_text
        
    except Exception as e:
        logger.error(f"Error assessing knowledge level: {str(e)}")
        return skill_level, "Assessment unavailable"

def extract_keywords_from_topic(topic, transcript_content="", user_description=""):
    """Extract relevant keywords from topic, transcript, and user description for YouTube search"""
    try:
        if not model:
            return [word.strip() for word in topic.split() if len(word.strip()) > 2][:5]
            
        combined_text = f"{topic} {transcript_content[:1000]} {user_description[:500]}"
        
        prompt = f"""
        Extract 4-6 relevant keywords for YouTube video search from the following information.
        Focus on technical terms, tools, specific concepts, and skill-appropriate content.
        
        Topic: {topic}
        User Description: {user_description}
        Content: {combined_text}
        
        Return only the keywords separated by commas, nothing else.
        """
        
        response = model.generate_content(prompt)
        keywords = response.text.strip()
        keyword_list = [kw.strip() for kw in keywords.split(',')]
        logger.info(f"Generated keywords: {keyword_list}")
        return keyword_list
        
    except Exception as e:
        logger.error(f"Error extracting keywords: {str(e)}")
        return [word.strip() for word in topic.split() if len(word.strip()) > 2][:5]

def search_youtube_keywords(keywords):
    """Search YouTube for a list of keywords and extract top 2 results for each"""
    base_url = "https://api.scrapingdog.com/youtube/search"
    results = {}
    all_videos = []
    
    for keyword in keywords:
        logger.info(f"Searching for: {keyword}")
        
        params = {
            "api_key": SCRAPINGDOG_API_KEY,
            "search_query": keyword,
            "country": "us",
            "language": "",
            "sp": "",
        }
        
        try:
            response = requests.get(base_url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                video_results = data.get('video_results', [])
                top_2_videos = []
                
                for i, video in enumerate(video_results[:2]):
                    video_info = {
                        'title': video.get('title', 'N/A'),
                        'link': video.get('link', 'N/A'),
                        'channel': video.get('channel', {}).get('name', 'N/A'),
                        'views': video.get('views', 'N/A'),
                        'published_date': video.get('published_date', 'N/A'),
                        'position': i + 1,
                        'keyword': keyword
                    }
                    top_2_videos.append(video_info)
                    all_videos.append(video_info)
                
                results[keyword] = {
                    'status': 'success',
                    'total_results': len(video_results),
                    'top_2_videos': top_2_videos
                }
                
            else:
                logger.error(f"ScrapingDog API error for {keyword}: Status {response.status_code}")
                results[keyword] = {
                    'status': 'failed',
                    'error': f"Status code: {response.status_code}"
                }
        
        except Exception as e:
            logger.error(f"Error searching for {keyword}: {str(e)}")
            results[keyword] = {
                'status': 'error',
                'error': str(e)
            }
        
        time.sleep(1)
    
    return results, all_videos

def is_ml_related_topic(topic, user_description=""):
    """Check if the topic is related to machine learning, data science, or AI"""
    ml_keywords = [
        'machine learning', 'ml', 'artificial intelligence', 'ai', 'deep learning',
        'neural network', 'data science', 'classification', 'regression', 'clustering',
        'supervised learning', 'unsupervised learning', 'reinforcement learning',
        'computer vision', 'nlp', 'natural language processing', 'tensorflow',
        'pytorch', 'scikit-learn', 'pandas', 'numpy', 'data analysis',
        'predictive modeling', 'feature engineering', 'model training',
        'data mining', 'big data', 'statistical analysis'
    ]
    
    combined_text = f"{topic.lower()} {user_description.lower()}"
    return any(keyword in combined_text for keyword in ml_keywords)

def get_dataset_recommendations(topic, skill_level):
    """Get dataset recommendations for ML projects"""
    try:
        if not model:
            return ["Sample dataset from Kaggle", "UCI Machine Learning Repository"]
            
        prompt = f"""
        Suggest 3-5 relevant datasets for a {skill_level} level {topic} project.
        Focus on publicly available datasets from sources like Kaggle, UCI, or other open data repositories.
        Return only the dataset names and sources, one per line.
        """
        
        response = model.generate_content(prompt)
        datasets = response.text.strip().split('\n')
        return [ds.strip() for ds in datasets if ds.strip()]
        
    except Exception as e:
        logger.error(f"Error getting dataset recommendations: {str(e)}")
        return ["Sample dataset from Kaggle", "UCI Machine Learning Repository"]

def get_github_search_keywords(project_idea):
    """Generate clean GitHub search keywords using LLM"""
    try:
        if not model:
            return [project_idea]
            
        prompt = (
            f"The user wants to build this project: \"{project_idea}\".\n"
            "Suggest 2 to 3 simple GitHub search keywords to find existing relevant projects. "
            "Avoid *, #, or punctuation. Return only plain search phrases like 'college portal react' or 'university dashboard'. "
            "No numbering, no extra symbols. Just a list of clean search queries."
        )

        response = model.generate_content(prompt)
        raw = response.text.strip()
        keywords = [re.sub(r'^[\\-#]+\s', '', line).strip() for line in raw.splitlines() if line.strip()]
        return keywords or [project_idea]  # Fallback to project idea
        
    except Exception as e:
        logger.error(f"Error generating GitHub keywords: {str(e)}")
        return [project_idea]

def github_search(query):
    """Search GitHub for repositories"""
    headers = {"Authorization": f"token {GITHUB_TOKEN}"}
    tokens = re.sub(r'[^\w\s\-]', '', query).split()
    joined_query = '+'.join([f'"{token}"' for token in tokens])
    url = f"https://api.github.com/search/repositories?q={joined_query}+in:name,description&sort=best-match&order=desc"
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        items = res.json().get("items", [])[:3]
    except requests.RequestException as e:
        logger.error(f"GitHub API error: {e}")
        return []

    return [
        {
            "name": item["full_name"],
            "url": item["html_url"],
            "desc": item["description"] or "No description provided.",
            "readme": get_readme(item["full_name"])
        }
        for item in items
    ]

def get_readme(repo_full_name):
    """Fetch README content from GitHub repository"""
    headers = {"Authorization": f"token {GITHUB_TOKEN}"}
    url = f"https://api.github.com/repos/{repo_full_name}/readme"
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        content = res.json().get("content", "")
        return base64.b64decode(content).decode("utf-8", errors="ignore")[:500]  # Limit content size
    except requests.RequestException:
        return ""

def explain_repo(project_idea, repo):
    """Explain how a repository matches the project idea with structured data"""
    try:
        if not model:
            return {
                'useful_for': f"This repository {repo['name']} might be useful for your {project_idea} project.",
                'match_score': 'moderate',
                'pros': ['Available source code', 'Active repository'],
                'cons': ['May need customization', 'Documentation varies'],
                'customization': 'Requires adaptation to your specific needs'
            }
            
        truncated_readme = repo['readme'][:500] if repo['readme'] else ""
        prompt = (
            f"The user is building: \"{project_idea}\"\n"
            f"Here is a GitHub repo:\n"
            f"Name: {repo['name']}\n"
            f"Description: {repo['desc']}\n"
            f"README (partial): {truncated_readme}\n\n"
            "Analyze this repo and provide a structured response in this exact format:\n\n"
            "USEFUL_FOR: [Brief explanation of what this repo is useful for]\n"
            "MATCH_SCORE: [high/moderate/low]\n"
            "PROS: [List 2-3 key advantages, one per line]\n"
            "CONS: [List 2-3 limitations, one per line]\n"
            "CUSTOMIZATION: [Brief note about what customization is needed]"
        )

        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Parse the structured response
        sections = {}
        current_section = None
        current_content = []
        
        for line in text.split('\n'):
            line = line.strip()
            if line.startswith('USEFUL_FOR:'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = 'useful_for'
                current_content = [line.replace('USEFUL_FOR:', '').strip()]
            elif line.startswith('MATCH_SCORE:'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = 'match_score'
                current_content = [line.replace('MATCH_SCORE:', '').strip()]
            elif line.startswith('PROS:'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = 'pros'
                current_content = []
            elif line.startswith('CONS:'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = 'cons'
                current_content = []
            elif line.startswith('CUSTOMIZATION:'):
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()
                current_section = 'customization'
                current_content = [line.replace('CUSTOMIZATION:', '').strip()]
            elif line and current_section in ['pros', 'cons']:
                current_content.append(line)
        
        if current_section:
            sections[current_section] = '\n'.join(current_content).strip()
        
        # Clean up pros and cons lists
        pros = [p.strip() for p in sections.get('pros', '').split('\n') if p.strip()] if sections.get('pros') else []
        cons = [c.strip() for c in sections.get('cons', '').split('\n') if c.strip()] if sections.get('cons') else []
        
        return {
            'useful_for': sections.get('useful_for', f"This repository {repo['name']} might be useful for your {project_idea} project."),
            'match_score': sections.get('match_score', 'moderate'),
            'pros': pros,
            'cons': cons,
            'customization': sections.get('customization', 'Requires adaptation to your specific needs')
        }
        
    except Exception as e:
        logger.error(f"Error explaining repo: {str(e)}")
        return {
            'useful_for': f"This repository {repo['name']} might be useful for your {project_idea} project.",
            'match_score': 'moderate',
            'pros': ['Available source code', 'Active repository'],
            'cons': ['May need customization', 'Documentation varies'],
            'customization': 'Requires adaptation to your specific needs'
        }

def suggest_tools(project_idea, category="software", project_title="", project_overview=""):
    """Suggest tools, libraries, APIs, or hardware components for the project"""
    try:
        # Detect if it's a hardware project
        hardware_keywords = ["arduino", "esp", "sensor", "iot", "raspberry", "microcontroller", "circuit", "hardware", "led", "motor", "servo", "breadboard", "resistor", "capacitor", "transistor"]
        is_hardware = category == "hardware" or any(word in project_idea.lower() for word in hardware_keywords)
        
        if is_hardware:
            # Use Gemini for hardware suggestions with circuit schematics and component search
            if not model:
                return {
                    'type': 'hardware',
                    'suggestions': 'Hardware suggestions unavailable - AI model not available',
                    'components': [],
                    'description': f'Hardware components for your {project_idea} project'
                }
            
            # Use the specific project details for more targeted suggestions
            project_context = f"Project Title: {project_title}\nProject Overview: {project_overview}\nUser Request: {project_idea}"
            
            prompt = (
                f"Based on this specific project:\n{project_context}\n\n"
                "Provide detailed hardware components and circuit design specifically for this project. "
                "Make sure the suggestions are directly relevant to the project requirements.\n\n"
                "IMPORTANT: Format your response in a very structured and organized way with clear sections. "
                "Use proper formatting with clear headers and bullet points. "
                "DO NOT use asterisks (*) or hash symbols (#) for formatting. "
                "Use only plain text with clear section headers.\n\n"
                "Provide a comprehensive and structured response with the following sections:\n\n"
                "CIRCUIT DIAGRAM:\n"
                "[Provide a clear, step-by-step description of the circuit layout and connections. "
                "Include specific pin connections, component placements, and wiring instructions. "
                "Make it easy to follow for someone building this specific project. "
                "DO NOT include any diagram or textual representation sections.]\n\n"
                "COMPONENT LIST:\n"
                "[List each component in this exact format:\n"
                "- Component Name - Quantity - Specific Purpose for this project - Estimated Cost in INR\n"
                "- Component Name - Quantity - Specific Purpose for this project - Estimated Cost in INR\n"
                "Continue with all necessary components for this specific project. "
                "Use Indian Rupees (₹) for all prices.]\n\n"
                "POWER REQUIREMENTS:\n"
                "[Specify:\n"
                "- Voltage requirements\n"
                "- Current requirements\n"
                "- Power supply recommendations\n"
                "All specific to this project]\n\n"
                "TOOLS NEEDED:\n"
                "[List tools in this format:\n"
                "- Tool Name - Specific purpose for this project\n"
                "- Tool Name - Specific purpose for this project\n"
                "Include only tools actually needed for this specific project]\n\n"
                "LEARNING RESOURCES:\n"
                "[List resources in this format:\n"
                "- Resource Name - URL - What it specifically covers for this project\n"
                "- Resource Name - URL - What it specifically covers for this project\n"
                "Include tutorials, datasheets, and guides relevant to this specific project type. "
                "Make sure URLs are complete and clickable.]\n\n"
                "💡 IMPLEMENTATION NOTES:\n"
                "[Provide 3-5 key implementation tips or considerations specific to this project. "
                "Include any important warnings, best practices, or project-specific advice.]\n\n"
                "Remember to keep all suggestions directly relevant to the specific project requirements. "
                "Make the output well-structured and easy to read. "
                "Use Indian currency (₹) for all prices and avoid any special formatting characters."
            )
            
            response = model.generate_content(prompt)
            hardware_suggestions = response.text.strip()
            
            # Extract components for shopping search
            components = extract_components_from_suggestions(hardware_suggestions)
            
            # Get shopping links for components
            shopping_links = get_component_shopping_links(components)
            
            return {
                'type': 'hardware',
                'suggestions': hardware_suggestions,
                'components': components,
                'shopping_links': shopping_links,
                'description': f'Hardware components and resources for your {project_title} project'
            }
        
        else:
            # Use Gemini for software suggestions with more specific prompts
            if not model:
                return {
                    'type': 'software',
                    'tools': ['React (for frontend)', 'Node.js (for backend)', 'MongoDB (for database)'],
                    'description': 'Consider using popular tools like React, Node.js, or Python libraries based on your project needs.'
                }
            
            # Create a more specific prompt based on project details
            project_context = f"Project Title: {project_title}\nProject Overview: {project_overview}\nUser Request: {project_idea}"
            
            # Analyze project type for more specific suggestions
            project_lower = project_idea.lower()
            
            # Determine project type and add specific context
            project_type_context = ""
            if any(word in project_lower for word in ['weather', 'api', 'data']):
                project_type_context = "This appears to be a data/API project. Focus on data fetching, API integration, and data visualization tools."
            elif any(word in project_lower for word in ['chat', 'messaging', 'communication']):
                project_type_context = "This appears to be a communication project. Focus on real-time communication, WebSocket, and messaging tools."
            elif any(word in project_lower for word in ['e-commerce', 'shop', 'store', 'payment']):
                project_type_context = "This appears to be an e-commerce project. Focus on payment processing, inventory management, and shopping cart tools."
            elif any(word in project_lower for word in ['social', 'network', 'profile', 'user']):
                project_type_context = "This appears to be a social networking project. Focus on user authentication, profile management, and social features."
            elif any(word in project_lower for word in ['game', 'gaming', 'play']):
                project_type_context = "This appears to be a gaming project. Focus on game development frameworks, graphics, and interactive tools."
            elif any(word in project_lower for word in ['blog', 'content', 'cms']):
                project_type_context = "This appears to be a content management project. Focus on content creation, management, and publishing tools."
            elif any(word in project_lower for word in ['portfolio', 'personal', 'resume']):
                project_type_context = "This appears to be a portfolio project. Focus on presentation, design, and showcase tools."
            elif any(word in project_lower for word in ['task', 'todo', 'management', 'organizer']):
                project_type_context = "This appears to be a task management project. Focus on CRUD operations, state management, and organization tools."
            elif any(word in project_lower for word in ['fitness', 'health', 'tracker', 'monitor']):
                project_type_context = "This appears to be a health/fitness tracking project. Focus on data tracking, visualization, and health-related APIs."
            elif any(word in project_lower for word in ['recipe', 'food', 'cooking']):
                project_type_context = "This appears to be a recipe/food project. Focus on recipe management, food APIs, and culinary tools."
            
            prompt = f"""
Based on this specific project:
{project_context}

{project_type_context}

Suggest 5-8 specific tools, libraries, frameworks, or APIs that would be essential for building this project. 
Focus on tools that are:
- Directly relevant to the project requirements
- Appropriate for the project type and complexity
- Include both core development tools and specialized libraries
- Consider the user's skill level and project goals

For each tool, provide:
- Exact name and version if applicable
- Brief explanation of why it's needed for this specific project
- Whether it's free or paid
- Alternative options if applicable

Format your response as:
TOOLS:
- [Tool name with version] (specific reason for this project)
- [Tool name with version] (specific reason for this project)
- [Tool name with version] (specific reason for this project)
[Continue with 5-8 tools total]

DESCRIPTION: [Brief explanation of tool selection strategy and how these tools work together for this project]

Make sure all suggestions are directly relevant to the specific project requirements and will help the user build exactly what they described.
            """

            response = model.generate_content(prompt)
            text = response.text.strip()
            
            # Parse the response
            tools = []
            description = ""
            
            lines = text.split('\n')
            in_tools_section = False
            
            for line in lines:
                line = line.strip()
                if line.startswith('TOOLS:'):
                    in_tools_section = True
                    continue
                elif line.startswith('DESCRIPTION:'):
                    in_tools_section = False
                    description = line.replace('DESCRIPTION:', '').strip()
                    continue
                elif in_tools_section and line.startswith('-'):
                    tool = line.replace('-', '').strip()
                    if tool:
                        tools.append(tool)
            
            # If no tools were parsed, provide fallback suggestions based on project type
            if not tools:
                # Generate fallback based on project keywords
                fallback_tools = []
                
                if any(word in project_lower for word in ['weather', 'api', 'data']):
                    fallback_tools.extend(['Axios (for API calls)', 'Chart.js (for data visualization)', 'OpenWeatherMap API (for weather data)'])
                elif any(word in project_lower for word in ['chat', 'messaging', 'communication']):
                    fallback_tools.extend(['Socket.io (for real-time communication)', 'Express.js (for backend)', 'React (for frontend UI)'])
                elif any(word in project_lower for word in ['e-commerce', 'shop', 'store', 'payment']):
                    fallback_tools.extend(['Stripe API (for payments)', 'MongoDB (for product database)', 'React (for shopping interface)'])
                elif any(word in project_lower for word in ['social', 'network', 'profile', 'user']):
                    fallback_tools.extend(['Firebase Auth (for user authentication)', 'MongoDB (for user profiles)', 'React (for social interface)'])
                elif any(word in project_lower for word in ['game', 'gaming', 'play']):
                    fallback_tools.extend(['Phaser.js (for game development)', 'Canvas API (for graphics)', 'Web Audio API (for sound)'])
                elif any(word in project_lower for word in ['blog', 'content', 'cms']):
                    fallback_tools.extend(['Next.js (for content management)', 'Markdown (for content writing)', 'MongoDB (for content storage)'])
                elif any(word in project_lower for word in ['portfolio', 'personal', 'resume']):
                    fallback_tools.extend(['React (for interactive UI)', 'Framer Motion (for animations)', 'Tailwind CSS (for styling)'])
                elif any(word in project_lower for word in ['task', 'todo', 'management', 'organizer']):
                    fallback_tools.extend(['React (for task interface)', 'LocalStorage (for data persistence)', 'React Hook Form (for task input)'])
                elif any(word in project_lower for word in ['fitness', 'health', 'tracker', 'monitor']):
                    fallback_tools.extend(['Chart.js (for progress visualization)', 'LocalStorage (for data storage)', 'React (for tracking interface)'])
                elif any(word in project_lower for word in ['recipe', 'food', 'cooking']):
                    fallback_tools.extend(['Spoonacular API (for recipe data)', 'React (for recipe display)', 'LocalStorage (for saved recipes)'])
                elif any(word in project_lower for word in ['web', 'website', 'app', 'frontend']):
                    fallback_tools.extend(['React (for frontend UI)', 'HTML/CSS (for styling)', 'JavaScript (for interactivity)'])
                elif any(word in project_lower for word in ['api', 'backend', 'server']):
                    fallback_tools.extend(['Node.js (for backend)', 'Express.js (for API)', 'MongoDB (for database)'])
                elif any(word in project_lower for word in ['data', 'analysis', 'ml', 'ai']):
                    fallback_tools.extend(['Python (for data processing)', 'Pandas (for data manipulation)', 'Jupyter Notebook (for analysis)'])
                elif any(word in project_lower for word in ['mobile', 'app']):
                    fallback_tools.extend(['React Native (for mobile)', 'Expo (for development)', 'Android Studio (for testing)'])
                
                tools = fallback_tools if fallback_tools else ['React (for frontend)', 'Node.js (for backend)', 'MongoDB (for database)']
            
            return {
                'type': 'software',
                'tools': tools,
                'description': description if description else 'Essential tools and libraries for building your project effectively.'
            }
        
    except Exception as e:
        logger.error(f"Error suggesting tools: {str(e)}")
        return {
            'type': 'software',
            'tools': ['React (for frontend)', 'Node.js (for backend)', 'MongoDB (for database)'],
            'description': 'Consider using popular tools like React, Node.js, or Python libraries based on your project needs.'
        }

def extract_components_from_suggestions(suggestions_text):
    """Extract structured component data from hardware suggestions"""
    try:
        components = []
        lines = suggestions_text.split('\n')
        in_component_section = False
        
        for line in lines:
            line = line.strip()
            # Check for component section with or without emoji
            if 'COMPONENT LIST:' in line or '📦 COMPONENT LIST:' in line:
                in_component_section = True
                continue
            elif in_component_section and (
                line.startswith('🛒') or line.startswith('📚') or line.startswith('⚡') or 
                line.startswith('🔧 TOOLS NEEDED:') or line.startswith('TOOLS NEEDED:') or
                line.startswith('📖 LEARNING RESOURCES:') or line.startswith('LEARNING RESOURCES:') or
                line.startswith('💡 IMPLEMENTATION NOTES:') or line.startswith('IMPLEMENTATION NOTES:')
            ):
                break
            elif in_component_section and line.startswith('-') and ' - ' in line:
                # Parse component line: "Component Name - Quantity - Purpose - Cost"
                parts = line.replace('-', '').strip().split(' - ')
                if len(parts) >= 3:
                    component_name = parts[0].strip()
                    quantity = parts[1].strip() if len(parts) > 1 else '1'
                    purpose = parts[2].strip() if len(parts) > 2 else ''
                    cost = parts[3].strip() if len(parts) > 3 else 'Varies'
                    
                    # Clean up the component name (remove any extra formatting)
                    component_name = component_name.replace('📦', '').replace('🔧', '').replace('⚡', '').strip()
                    
                    components.append({
                        'name': component_name,
                        'quantity': quantity,
                        'purpose': purpose,
                        'cost': cost
                    })
        
        # If no components found, try alternative parsing
        if not components:
            logger.warning("No components found with standard parsing, trying alternative method")
            for line in lines:
                line = line.strip()
                if line.startswith('-') and any(word in line.lower() for word in ['sensor', 'arduino', 'relay', 'pump', 'wire', 'breadboard', 'power']):
                    # Try to extract component info from any line that looks like a component
                    parts = line.replace('-', '').strip().split(' - ')
                    if len(parts) >= 2:
                        component_name = parts[0].strip()
                        # Try to extract quantity and purpose from the rest
                        remaining = ' - '.join(parts[1:])
                        if ' - ' in remaining:
                            quantity_part, purpose_part = remaining.split(' - ', 1)
                            quantity = quantity_part.strip()
                            purpose = purpose_part.strip()
                        else:
                            quantity = '1'
                            purpose = remaining.strip()
                        
                        components.append({
                            'name': component_name,
                            'quantity': quantity,
                            'purpose': purpose,
                            'cost': 'Varies'
                        })
        
        logger.info(f"Extracted {len(components)} components: {[c['name'] for c in components]}")
        return components
    except Exception as e:
        logger.error(f"Error extracting components: {str(e)}")
        return []

def get_component_shopping_links(components):
    """Get Google Shopping links for hardware components"""
    try:
        shopping_links = {}
        base_url = "https://api.scrapingdog.com/google_shopping"
        
        for component in components:
            component_name = component['name']
            logger.info(f"Searching shopping links for: {component_name}")
            
            params = {
                "api_key": SCRAPINGDOG_API_KEY,
                "q": component_name,
                "gl": "in",  # India
                "hl": "en"
            }
            
            try:
                response = requests.get(base_url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        # Get top 3 results
                        top_results = data[:3]
                        shopping_links[component_name] = [
                            {
                                'title': result.get('title', ''),
                                'price': result.get('price', ''),
                                'link': result.get('link', ''),
                                'image': result.get('image', ''),
                                'rating': result.get('rating', ''),
                                'reviews': result.get('reviews', '')
                            }
                            for result in top_results
                        ]
                        logger.info(f"Found {len(top_results)} shopping results for {component_name}")
                    else:
                        shopping_links[component_name] = []
                        logger.warning(f"No shopping results found for {component_name}")
                else:
                    logger.error(f"Shopping API error for {component_name}: {response.status_code}")
                    shopping_links[component_name] = []
                    
            except Exception as e:
                logger.error(f"Error fetching shopping links for {component_name}: {str(e)}")
                shopping_links[component_name] = []
        
        return shopping_links
        
    except Exception as e:
        logger.error(f"Error in get_component_shopping_links: {str(e)}")
        return {}

def is_relevant(repo, project_idea):
    """Filter irrelevant repositories"""
    idea_keywords = set(word.lower() for word in re.findall(r'\w+', project_idea))
    combined_text = f"{repo['name']} {repo['desc']} {repo['readme']}".lower()
    return any(word in combined_text for word in idea_keywords)

def find_github_templates(project_idea, category="software", project_title="", project_overview=""):
    """Find GitHub starter templates for software projects only"""
    try:
        # Only find GitHub templates for software projects
        if category != "software":
            logger.info(f"Skipping GitHub templates for {category} project")
            return None
            
        logger.info(f"Finding GitHub templates for: {project_idea} (category: {category})")
        
        # Generate search keywords
        keywords = get_github_search_keywords(project_idea)
        logger.info(f"Generated keywords: {keywords}")
        
        found_repos = []
        
        for kw in keywords:
            logger.info(f"Searching for: {kw}")
            repos = [r for r in github_search(kw) if is_relevant(r, project_idea)]
            if repos:
                for repo in repos:
                    repo['analysis'] = explain_repo(project_idea, repo)
                    found_repos.append(repo)
        
        # Get tool suggestions based on category
        tool_suggestions = suggest_tools(project_idea, category, project_title, project_overview)
        
        return {
            'repositories': found_repos[:5],  # Limit to 5 repos
            'tools': tool_suggestions
        }
        
    except Exception as e:
        logger.error(f"Error finding GitHub templates: {str(e)}")
        return None

def extract_software_tools_from_suggestions(tools_text):
    """Extract structured software tools data from tools suggestions"""
    try:
        tools = []
        lines = tools_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Remove common extra characters
            line = line.replace('`', '').replace('**', '').replace('*', '')
            
            # Parse tool line with description in parentheses
            if line.startswith('-') and '(' in line and ')' in line:
                tool_part = line.replace('-', '').strip()
                tool_name = tool_part.split('(')[0].strip()
                description = tool_part.split('(')[1].split(')')[0].strip()
                
                # Skip if description just repeats the tool name
                if tool_name.lower() in description.lower() or description.lower() in tool_name.lower():
                    description = "Essential for this project"
                
                tools.append({
                    'name': tool_name,
                    'description': description,
                    'category': 'development_tool',
                    'version': 'Latest'
                })
            elif line.startswith('-'):
                tool_name = line.replace('-', '').strip()
                tools.append({
                    'name': tool_name,
                    'description': 'Essential for this project',
                    'category': 'development_tool',
                    'version': 'Latest'
                })
        
        logger.info(f"Extracted {len(tools)} software tools: {[t['name'] for t in tools]}")
        return tools
        
    except Exception as e:
        logger.error(f"Error extracting software tools: {str(e)}")
        return []

def generate_specific_tools_with_ai(project_idea, project_title="", project_overview="", category="software"):
    """Generate specific tools and materials using Gemini AI based on project idea"""
    try:
        if not model:
            logger.warning("No AI model available for specific tools generation")
            return []
        
        # Create a focused prompt for tools generation
        prompt = f"""
You are an expert software development consultant. Based on the following project details, suggest SPECIFIC tools, libraries, frameworks, and technologies that are essential for building this project.

PROJECT IDEA: {project_idea}
PROJECT TITLE: {project_title}
PROJECT OVERVIEW: {project_overview}
CATEGORY: {category}

IMPORTANT REQUIREMENTS:
1. Provide ONLY SPECIFIC tools with exact names and versions
2. Include the specific purpose for each tool in this project
3. Do NOT use generic terms like "computer", "internet", "text editor"
4. Focus on actual development tools, libraries, and technologies
5. Include both frontend and backend tools if applicable
6. Specify versions when relevant (e.g., "React 18.2.0", "Node.js 18.x")

Format your response as a simple list with each tool on a new line:
- [Tool Name] (specific purpose for this project)
- [Tool Name] (specific purpose for this project)
- [Tool Name] (specific purpose for this project)

Examples of good responses:
- React 18.2.0 (for building the user interface)
- Node.js 18.x (for backend API development)
- MongoDB 6.0 (for storing user data)
- Express.js 4.18 (for creating REST API endpoints)
- Axios (for making HTTP requests to external APIs)
- Tailwind CSS (for styling the user interface)

Generate 5-8 specific tools that are directly relevant to building this project.
        """
        
        logger.info(f"Generating specific tools for project: {project_idea}")
        logger.info(f"User profile: Age={user_age}, Skills={len(user_skills)}, Previous Projects={len(user_previous_projects)}")
        logger.info(f"Raw skills data: {user_skills_raw}")
        logger.info(f"Raw projects data: {user_previous_projects_raw}")
        logger.info(f"Processed skills: {user_skills}")
        logger.info(f"Processed projects: {user_previous_projects}")
        response = model.generate_content(prompt)
        tools_text = response.text.strip()
        
        # Parse the tools into structured data
        tools = extract_software_tools_from_suggestions(tools_text)
        
        logger.info(f"Generated {len(tools)} specific tools: {tools}")
        return tools
        
    except Exception as e:
        logger.error(f"Error generating specific tools with AI: {str(e)}")
        return []

def calculate_phase_times(available_time):
    """Calculate proper time distribution for phases based on total available time"""
    try:
        # Parse the available time
        time_str = available_time.strip().lower()
        
        # Convert to minutes
        total_minutes = 0
        if 'hour' in time_str or 'hr' in time_str:
            # Extract hours
            if 'hour' in time_str:
                hours = int(time_str.split('hour')[0].strip())
            else:
                hours = int(time_str.split('hr')[0].strip())
            total_minutes = hours * 60
        elif 'minute' in time_str or 'min' in time_str:
            # Extract minutes
            if 'minute' in time_str:
                minutes = int(time_str.split('minute')[0].strip())
            else:
                minutes = int(time_str.split('min')[0].strip())
            total_minutes = minutes
        else:
            # Try to extract number and assume minutes
            import re
            numbers = re.findall(r'\d+', time_str)
            if numbers:
                total_minutes = int(numbers[0])
            else:
                total_minutes = 120  # Default 2 hours
        
        # Calculate phase times (4 phases with proportional distribution)
        # Phase 1: Setup & Planning (15%)
        # Phase 2: Learning & Exploration (25%)
        # Phase 3: Implementation & Build (45%)
        # Phase 4: Testing & Debugging (15%)
        
        phase1_minutes = int(total_minutes * 0.15)
        phase2_minutes = int(total_minutes * 0.25)
        phase3_minutes = int(total_minutes * 0.45)
        phase4_minutes = total_minutes - phase1_minutes - phase2_minutes - phase3_minutes
        
        # Ensure minimum times
        phase1_minutes = max(phase1_minutes, 15)
        phase2_minutes = max(phase2_minutes, 20)
        phase3_minutes = max(phase3_minutes, 30)
        phase4_minutes = max(phase4_minutes, 15)
        
        # Convert back to readable format
        def format_time(minutes):
            if minutes >= 60:
                hours = minutes // 60
                mins = minutes % 60
                if mins == 0:
                    return f"{hours} hour{'s' if hours > 1 else ''}"
                else:
                    return f"{hours} hour{'s' if hours > 1 else ''} {mins} minute{'s' if mins > 1 else ''}"
            else:
                return f"{minutes} minute{'s' if minutes > 1 else ''}"
        
        return {
            'phase1': format_time(phase1_minutes),
            'phase2': format_time(phase2_minutes),
            'phase3': format_time(phase3_minutes),
            'phase4': format_time(phase4_minutes),
            'total_minutes': total_minutes
        }
        
    except Exception as e:
        logger.error(f"Error calculating phase times: {str(e)}")
        # Fallback to default times
        return {
            'phase1': '30 minutes',
            'phase2': '45 minutes', 
            'phase3': '60 minutes',
            'phase4': '45 minutes',
            'total_minutes': 180
        }

def generate_project_task(topic, transcript_content, available_time, user_skill_level="beginner", 
                         user_description="", youtube_videos=None, knowledge_assessment="", category="software",
                         user_profile=None):
    """Generate a complete project task with roadmap"""
    try:
        if not model:
            logger.warning("No AI model available, using fallback project")
            return create_fallback_project(topic, available_time, user_skill_level, user_description, youtube_videos)
        
        is_ml = is_ml_related_topic(topic, user_description)
        
        # Distribute videos across phases
        phase_videos = distribute_videos_to_phases(youtube_videos, topic, user_skill_level) if youtube_videos else {}
        
        # Extract user profile information
        user_age = user_profile.get('age', 'Not specified') if user_profile else 'Not specified'
        user_skills_raw = user_profile.get('skills', '') if user_profile else ''
        user_previous_projects_raw = user_profile.get('previous_projects', '') if user_profile else []
        user_education_level = user_profile.get('education_level', 'Not specified') if user_profile else 'Not specified'
        user_domain_interest = user_profile.get('domain_interest', 'Not specified') if user_profile else 'Not specified'
        
        # Convert string data to arrays for proper processing
        if isinstance(user_skills_raw, str):
            user_skills = [skill.strip() for skill in user_skills_raw.split(',') if skill.strip()] if user_skills_raw else []
        else:
            user_skills = user_skills_raw if isinstance(user_skills_raw, list) else []
            
        if isinstance(user_previous_projects_raw, str):
            user_previous_projects = [project.strip() for project in user_previous_projects_raw.split(',') if project.strip()] if user_previous_projects_raw else []
        else:
            user_previous_projects = user_previous_projects_raw if isinstance(user_previous_projects_raw, list) else []
        
        # Format user profile information for the prompt
        skills_text = ', '.join(user_skills) if user_skills else 'None specified'
        previous_projects_text = ', '.join(user_previous_projects) if user_previous_projects else 'None specified'
        
        # Calculate proper phase times based on available time
        phase_times = calculate_phase_times(available_time)
        logger.info(f"Calculated phase times: {phase_times}")
        
        # Create a comprehensive prompt for project generation with emphasis on specific tools
        prompt = f"""
You are an AI-powered DIY project mentor. Your task is to generate a personalized and engaging project idea and their roadmap for a learner based on their background, available time, and content they've recently learned. The goal is to help them build confidence through hands-on application by suggesting a creative, domain-specific project,assuming learner will learn required skills if he don't know that skills.
        
INPUT TOPIC: {topic}
PROJECT CATEGORY: {category}

USER PROFILE:
        - Age: {user_age}
        - Education Level: {user_education_level}
        - Domain of Interest: {user_domain_interest}
        - Current Skills: {skills_text}
        - Previous Projects: {previous_projects_text}
        - Skill Level: {user_skill_level}
        - Available Time: {available_time} (Total: {phase_times['total_minutes']} minutes)
        - Learner Description: {user_description}
        - Knowledge Assessment: {knowledge_assessment}
        
CONTENT CONTEXT:
{transcript_content[:1000] if transcript_content else "No reference content provided"}

YOUR TASK:
Generate a personalized DIY project roadmap that fits the learner's profile. The roadmap should:
- Consider the user's age and education level for appropriate complexity
- Build upon their existing skills and previous projects
- Align with their domain of interest when possible
- Suggest a project in the {category} domain
- Match the learner's skill level and available time
- Scaffold learning with intelligent guidance and hints
- Build on the learner's recent knowledge or lecture content
- Encourage curiosity and practical creativity

CRITICAL: For TOOLS & MATERIALS, you MUST provide SPECIFIC, PROJECT-RELEVANT tools. Do NOT use generic tools like "Computer with internet access" or "Text editor". Instead, provide exact tool names, versions, and specific reasons why each tool is needed for THIS specific project.

FORMAT:

PROJECT TITLE: [Creative and engaging project name]

ESTIMATED TIME: [In minutes or hours]

DIFFICULTY LEVEL: [Beginner / Intermediate / Advanced]

DOMAIN: [Coding / Hardware / Design / Research / Other]

KNOWLEDGE SUMMARY:
[Summarize what the user knows so far, based on the profile/context]

PROJECT OVERVIEW:
[A clear, motivating 2-3 paragraph overview covering:
- What the project is and what it aims to achieve
- Why it's valuable and how it applies real-world knowledge
- What tools, methods, or technologies will be used
- What the learner will build/create by the end]
        
        PREREQUISITES:
- [List 3-5 prerequisites or foundational skills/tools]

TOOLS & MATERIALS:
- [List 5-8 SPECIFIC tools, libraries, software, or hardware items needed for THIS project]
- [Include exact names, versions, and specific purposes for THIS project]
- [Examples: "React 18.2.0 (for building the user interface)", "Node.js 18.x (for backend API)", "MongoDB 6.0 (for storing user data)"]
- [Do NOT use generic tools like "Computer with internet access" or "Text editor"]
- [Be very specific about why each tool is needed for THIS project]
        
        LEARNING OBJECTIVES:
- [List 4-6 core skills or concepts the learner will gain]
        
        PROJECT ROADMAP:

PHASE 1: Setup & Planning ({phase_times['phase1']})
- [3-4 setup tasks: research, install tools, define project scope, etc.]
{"- Explore relevant datasets or APIs" if is_ml else ""}

PHASE 2: Learning & Exploration ({phase_times['phase2']})
- [3-4 learning tasks: review examples, study methods, test snippets]

PHASE 3: Implementation & Build ({phase_times['phase3']})
- [4-5 implementation tasks: write code, build prototypes, design UI]
{"- Train and evaluate ML models" if is_ml else ""}

PHASE 4: Testing, Debugging & Reflection ({phase_times['phase4']})
- [3-4 tasks: run tests, fix bugs, review outcomes, document learnings]

TEMPLATES / HINTS (if applicable):
- [Provide starter code ideas, commands, or architectural hints to help the user start confidently]

COMMON PITFALLS & HOW TO AVOID THEM:
- [List 4-5 common issues and troubleshooting tips]
        
        SUCCESS CRITERIA:
- [4-5 points on how to know if the project was successful]

EXTENSIONS & NEXT STEPS:
- [Suggest 3-5 ideas for taking the project further]

TONE: Keep the language encouraging, beginner-friendly (if applicable), and motivating. Aim to make the learner feel excited and capable of starting right away.

REMEMBER: The TOOLS & MATERIALS section is CRITICAL. Provide SPECIFIC tools with exact names and versions that are directly relevant to building THIS specific project.
        """
        
        logger.info(f"Generating project with AI model for topic: {topic}")
        logger.info(f"User profile: Age={user_age}, Skills={len(user_skills)}, Previous Projects={len(user_previous_projects)}")
        logger.info(f"Raw skills data: {user_skills_raw}")
        logger.info(f"Raw projects data: {user_previous_projects_raw}")
        logger.info(f"Processed skills: {user_skills}")
        logger.info(f"Processed projects: {user_previous_projects}")
        response = model.generate_content(prompt)
        project_text = response.text.strip()
        
        logger.info(f"AI response received, length: {len(project_text)}")
        logger.info(f"First 500 characters: {project_text[:500]}")
        
        # Parse the project text into structured data
        parsed_sections = parse_project_text(project_text)
        
        # Map parsed sections to expected keys
        project_data = {
            'project_title': parsed_sections.get('project_title', f"DIY Project: {topic}"),
            'estimated_time': parsed_sections.get('estimated_time', available_time),
            'difficulty_level': parsed_sections.get('difficulty_level', user_skill_level),
            'knowledge_assessment': parsed_sections.get('knowledge_assessment', knowledge_assessment),
            'domain': parsed_sections.get('domain', ''),
            'project_overview': parsed_sections.get('project_overview', ''),
            'prerequisites': parsed_sections.get('prerequisites', ''),
            'tools_and_materials': parsed_sections.get('tools_materials', ''),  # Map from parsed key
            'learning_objectives': parsed_sections.get('learning_objectives', ''),
            'project_roadmap': parsed_sections.get('project_roadmap', ''),
            'templates_hints': parsed_sections.get('templates_hints', ''),
            'common_pitfalls_and_troubleshooting': parsed_sections.get('common_pitfalls_and_how_to_avoid_them', ''),
            'success_criteria': parsed_sections.get('success_criteria', ''),
            'next_steps_and_extensions': parsed_sections.get('extensions_next_steps', ''),
            'is_ml_project': is_ml,
            'phase_videos': phase_videos,
            'user_profile_used': {
                'age': user_age,
                'education_level': user_education_level,
                'domain_interest': user_domain_interest,
                'skills_count': len(user_skills),
                'previous_projects_count': len(user_previous_projects)
            }
        }
        
        # Debug logging
        logger.info(f"Generated tools_and_materials: {project_data.get('tools_and_materials', 'EMPTY')}")
        logger.info(f"Raw project text length: {len(project_text)}")
        logger.info(f"Parsed sections: {list(parsed_sections.keys())}")
        logger.info(f"Tools & Materials from parsed sections: {parsed_sections.get('tools_materials', 'NOT_FOUND')}")
        logger.info(f"First 200 chars of project text: {project_text[:200]}")
        
        # Generate specific tools using dedicated AI function
        specific_tools = generate_specific_tools_with_ai(
            topic, 
            project_data.get('project_title', ''),
            project_data.get('project_overview', ''),
            category
        )
        
        # Add structured tools data for software projects
        if category == "software" and specific_tools:
            project_data['software_tools'] = {
                'type': 'software',
                'tools': specific_tools,
                'description': 'Essential development tools and technologies for this project'
            }
            # Also keep the text format for backward compatibility
            project_data['tools_and_materials'] = '\n'.join([f"- {tool['name']} ({tool['description']})" for tool in specific_tools])
            logger.info(f"Added structured software tools: {len(specific_tools)} tools")
        elif category == "software":
            # If no specific tools generated, create structured data from parsed tools
            tools_text = project_data.get('tools_and_materials', '')
            if tools_text:
                parsed_tools = extract_software_tools_from_suggestions(tools_text)
                if parsed_tools:
                    project_data['software_tools'] = {
                        'type': 'software',
                        'tools': parsed_tools,
                        'description': 'Essential development tools and technologies for this project'
                    }
                    logger.info(f"Created structured software tools from parsed text: {len(parsed_tools)} tools")
        elif category == "other" and specific_tools:
            project_data['software_tools'] = {
                'type': 'other',
                'tools': specific_tools,
                'description': 'Essential tools and materials for this project'
            }
            # Also keep the text format for backward compatibility
            project_data['tools_and_materials'] = '\n'.join([f"- {tool['name']} ({tool['description']})" for tool in specific_tools])
            logger.info(f"Added structured other category tools: {len(specific_tools)} tools")
        elif category == "other":
            # If no specific tools generated, create structured data from parsed tools
            tools_text = project_data.get('tools_and_materials', '')
            if tools_text:
                parsed_tools = extract_software_tools_from_suggestions(tools_text)
                if parsed_tools:
                    project_data['software_tools'] = {
                        'type': 'other',
                        'tools': parsed_tools,
                        'description': 'Essential tools and materials for this project'
                    }
                    logger.info(f"Created structured other category tools from parsed text: {len(parsed_tools)} tools")
        
        if specific_tools:
            # Replace or enhance the tools with AI-generated specific ones
            project_data['tools_and_materials'] = '\n'.join([f"- {tool['name']} ({tool['description']})" for tool in specific_tools])
            logger.info(f"Replaced tools with AI-generated specific ones: {project_data['tools_and_materials']}")
        
        # Check if tools and materials are generic and regenerate if needed
        tools_text = project_data.get('tools_and_materials', '')
        if tools_text and any(generic in tools_text.lower() for generic in ['computer with internet', 'text editor', 'programming language', 'documentation']):
            logger.warning("Detected generic tools, regenerating with more specific prompt")
            
            # Generate specific tools using suggest_tools function
            specific_tools = suggest_tools(
                topic, 
                category, 
                project_data.get('project_title', ''),
                project_data.get('project_overview', '')
            )
            
            if specific_tools and specific_tools.get('type') == 'software' and specific_tools.get('tools'):
                # Replace generic tools with specific ones
                specific_tool_list = specific_tools.get('tools', [])
                project_data['tools_and_materials'] = '\n'.join([f"- {tool}" for tool in specific_tool_list])
                logger.info(f"Replaced generic tools with specific ones: {project_data['tools_and_materials']}")
        
        # Enhance tools and materials using the suggest_tools function
        if project_data.get('tools_and_materials', '').strip():
            # If AI generated tools, enhance them with more specific suggestions
            enhanced_tools = suggest_tools(
                topic, 
                category, 
                project_data.get('project_title', ''),
                project_data.get('project_overview', '')
            )
            
            if enhanced_tools and enhanced_tools.get('type') == 'software' and enhanced_tools.get('tools'):
                # Combine AI-generated tools with enhanced suggestions
                ai_tools = project_data.get('tools_and_materials', '').split('\n')
                enhanced_tool_list = enhanced_tools.get('tools', [])
                
                # Create a combined list, avoiding duplicates
                combined_tools = []
                for tool in ai_tools:
                    if tool.strip() and tool.strip() not in combined_tools:
                        combined_tools.append(tool.strip())
                
                for tool in enhanced_tool_list:
                    if tool.strip() and tool.strip() not in combined_tools:
                        combined_tools.append(tool.strip())
                
                project_data['tools_and_materials'] = '\n'.join([f"- {tool}" for tool in combined_tools])
                logger.info(f"Enhanced tools and materials: {project_data['tools_and_materials']}")
        
        # Ensure we have tools and materials, if not, use fallback
        if not project_data.get('tools_and_materials', '').strip():
            logger.warning("No tools and materials generated by AI, using fallback")
            fallback_project = create_fallback_project(topic, available_time, user_skill_level, user_description, youtube_videos)
            project_data['tools_and_materials'] = fallback_project.get('tools_and_materials', '')
            logger.info(f"Applied fallback tools and materials: {project_data['tools_and_materials']}")
        
        # Double-check: if still no tools, generate them using the suggest_tools function
        if not project_data.get('tools_and_materials', '').strip():
            logger.warning("Still no tools and materials after fallback, generating with suggest_tools")
            try:
                suggested_tools = suggest_tools(
                    topic, 
                    category, 
                    project_data.get('project_title', ''),
                    project_data.get('project_overview', '')
                )
                if suggested_tools and suggested_tools.get('tools'):
                    project_data['tools_and_materials'] = '\n'.join([f"- {tool}" for tool in suggested_tools.get('tools', [])])
                    logger.info(f"Generated tools using suggest_tools: {project_data['tools_and_materials']}")
            except Exception as e:
                logger.error(f"Error generating tools with suggest_tools: {str(e)}")
                # Final fallback: use basic tools
                project_data['tools_and_materials'] = "- Computer with internet access\n- Text editor or IDE\n- Basic programming knowledge\n- Project documentation"
                logger.info("Applied final fallback tools")
        
        if youtube_videos:
            project_data['source_videos'] = youtube_videos
            
        if is_ml:
            project_data['datasets'] = get_dataset_recommendations(topic, user_skill_level)
            project_data['is_ml_project'] = True
        
        # Generate timeline data from the project roadmap
        timeline_data = generate_timeline_from_roadmap(project_data, available_time)
        if timeline_data:
            project_data['timeline'] = timeline_data
            logger.info(f"Generated timeline with {len(timeline_data)} phases")
        
        return project_data
        
    except Exception as e:
        logger.error(f"Error generating project task: {str(e)}")
        logger.info("Falling back to fallback project due to error")
        return create_fallback_project(topic, available_time, user_skill_level, user_description, youtube_videos)

def distribute_videos_to_phases(videos, topic, skill_level):
    """Distribute YouTube videos across project phases based on relevance"""
    if not videos:
        return {}
    
    # Create phase-specific video distributions
    phase_videos = {
        'phase_1': [],  # Setup and Planning
        'phase_2': [],  # Learning
        'phase_3': [],  # Implementation
        'phase_4': []   # Testing & Review
    }
    
    # Keywords for each phase
    phase_keywords = {
        'phase_1': ['setup', 'installation', 'configuration', 'environment', 'tools', 'planning', 'preparation'],
        'phase_2': ['tutorial', 'learn', 'basics', 'fundamentals', 'introduction', 'concepts', 'theory'],
        'phase_3': ['build', 'create', 'implement', 'coding', 'development', 'construction', 'assembly'],
        'phase_4': ['test', 'debug', 'review', 'optimize', 'finalize', 'deploy', 'presentation']
    }
    
    # Distribute videos based on title relevance to phases
    for video in videos:
        video_title = video.get('title', '').lower()
        video_keyword = video.get('keyword', '').lower()
        
        # Score each phase based on keyword matches
        phase_scores = {}
        for phase, keywords in phase_keywords.items():
            score = 0
            for keyword in keywords:
                if keyword in video_title or keyword in video_keyword:
                    score += 1
            phase_scores[phase] = score
        
        # Assign video to phase with highest score, or distribute evenly if no clear match
        best_phase = max(phase_scores, key=phase_scores.get)
        if phase_scores[best_phase] > 0:
            phase_videos[best_phase].append(video)
        else:
            # If no clear match, distribute evenly
            shortest_phase = min(phase_videos.keys(), key=lambda x: len(phase_videos[x]))
            phase_videos[shortest_phase].append(video)
    
    # Ensure each phase has at least one video if available
    if videos:
        for phase in phase_videos:
            if not phase_videos[phase] and videos:
                phase_videos[phase].append(videos.pop(0))
    
    return phase_videos

def create_fallback_project(topic, available_time, user_skill_level, user_description="", youtube_videos=None):
    """Create a fallback project when AI generation fails"""
    is_ml = is_ml_related_topic(topic, user_description)
    
    # Calculate proper phase times based on available time
    phase_times = calculate_phase_times(available_time)
    
    # Determine project type and set appropriate tools
    topic_lower = topic.lower()
    
    # More specific tool suggestions based on project type
    if 'weather' in topic_lower or 'api' in topic_lower or 'data' in topic_lower:
        tools_materials = [
            "Axios (for API calls and data fetching)",
            "Chart.js (for data visualization)",
            "OpenWeatherMap API (for weather data)",
            "React (for building the user interface)",
            "CSS Grid/Flexbox (for responsive layout)",
            "LocalStorage (for caching data)",
            "Git (for version control)"
        ]
        domain = "Data & API Integration"
    elif 'chat' in topic_lower or 'messaging' in topic_lower or 'communication' in topic_lower:
        tools_materials = [
            "Socket.io (for real-time communication)",
            "Express.js (for backend server)",
            "React (for frontend chat interface)",
            "MongoDB (for storing chat messages)",
            "JWT (for user authentication)",
            "CSS (for chat styling)",
            "Git (for version control)"
        ]
        domain = "Real-time Communication"
    elif 'e-commerce' in topic_lower or 'shop' in topic_lower or 'store' in topic_lower or 'payment' in topic_lower:
        tools_materials = [
            "Stripe API (for payment processing)",
            "MongoDB (for product and user database)",
            "React (for shopping interface)",
            "Express.js (for backend API)",
            "JWT (for user authentication)",
            "CSS (for product styling)",
            "Git (for version control)"
        ]
        domain = "E-commerce"
    elif 'social' in topic_lower or 'network' in topic_lower or 'profile' in topic_lower or 'user' in topic_lower:
        tools_materials = [
            "Firebase Auth (for user authentication)",
            "MongoDB (for user profiles and posts)",
            "React (for social interface)",
            "Express.js (for backend API)",
            "Multer (for file uploads)",
            "CSS (for social media styling)",
            "Git (for version control)"
        ]
        domain = "Social Networking"
    elif 'game' in topic_lower or 'gaming' in topic_lower or 'play' in topic_lower:
        tools_materials = [
            "Phaser.js (for game development)",
            "Canvas API (for graphics rendering)",
            "Web Audio API (for sound effects)",
            "React (for game UI)",
            "LocalStorage (for saving game progress)",
            "CSS (for game styling)",
            "Git (for version control)"
        ]
        domain = "Game Development"
    elif 'blog' in topic_lower or 'content' in topic_lower or 'cms' in topic_lower:
        tools_materials = [
            "Next.js (for content management)",
            "Markdown (for content writing)",
            "MongoDB (for content storage)",
            "React (for blog interface)",
            "Tailwind CSS (for styling)",
            "Git (for version control)",
            "Vercel (for deployment)"
        ]
        domain = "Content Management"
    elif 'portfolio' in topic_lower or 'personal' in topic_lower or 'resume' in topic_lower:
        tools_materials = [
            "React (for interactive portfolio)",
            "Framer Motion (for animations)",
            "Tailwind CSS (for styling)",
            "React Router (for navigation)",
            "EmailJS (for contact form)",
            "Git (for version control)",
            "Vercel/Netlify (for deployment)"
        ]
        domain = "Portfolio & Personal Branding"
    elif 'task' in topic_lower or 'todo' in topic_lower or 'management' in topic_lower or 'organizer' in topic_lower:
        tools_materials = [
            "React (for task interface)",
            "LocalStorage (for data persistence)",
            "React Hook Form (for task input)",
            "CSS (for task styling)",
            "Date-fns (for date handling)",
            "Git (for version control)",
            "Vercel (for deployment)"
        ]
        domain = "Task Management"
    elif 'fitness' in topic_lower or 'health' in topic_lower or 'tracker' in topic_lower or 'monitor' in topic_lower:
        tools_materials = [
            "Chart.js (for progress visualization)",
            "LocalStorage (for data storage)",
            "React (for tracking interface)",
            "CSS (for fitness app styling)",
            "Date-fns (for date calculations)",
            "Git (for version control)",
            "PWA capabilities (for mobile access)"
        ]
        domain = "Health & Fitness"
    elif 'recipe' in topic_lower or 'food' in topic_lower or 'cooking' in topic_lower:
        tools_materials = [
            "Spoonacular API (for recipe data)",
            "React (for recipe display)",
            "LocalStorage (for saved recipes)",
            "CSS (for recipe styling)",
            "React Router (for recipe navigation)",
            "Git (for version control)",
            "Vercel (for deployment)"
        ]
        domain = "Food & Recipe Management"
    elif 'app' in topic_lower or 'website' in topic_lower or 'web' in topic_lower:
        tools_materials = [
            "React (for frontend development)",
            "Node.js (for backend server)",
            "MongoDB (for database)",
            "Express.js (for API routes)",
            "CSS/SCSS (for styling)",
            "Git (for version control)",
            "Vercel/Netlify (for deployment)"
        ]
        domain = "Web Development"
    elif 'ml' in topic_lower or 'machine learning' in topic_lower or 'ai' in topic_lower:
        tools_materials = [
            "Python 3.7+ (for ML development)",
            "Jupyter Notebook (for analysis)",
            "Pandas (for data manipulation)",
            "NumPy (for numerical computing)",
            "Scikit-learn (for ML algorithms)",
            "Matplotlib (for visualization)",
            "Git (for version control)"
        ]
        domain = "Machine Learning"
    elif 'mobile' in topic_lower or 'app' in topic_lower:
        tools_materials = [
            "React Native (for mobile development)",
            "Expo (for development environment)",
            "Android Studio (for testing)",
            "Xcode (for iOS testing)",
            "Git (for version control)",
            "Firebase (for backend services)",
            "App Store Connect (for deployment)"
        ]
        domain = "Mobile Development"
    else:
        tools_materials = [
            "React (for frontend development)",
            "Node.js (for backend server)",
            "MongoDB (for database)",
            "Express.js (for API routes)",
            "CSS (for styling)",
            "Git (for version control)",
            "Vercel/Netlify (for deployment)"
        ]
        domain = "General Development"
    
    return {
        'project_title': f"DIY Project: {topic}",
        'estimated_time': available_time,
        'difficulty_level': user_skill_level,
        'knowledge_assessment': "Basic assessment available",
        'domain': domain,
        'project_overview': f"This {topic} project is designed to help you learn the fundamentals while building something practical and useful. You'll gain hands-on experience with real-world applications and develop skills that are valuable in today's technology landscape. This project is perfect for {user_skill_level}s who want to understand {topic} concepts through practical application. By the end, you'll have a working project that demonstrates your understanding and can serve as a portfolio piece or foundation for more advanced work.",
        'prerequisites': f"- Basic understanding of {topic}\n- Computer with internet access\n- Text editor or IDE",
        'tools_and_materials': '\n'.join([f"- {tool}" for tool in tools_materials]),
        'learning_objectives': f"- Understand {topic} fundamentals\n- Build a working project\n- Learn best practices\n- Document your work",
        'project_roadmap': f"""
PHASE 1: Setup and Planning ({phase_times['phase1']})
- Set up development environment
- Research project requirements
- Create project structure

PHASE 2: Learning ({phase_times['phase2']})
- Study relevant tutorials
- Practice basic concepts
- Take notes on key points

PHASE 3: Implementation ({phase_times['phase3']})
- Build the core project
- Implement main features
- Test basic functionality

PHASE 4: Testing & Review ({phase_times['phase4']})
- Test all features
- Fix any issues
- Document your work
""",
        'templates_hints': f"- Start with a simple structure\n- Use online tutorials as reference\n- Break down complex tasks into smaller steps\n- Don't hesitate to ask for help",
        'common_pitfalls_and_troubleshooting': f"- Don't rush through the basics\n- Take breaks when stuck\n- Ask for help when needed\n- Document your learning process",
        'success_criteria': f"- Completed basic {topic} project\n- Understanding of core concepts\n- Documented learning outcomes\n- Identified areas for further study",
        'next_steps_and_extensions': f"- Explore advanced {topic} topics\n- Build more complex projects\n- Join {topic} communities\n- Consider formal courses or certifications",
        'is_ml_project': is_ml,
        'timeline': [
            {
                "time": "Step 1",
                "title": "Research & Plan",
                "description": "Understand the project requirements and create a plan",
                "icon": "Brain",
                "color": "primary",
                "milestone": False,
                "duration": phase_times['phase1']
            },
            {
                "time": "Step 2",
                "title": "Design & Prototype",
                "description": "Create initial designs and prototypes",
                "icon": "Eye",
                "color": "secondary",
                "milestone": False,
                "duration": phase_times['phase2']
            },
            {
                "time": "Step 3",
                "title": "Build Core Features",
                "description": "Develop the main functionality",
                "icon": "Code",
                "color": "success",
                "milestone": True,
                "duration": phase_times['phase3']
            },
            {
                "time": "Step 4",
                "title": "Test & Refine",
                "description": "Validate functionality and make improvements",
                "icon": "CheckCircle",
                "color": "info",
                "milestone": False,
                "duration": phase_times['phase4']
            }
        ]
    }

def clean_tools_and_materials(tools_text):
    """Clean up the Tools & Materials section by removing extra characters and formatting"""
    if not tools_text:
        return tools_text
    
    try:
        # Split into lines and clean each line
        lines = tools_text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Remove common extra characters
            line = line.replace('`', '')  # Remove backticks
            line = line.replace('**', '')  # Remove bold markers
            line = line.replace('*', '')   # Remove asterisks
            
            # Remove redundant parentheses content that repeats the tool name
            if '(' in line and ')' in line:
                # Extract tool name and description
                tool_part = line.split('(')[0].strip()
                desc_part = line.split('(')[1].split(')')[0].strip()
                
                # Check if description is just repeating the tool name
                if tool_part.lower() in desc_part.lower() or desc_part.lower() in tool_part.lower():
                    # Keep only the tool name
                    line = tool_part
                else:
                    # Keep the description but clean it
                    line = f"{tool_part} ({desc_part})"
            
            # Remove lines that are just generic descriptions
            generic_terms = ['needed for', 'required for', 'essential for', 'used for']
            if any(term in line.lower() for term in generic_terms) and len(line.split()) < 4:
                continue
                
            # Remove duplicate lines
            if line not in cleaned_lines:
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
        
    except Exception as e:
        logger.error(f"Error cleaning tools and materials: {str(e)}")
        return tools_text

def parse_project_text(project_text):
    """Parse the generated project text into structured data"""
    try:
        sections = {}
        current_section = None
        current_content = []
        
        lines = project_text.split('\n')
        logger.info(f"Parsing {len(lines)} lines of project text")
        
        section_markers = [
            'PROJECT TITLE:', 'ESTIMATED TIME:', 'DIFFICULTY LEVEL:', 'DOMAIN:', 'KNOWLEDGE SUMMARY:',
            'PROJECT OVERVIEW:', 'PREREQUISITES:', 'TOOLS & MATERIALS:', 'LEARNING OBJECTIVES:', 
            'PROJECT ROADMAP:', 'TEMPLATES / HINTS:', 'COMMON PITFALLS & HOW TO AVOID THEM:', 
            'SUCCESS CRITERIA:', 'EXTENSIONS & NEXT STEPS:', 'DATASET RESOURCES:', 'ADDITIONAL RESOURCES:'
        ]
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this line is a section marker
            is_section_marker = False
            for marker in section_markers:
                if line.startswith(marker):
                    # Save previous section
                    if current_section:
                        section_content = '\n'.join(current_content)
                        # Clean up tools and materials section specifically
                        if current_section == 'tools_materials':
                            section_content = clean_tools_and_materials(section_content)
                        sections[current_section] = section_content
                        logger.info(f"Saved section '{current_section}' with {len(current_content)} lines")
                    
                    # Start new section
                    current_section = marker.lower().replace(' & ', '_').replace(' ', '_').replace(':', '')
                    # Get content after the colon if it exists
                    content_after_colon = line.split(':', 1)[1].strip() if ':' in line else ''
                    current_content = [content_after_colon] if content_after_colon else []
                    logger.info(f"Started new section '{current_section}' with content: '{content_after_colon}'")
                    logger.info(f"Original marker: '{marker}' -> processed key: '{current_section}'")
                    is_section_marker = True
                    break
            
            if not is_section_marker:
                if line.startswith('PHASE'):
                    if current_section == 'project_roadmap':
                        current_content.append(line)
                elif current_section:
                    current_content.append(line)
        
        # Save the last section
        if current_section:
            section_content = '\n'.join(current_content)
            # Clean up tools and materials section specifically
            if current_section == 'tools_materials':
                section_content = clean_tools_and_materials(section_content)
            sections[current_section] = section_content
            logger.info(f"Saved final section '{current_section}' with {len(current_content)} lines")
        
        logger.info(f"Final parsed sections: {list(sections.keys())}")
        return sections
        
    except Exception as e:
        logger.error(f"Error parsing project text: {str(e)}")
        return {'raw_text': project_text}

def generate_excalidraw_diagram(project_data):
    """Generate Excalidraw diagram data based on project information"""
    try:
        if not model:
            return None
            
        prompt = f"""
        Create a beautiful visual workflow diagram for this DIY project using Excalidraw format.
        
        Project Title: {project_data.get('project_title', 'DIY Project')}
        Skill Level: {project_data.get('skill_level', 'beginner')}
        Duration: {project_data.get('estimated_time', 'Unknown')}
        Phases: {project_data.get('project_roadmap', '')}
        Tools: {project_data.get('tools_and_materials', '')}
        
        Generate a JSON object in Excalidraw format that includes:
        1. A central project title box
        2. Phase boxes connected with arrows showing the workflow
        3. Tool/material boxes connected to relevant phases
        4. Milestone indicators
        5. Beautiful styling with colors and icons
        
        The diagram should be:
        - Visually appealing with a sketch-style aesthetic
        - Clear workflow progression
        - Include relevant icons and colors
        - Show dependencies and relationships
        - Be suitable for a {project_data.get('skill_level', 'beginner')} level project
        
        Return only the JSON object, no additional text.
        """
        
        response = model.generate_content(prompt)
        diagram_data = response.text.strip()
        
        # Try to parse the JSON response
        try:
            return json.loads(diagram_data)
        except json.JSONDecodeError:
            # If parsing fails, create a basic diagram structure
            return create_basic_excalidraw_diagram(project_data)
            
    except Exception as e:
        logger.error(f"Error generating Excalidraw diagram: {str(e)}")
        return create_basic_excalidraw_diagram(project_data)

def create_basic_excalidraw_diagram(project_data):
    """Create a robust Excalidraw diagram structure for a roadmap flowchart"""
    try:
        # Extract phases from project roadmap (fallback: use numbers if empty)
        phases = []
        roadmap_text = project_data.get('project_roadmap', '')
        if roadmap_text:
            # Try to split by PHASE or by lines
            if 'PHASE' in roadmap_text:
                phase_sections = roadmap_text.split('PHASE')
                for i, section in enumerate(phase_sections[1:], 1):
                    lines = section.split('\n')
                    title = lines[0].replace(f'{i}:', '').strip() if lines else f'Phase {i}'
                    phases.append(title)
            else:
                # Fallback: split by lines
                for i, line in enumerate(roadmap_text.split('\n')):
                    if line.strip():
                        phases.append(line.strip())
        if not phases:
            phases = [f"Phase {i+1}" for i in range(3)]

        elements = []
        arrows = []
        # Project title (centered at top)
        elements.append({
            "type": "text",
            "x": 400,
            "y": 50,
            "width": 250,
            "height": 50,
            "text": project_data.get('project_title', 'DIY Project'),
            "fontSize": 28,
            "id": "project-title",
            "angle": 0,
            "strokeColor": "#0ea5e9",
            "backgroundColor": "#f0f9ff"
        })
        # Phase boxes (horizontal flow)
        phase_y = 200
        phase_x_start = 100
        phase_gap = 220
        for i, phase in enumerate(phases[:5]):
            x = phase_x_start + (i * phase_gap)
            # Box
            elements.append({
                "type": "rectangle",
                "x": x,
                "y": phase_y,
                "width": 180,
                "height": 80,
                "backgroundColor": "#fef3c7",
                "strokeColor": "#f59e0b",
                "strokeWidth": 2,
                "id": f"phase-{i}",
                "angle": 0
            })
            # Text inside box
            elements.append({
                "type": "text",
                "x": x + 10,
                "y": phase_y + 20,
                "width": 160,
                "height": 40,
                "text": phase,
                "fontSize": 16,
                "id": f"phase-text-{i}",
                "angle": 0
            })
            # Arrow to next phase
            if i < len(phases[:5]) - 1:
                arrow_x1 = x + 180
                arrow_x2 = x + phase_gap
                arrow_y = phase_y + 40
                elements.append({
                    "type": "arrow",
                    "x": arrow_x1,
                    "y": arrow_y,
                    "width": phase_gap - 40,
                    "height": 0,
                    "points": [[0, 0], [phase_gap - 40, 0]],
                    "strokeColor": "#6b7280",
                    "strokeWidth": 2,
                    "id": f"arrow-{i}-{i+1}",
                    "angle": 0
                })
        # Tools/materials box (below phases)
        tools_text = project_data.get('tools_and_materials', '')
        if tools_text:
            elements.append({
                "type": "rectangle",
                "x": phase_x_start,
                "y": phase_y + 130,
                "width": 300,
                "height": 60,
                "backgroundColor": "#ecfdf5",
                "strokeColor": "#10b981",
                "strokeWidth": 2,
                "id": "tools-box",
                "angle": 0
            })
            elements.append({
                "type": "text",
                "x": phase_x_start + 10,
                "y": phase_y + 145,
                "width": 280,
                "height": 40,
                "text": "Tools & Materials:\n" + tools_text[:100] + ("..." if len(tools_text) > 100 else ""),
                "fontSize": 12,
                "id": "tools-text",
                "angle": 0
            })
        return {
            "type": "excalidraw",
            "version": 2,
            "source": "DIY Project Generator",
            "elements": elements,
            "appState": {
                "viewBackgroundColor": "#ffffff",
                "gridSize": 20
            }
        }
    except Exception as e:
        print("Error creating diagram:", e)
        return None

def noop_mermaid(*args, **kwargs):
    return None

def remove_mermaid_endpoints_and_functions():
    pass  # This is a placeholder for code removal

@app.route('/api/generate-mermaid-roadmap', methods=['POST'])
def api_generate_mermaid_roadmap():
    """Generate Mermaid.js flowchart for project roadmap"""
    try:
        data = request.get_json()
        
        if not data or 'project_data' not in data:
            return jsonify({
                'success': False,
                'error': 'Project data is required'
            }), 400
        
        project_data = data['project_data']
        
        # Generate Mermaid flowchart
        mermaid_code = generate_mermaid_flowchart(project_data)
        
        if not mermaid_code:
            return jsonify({
                'success': False,
                'error': 'Failed to generate Mermaid flowchart'
            }), 500
        
        return jsonify({
            'success': True,
            'mermaid_code': mermaid_code
        })
        
    except Exception as e:
        logger.error(f"Error in generate-mermaid-roadmap endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def generate_mermaid_flowchart(project_data):
    """Generate Mermaid.js flowchart from project data"""
    try:
        if not model:
            return create_basic_mermaid_flowchart(project_data)
        
        prompt = f"""
Create a Mermaid.js flowchart for this DIY project roadmap:

Project Title: {project_data.get('project_title', 'DIY Project')}
Project Overview: {project_data.get('project_overview', '')}
Tools & Materials: {project_data.get('tools_and_materials', '')}
Project Roadmap: {project_data.get('project_roadmap', '')}

Generate a clear, professional flowchart that shows:
1. Project phases/steps as boxes
2. Tools and materials connected to relevant phases
3. Decision points and milestones
4. Clear flow direction

Use this format:
```mermaid
flowchart TD
    A[Start] --> B[Phase 1: Setup]
    B --> C[Phase 2: Development]
    C --> D[Phase 3: Testing]
    D --> E[Complete]
    
    F[Tool 1] --> B
    G[Tool 2] --> C
    H[Tool 3] --> D
```

Make it:
- Easy to follow
- Include relevant tools and materials
- Show clear progression
- Use appropriate styling
- Keep it concise but informative

Return only the Mermaid code, no additional text.
        """
        
        response = model.generate_content(prompt)
        mermaid_code = response.text.strip()
        
        # Clean up the response
        if mermaid_code.startswith('```mermaid'):
            mermaid_code = mermaid_code.replace('```mermaid', '').replace('```', '').strip()
        
        return mermaid_code
        
    except Exception as e:
        logger.error(f"Error generating Mermaid flowchart: {str(e)}")
        return create_basic_mermaid_flowchart(project_data)

def create_basic_mermaid_flowchart(project_data):
    """Create a basic Mermaid flowchart as fallback"""
    try:
        title = project_data.get('title', 'Project Workflow')
        days = project_data.get('days', [])
        
        flowchart = f"""
graph TD
    A[Start: {title}] --> B[Project Setup]
    B --> C[Development Phase]
    C --> D[Testing & Debugging]
    D --> E[Deployment]
    E --> F[Project Complete]
    
    style A fill:#a2d9ce
    style F fill:#a2d9ce
    style B fill:#aed6f1
    style C fill:#aed6f1
    style D fill:#aed6f1
    style E fill:#aed6f1
        """
        
        return flowchart.strip()
    except Exception as e:
        logger.error(f"Error creating basic Mermaid flowchart: {str(e)}")
        return "graph TD\n    A[Error generating flowchart]"

def generate_project_description_for_flowchart(project_data):
    """Generate a detailed project description for flowchart generation"""
    try:
        if not model:
            return "Project workflow description"
            
        title = project_data.get('title', 'DIY Project')
        days = project_data.get('days', [])
        tools = project_data.get('tools', [])
        materials = project_data.get('materials', [])
        
        # Create a detailed description of the project workflow
        workflow_description = f"""
        Project: {title}
        
        This project involves the following workflow:
        
        Phase 1 - Setup and Planning:
        - Project initialization and environment setup
        - Gathering required tools and materials: {', '.join(tools[:5])}
        - Understanding project requirements and objectives
        
        Phase 2 - Development Process:
        """
        
        for i, day in enumerate(days[:5], 1):  # Limit to first 5 days for clarity
            workflow_description += f"""
        Day {i}: {day.get('title', 'Development')}
        - Tasks: {', '.join(day.get('tasks', [])[:3])}
        - Duration: {day.get('duration', '1 day')}
        """
        
        workflow_description += """
        
        Phase 3 - Testing and Refinement:
        - Testing the implemented features
        - Debugging and fixing issues
        - Performance optimization
        
        Phase 4 - Finalization:
        - Final testing and validation
        - Documentation and cleanup
        - Project completion and delivery
        
        The process follows a systematic approach from initial setup through development, testing, and final delivery.
        """
        
        return workflow_description
        
    except Exception as e:
        logger.error(f"Error generating project description: {str(e)}")
        return "Project workflow description"

def generate_flowchart_from_project(project_data):
    """Generate a flowchart using OpenRouter LLM based on project data"""
    try:
        # Generate project description
        project_description = generate_project_description_for_flowchart(project_data)
        
        # System prompt for flowchart generation
        system_prompt = """
        You are a visual design expert specializing in creating beautiful, modern, and highly readable flowcharts using the Graphviz DOT language.
        Your goal is to transform user text into a professional and aesthetically pleasing diagram.

        *MANDATORY DOT STRUCTURE AND STYLE GUIDE:*

        1.  *Overall Graph:*
            -   Use rankdir=TB; for a top-to-bottom flow.
            -   Set a soft background color: bgcolor="#f7f9f9";
            -   Use curved lines for a smoother look: splines=ortho;
            -   Ensure good spacing between node layers and nodes: nodesep=0.6; ranksep=0.8;

        2.  *Default Node Style (for all nodes):*
            -   shape=box, style="filled,rounded", fontname="Helvetica", penwidth=1.5, color="#34495e"

        3.  *Default Edge Style (for all arrows):*
            -   color="#34495e", penwidth=1.5, arrowsize=0.9, fontname="Helvetica"

        4.  *Specific Node Types (use these fill colors and shapes):*
            -   *Start/End Nodes:* Use shape=ellipse and fillcolor="#a2d9ce" (Mint Green).
            -   *Process/Action Nodes:* Use shape=box and fillcolor="#aed6f1" (Sky Blue).
            -   *Decision Nodes (if/then):* Use shape=diamond and fillcolor="#fdebd0" (Pale Orange).
            -   *Error/Stop/Negative Outcome Nodes:* Use shape=box and fillcolor="#f5b7b1" (Soft Red).
            -   *Database/Data Nodes:* Use shape=cylinder and fillcolor="#d7dbdd" (Light Grey).

        *YOUR TASK:*
        Analyze the user's text. Generate ONLY the DOT language code that implements the described process using the styles defined above. Keep labels concise. Enclose the final code in a single markdown block.
        """
        
        # Generate flowchart using OpenRouter API
        openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5000",
            "X-Title": "DIY Project Generator"
        }
        
        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": project_description}
            ],
            "temperature": 0.1,
            "max_tokens": 1500
        }
        
        response = requests.post(openrouter_url, headers=headers, json=payload, timeout=60)
        
        if response.status_code != 200:
            logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
            return {
                'success': False,
                'error': f"OpenRouter API error: {response.status_code}",
                'description': project_description
            }
        
        response_data = response.json()
        dot_string = response_data['choices'][0]['message']['content'].strip()
        
        # Clean up the DOT string
        match = re.search(r'(dot)?(.*)', dot_string, re.DOTALL)
        if match:
            dot_string = match.group(2).strip()
        
        # Generate PNG image
        try:
            src = graphviz.Source(dot_string)
            rendered_path = src.render("project_flowchart", format='png', cleanup=True)
            
            # Read the generated image and convert to base64
            with open(rendered_path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode()
            
            return {
                'success': True,
                'dot_code': dot_string,
                'image_base64': encoded_string,
                'description': project_description
            }
            
        except Exception as e:
            logger.error(f"Error rendering flowchart: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to render flowchart: {str(e)}",
                'dot_code': dot_string,
                'description': project_description
            }
            
    except Exception as e:
        logger.error(f"Error generating flowchart: {str(e)}")
        return {
            'success': False,
            'error': f"Failed to generate flowchart: {str(e)}",
            'description': generate_project_description_for_flowchart(project_data)
        }

# API Routes - Pure API backend for frontend integration
@app.route('/api/extract-video-id', methods=['POST'])
def api_extract_video_id():
    try:
        data = request.get_json()
        url = data.get('url', '')
        
        video_id = extract_video_id(url)
        if video_id:
            return jsonify({'success': True, 'video_id': video_id})
        else:
            return jsonify({'success': False, 'error': 'Invalid YouTube URL'})
    except Exception as e:
        logger.error(f"Error in extract_video_id API: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/get-transcript', methods=['POST'])
def api_get_transcript():
    try:
        data = request.get_json()
        video_id = data.get('video_id', '')
        preferred_languages = data.get('preferred_languages', ['en'])
        translate_to = data.get('translate_to', None)
        
        transcript = get_transcript(video_id, preferred_languages, translate_to)
        return jsonify({'success': True, 'transcript': transcript})
    except Exception as e:
        logger.error(f"Error in get_transcript API: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/generate-roadmap', methods=['POST'])
def api_generate_roadmap():
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        # Extract data from request
        topic = data.get('topic')
        available_time = data.get('available_time')
        skill_level = data.get('skill_level', 'beginner')
        category = data.get('category', 'software')
        user_description = data.get('user_description', '')
        youtube_url = data.get('youtube_url', '')
        user_profile = data.get('user_profile', {})  # New field for user profile data
        transcript_content = ""

        if not topic or not available_time:
            return jsonify({"success": False, "error": "Topic and available_time are required"}), 400

        logger.info(f"Generating roadmap for topic: {topic}, category: {category}")
        logger.info(f"User description: {user_description[:50]}...")
        logger.info(f"User profile provided: {bool(user_profile)}")
        
        # Assess knowledge level based on description
        assessed_skill_level, knowledge_assessment = assess_knowledge_level(user_description, skill_level)
        logger.info(f"Assessed skill level: {assessed_skill_level}")

        if youtube_url:
            video_id = extract_video_id(youtube_url)
            if video_id:
                transcript_content = get_transcript(video_id)
                if transcript_content:
                    logger.info(f"Transcript for video {video_id} extracted successfully.")
                else:
                    logger.warning(f"Could not get transcript for video {video_id}. Proceeding without it.")
        
        keywords = extract_keywords_from_topic(topic, transcript_content, user_description)
        logger.info(f"Keywords extracted: {keywords}")
        
        search_results, all_videos = search_youtube_keywords(keywords)
        logger.info(f"Found {len(all_videos)} videos")
        
        project_data = generate_project_task(
            topic=topic,
            transcript_content=transcript_content,
            available_time=available_time,
            user_skill_level=assessed_skill_level,
            user_description=user_description,
            youtube_videos=all_videos,
            knowledge_assessment=knowledge_assessment,
            category=category,
            user_profile=user_profile  # Pass user profile data
        )
        
        if not project_data:
            raise Exception("Failed to generate project data")
        
        logger.info("Roadmap generated successfully")
        
        # Find GitHub templates for software projects only
        github_templates = None
        hardware_suggestions = None
        software_tools = None
        
        if category == "software":
            logger.info("Finding GitHub templates for software project")
            github_templates = find_github_templates(topic, category, project_data.get('project_title', ''), project_data.get('project_overview', ''))
            # Extract software tools from project data
            if project_data.get('software_tools'):
                software_tools = project_data['software_tools']
                logger.info(f"Found structured software tools: {len(software_tools.get('tools', []))} tools")
        elif category == "other":
            logger.info("Processing other category project")
            # Extract tools from project data for other category
            if project_data.get('software_tools'):
                software_tools = project_data['software_tools']
                logger.info(f"Found structured other category tools: {len(software_tools.get('tools', []))} tools")
        elif category == "hardware":
            logger.info("Generating hardware suggestions for hardware project")
            hardware_suggestions = suggest_tools(
                topic, 
                category, 
                project_data.get('project_title', ''),
                project_data.get('project_overview', '')
            )
        
        response_data = {
            'success': True,
            'project_data': project_data,
            'keywords': keywords,
            'search_results': search_results,
            'videos': all_videos,
            'assessed_skill_level': assessed_skill_level,
            'knowledge_assessment': knowledge_assessment
        }
        
        if github_templates:
            response_data['github_templates'] = github_templates
        if hardware_suggestions:
            response_data['hardware_suggestions'] = hardware_suggestions
        if software_tools:
            response_data['software_tools'] = software_tools
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in generate_roadmap API: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/available-languages', methods=['POST'])
def api_available_languages():
    try:
        data = request.get_json()
        video_id = data.get('video_id', '')
        
        languages = get_available_languages(video_id)
        return jsonify({'success': True, 'languages': languages})
    except Exception as e:
        logger.error(f"Error in available_languages API: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/generate-excalidraw', methods=['POST'])
def api_generate_excalidraw():
    """Generate Excalidraw diagram for project"""
    try:
        data = request.get_json()
        project_data = data.get('project_data', {})
        
        if not project_data:
            return jsonify({'success': False, 'error': 'No project data provided'})
        
        result = generate_excalidraw_diagram(project_data)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error generating Excalidraw diagram: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/generate-flowchart', methods=['POST'])
def api_generate_flowchart():
    """Generate flowchart for project"""
    try:
        data = request.get_json()
        project_data = data.get('project_data', {})
        
        if not project_data:
            return jsonify({'success': False, 'error': 'No project data provided'})
        
        result = generate_flowchart_from_project(project_data)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error generating flowchart: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/test-fallback', methods=['POST'])
def test_fallback():
    """Test endpoint to directly test fallback project generation"""
    try:
        data = request.json
        topic = data.get('topic', 'Test Project')
        available_time = data.get('available_time', '2 hours')
        user_skill_level = data.get('skill_level', 'beginner')
        user_description = data.get('user_description', '')
        
        # Test fallback project generation
        fallback_project = create_fallback_project(topic, available_time, user_skill_level, user_description)
        
        logger.info(f"Fallback project generated for topic: {topic}")
        logger.info(f"Tools and materials: {fallback_project.get('tools_and_materials', 'EMPTY')}")
        
        return jsonify({
            'success': True,
            'fallback_project': fallback_project,
            'tools_and_materials': fallback_project.get('tools_and_materials', 'EMPTY'),
            'model_available': model is not None
        })
        
    except Exception as e:
        logger.error(f"Error in test-fallback endpoint: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'gemini_available': model is not None,
        'timestamp': time.time(),
        'message': 'AI DIY Project Generator API is running'
    })

@app.route('/')
def api_info():
    """API information endpoint"""
    return jsonify({
        'name': 'AI DIY Project Generator API',
        'version': '1.0.0',
        'description': 'Backend API for generating AI-powered project roadmaps with emotion detection',
        'endpoints': {
            'POST /api/generate-roadmap': 'Generate project roadmap',
            'POST /api/generate-roadmap-with-mood': 'Generate project roadmap with mood consideration',
            'POST /api/capture-emotion': 'Capture emotion from camera',
            'POST /api/detect-emotion-from-image': 'Detect emotion from image',
            'POST /api/adjust-project-for-mood': 'Adjust project based on detected emotion',
            'GET /api/emotion-detector-status': 'Check emotion detector status',
            'POST /api/extract-video-id': 'Extract YouTube video ID',
            'POST /api/get-transcript': 'Get YouTube video transcript',
            'POST /api/available-languages': 'Get available transcript languages',
            'POST /api/generate-excalidraw': 'Generate Excalidraw diagram',
            'POST /api/generate-flowchart': 'Generate flowchart',
            'GET /health': 'Health check',
            'GET /': 'API information'
        },
        'features': {
            'emotion_detection': 'Facial emotion detection using OpenCV and TensorFlow',
            'mood_based_adjustment': 'Project difficulty adjustment based on detected emotions',
            'camera_capture': 'Real-time emotion capture from webcam',
            'image_processing': 'Emotion detection from uploaded images'
        },
        'frontend_integration': 'This API is designed to work with the Next.js DIY Generator frontend component'
    })

def generate_timeline_from_roadmap(project_data, available_time):
    """Generate workflow-focused timeline data from project roadmap phases"""
    try:
        if not model:
            return []
        
        roadmap_text = project_data.get('project_roadmap', '')
        project_title = project_data.get('project_title', '')
        project_overview = project_data.get('project_overview', '')
        
        if not roadmap_text:
            return []
        
        # Calculate phase times for accurate time distribution
        phase_times = calculate_phase_times(available_time)
        
        # Analyze project complexity to determine step count
        complexity_score = analyze_project_complexity(project_title, project_overview, roadmap_text, available_time)
        
        prompt = f"""
        Create a streamlined workflow timeline for this project. This should be different from the detailed project roadmap - focus on key workflow steps that show the logical progression.

        PROJECT: {project_title}
        OVERVIEW: {project_overview[:300]}...
        ROADMAP: {roadmap_text}
        TOTAL TIME: {available_time} ({phase_times['total_minutes']} minutes)
        PROJECT COMPLEXITY: {complexity_score}

        IMPORTANT: Create exactly {complexity_score['steps']} workflow steps based on the project complexity.
        - Simple projects (2-3 hours): 3-4 steps
        - Medium projects (4-8 hours): 5-6 steps  
        - Complex projects (8+ hours): 7-8 steps

        Create a workflow timeline with these characteristics:
        - Each step represents a major workflow phase
        - Focus on "what" and "why" not detailed "how"
        - Use workflow-oriented language (e.g., "Research & Plan", "Design & Prototype", "Build Core Features")
        - Be specific to this project, not generic
        - Each step should have a clear purpose and outcome
        - Distribute the total time ({available_time}) across all {complexity_score['steps']} steps appropriately

        For each step include:
        - time: brief time indicator (e.g., "Step 1", "Phase 1", or specific time)
        - title: workflow-focused title (3-5 words max)
        - description: what this step accomplishes (1-2 sentences)
        - icon: one of [Calendar, Clock, CheckCircle, Play, Target, Zap, Code, Cpu, Sparkles, Package, Users, Brain, Eye, AlertCircle]
        - color: one of [primary, secondary, success, warning, info, grey]
        - milestone: true only for major achievements (max 2 milestones)
        - duration: estimated time for this step (distribute {available_time} across {complexity_score['steps']} steps)

        Return as JSON array. Make it project-specific, not generic.
        """
        
        response = model.generate_content(prompt)
        timeline_text = response.text.strip()
        
        # Try to parse JSON from the response
        try:
            # Extract JSON from the response if it's wrapped in markdown
            if '```json' in timeline_text:
                timeline_text = timeline_text.split('```json')[1].split('```')[0]
            elif '```' in timeline_text:
                timeline_text = timeline_text.split('```')[1]
            
            timeline_data = json.loads(timeline_text)
            
            # Validate and clean the timeline data
            cleaned_timeline = []
            for step in timeline_data:
                if isinstance(step, dict) and 'title' in step and 'description' in step:
                    # Ensure required fields
                    cleaned_step = {
                        'time': step.get('time', ''),
                        'title': step.get('title', '').strip(),
                        'description': step.get('description', '').strip(),
                        'icon': step.get('icon', 'Calendar'),
                        'color': step.get('color', 'primary'),
                        'milestone': step.get('milestone', False),
                        'duration': step.get('duration', '')
                    }
                    cleaned_timeline.append(cleaned_step)
            
            logger.info(f"Generated workflow timeline with {len(cleaned_timeline)} steps (target: {complexity_score['steps']})")
            return cleaned_timeline
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse timeline JSON: {e}")
            logger.error(f"Timeline text: {timeline_text}")
            return []
            
    except Exception as e:
        logger.error(f"Error generating timeline: {str(e)}")
        return []

def analyze_project_complexity(project_title, project_overview, roadmap_text, available_time):
    """Analyze project complexity to determine appropriate step count"""
    try:
        # Parse available time to minutes
        time_str = available_time.strip().lower()
        total_minutes = 0
        
        if 'hour' in time_str or 'hr' in time_str:
            if 'hour' in time_str:
                hours = int(time_str.split('hour')[0].strip())
            else:
                hours = int(time_str.split('hr')[0].strip())
            total_minutes = hours * 60
        elif 'minute' in time_str or 'min' in time_str:
            if 'minute' in time_str:
                minutes = int(time_str.split('minute')[0].strip())
            else:
                minutes = int(time_str.split('min')[0].strip())
            total_minutes = minutes
        else:
            import re
            numbers = re.findall(r'\d+', time_str)
            if numbers:
                total_minutes = int(numbers[0])
            else:
                total_minutes = 120
        
        # Analyze complexity factors
        complexity_factors = {
            'time_based': 0,
            'feature_based': 0,
            'phase_based': 0
        }
        
        # Time-based complexity
        if total_minutes <= 180:  # 3 hours or less
            complexity_factors['time_based'] = 1  # Simple
        elif total_minutes <= 480:  # 8 hours or less
            complexity_factors['time_based'] = 2  # Medium
        else:
            complexity_factors['time_based'] = 3  # Complex
        
        # Feature-based complexity (from overview)
        overview_lower = project_overview.lower()
        feature_keywords = {
            'simple': 1, 'basic': 1, 'todo': 1, 'calculator': 1,
            'weather': 2, 'dashboard': 2, 'api': 2, 'database': 2,
            'e-commerce': 3, 'platform': 3, 'authentication': 3, 'payment': 3, 'admin': 3
        }
        
        for keyword, score in feature_keywords.items():
            if keyword in overview_lower:
                complexity_factors['feature_based'] = max(complexity_factors['feature_based'], score)
        
        # Phase-based complexity (from roadmap)
        phase_count = len([line for line in roadmap_text.split('\n') if line.strip().startswith('PHASE')])
        if phase_count <= 3:
            complexity_factors['phase_based'] = 1
        elif phase_count <= 5:
            complexity_factors['phase_based'] = 2
        else:
            complexity_factors['phase_based'] = 3
        
        # Calculate overall complexity
        avg_complexity = sum(complexity_factors.values()) / len(complexity_factors)
        
        # Determine step count based on complexity
        if avg_complexity <= 1.5:
            steps = 4  # Simple: 3-4 steps
        elif avg_complexity <= 2.5:
            steps = 6  # Medium: 5-6 steps
        else:
            steps = 8  # Complex: 7-8 steps
        
        complexity_level = "Simple" if avg_complexity <= 1.5 else "Medium" if avg_complexity <= 2.5 else "Complex"
        
        logger.info(f"Project complexity analysis: {complexity_factors}, avg: {avg_complexity:.1f}, level: {complexity_level}, steps: {steps}")
        
        return {
            'level': complexity_level,
            'steps': steps,
            'factors': complexity_factors,
            'avg_complexity': avg_complexity
        }
        
    except Exception as e:
        logger.error(f"Error analyzing project complexity: {str(e)}")
        # Fallback to medium complexity
        return {
            'level': 'Medium',
            'steps': 6,
            'factors': {'time_based': 2, 'feature_based': 2, 'phase_based': 2},
            'avg_complexity': 2.0
        }

# Emotion Detection API Endpoints
@app.route('/api/capture-emotion', methods=['POST'])
def api_capture_emotion():
    """Capture emotion from camera and return detection results"""
    try:
        if not emotion_detector:
            return jsonify({
                'success': False,
                'error': 'Emotion detector not available'
            }), 500
        
        data = request.get_json() or {}
        capture_duration = data.get('capture_duration', 3)
        
        logger.info(f"Starting emotion capture for {capture_duration} seconds")
        
        # Capture emotion from camera
        result = emotion_detector.capture_emotion_from_camera(capture_duration)
        
        if result['success']:
            # Get mood adjustment information
            mood_adjustment = emotion_detector.get_mood_adjustment(result['emotion'])
            
            return jsonify({
                'success': True,
                'emotion': result['emotion'],
                'confidence': result['confidence'],
                'detection_count': result.get('detection_count', 0),
                'total_detections': result.get('total_detections', 0),
                'mood_adjustment': mood_adjustment,
                'message': mood_adjustment['message']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error'],
                'emotion': None,
                'confidence': 0.0
            })
            
    except Exception as e:
        logger.error(f"Error in capture-emotion API: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/detect-emotion-from-image', methods=['POST'])
def api_detect_emotion_from_image():
    """Detect emotion from a base64 encoded image"""
    try:
        if not emotion_detector:
            return jsonify({
                'success': False,
                'error': 'Emotion detector not available'
            }), 500
        
        data = request.get_json()
        if not data or 'image_data' not in data:
            return jsonify({
                'success': False,
                'error': 'Image data is required'
            }), 400
        
        image_data = data['image_data']
        
        # Detect emotion from image
        result = emotion_detector.detect_emotion_from_image(image_data)
        
        if result['success']:
            # Get mood adjustment information
            mood_adjustment = emotion_detector.get_mood_adjustment(result['emotion'])
            
            return jsonify({
                'success': True,
                'emotion': result['emotion'],
                'confidence': result['confidence'],
                'all_predictions': result.get('all_predictions', {}),
                'mood_adjustment': mood_adjustment,
                'message': mood_adjustment['message']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error'],
                'emotion': None,
                'confidence': 0.0
            })
            
    except Exception as e:
        logger.error(f"Error in detect-emotion-from-image API: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/adjust-project-for-mood', methods=['POST'])
def api_adjust_project_for_mood():
    """Adjust project based on detected emotion"""
    try:
        if not emotion_detector:
            return jsonify({
                'success': False,
                'error': 'Emotion detector not available'
            }), 500
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        project_data = data.get('project_data', {})
        emotion = data.get('emotion')
        
        if not project_data:
            return jsonify({
                'success': False,
                'error': 'Project data is required'
            }), 400
        
        if not emotion:
            return jsonify({
                'success': False,
                'error': 'Emotion is required'
            }), 400
        
        # Adjust project for mood
        adjusted_project = emotion_detector.adjust_project_for_mood(project_data, emotion)
        
        return jsonify({
            'success': True,
            'original_project': project_data,
            'adjusted_project': adjusted_project,
            'emotion': emotion,
            'mood_adjustment': emotion_detector.get_mood_adjustment(emotion)
        })
        
    except Exception as e:
        logger.error(f"Error in adjust-project-for-mood API: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/generate-roadmap-with-mood', methods=['POST'])
def api_generate_roadmap_with_mood():
    """Generate project roadmap with mood consideration"""
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        # Extract data from request
        topic = data.get('topic')
        available_time = data.get('available_time')
        skill_level = data.get('skill_level', 'beginner')
        category = data.get('category', 'software')
        user_description = data.get('user_description', '')
        youtube_url = data.get('youtube_url', '')
        user_profile = data.get('user_profile', {})
        emotion = data.get('emotion')  # New field for emotion
        transcript_content = ""

        if not topic or not available_time:
            return jsonify({"success": False, "error": "Topic and available_time are required"}), 400

        logger.info(f"Generating roadmap with mood for topic: {topic}, category: {category}, emotion: {emotion}")
        
        # Assess knowledge level based on description
        assessed_skill_level, knowledge_assessment = assess_knowledge_level(user_description, skill_level)
        logger.info(f"Assessed skill level: {assessed_skill_level}")

        if youtube_url:
            video_id = extract_video_id(youtube_url)
            if video_id:
                transcript_content = get_transcript(video_id)
                if transcript_content:
                    logger.info(f"Transcript for video {video_id} extracted successfully.")
                else:
                    logger.warning(f"Could not get transcript for video {video_id}. Proceeding without it.")
        
        keywords = extract_keywords_from_topic(topic, transcript_content, user_description)
        logger.info(f"Keywords extracted: {keywords}")
        
        search_results, all_videos = search_youtube_keywords(keywords)
        logger.info(f"Found {len(all_videos)} videos")
        
        # Generate initial project
        project_data = generate_project_task(
            topic=topic,
            transcript_content=transcript_content,
            available_time=available_time,
            user_skill_level=assessed_skill_level,
            user_description=user_description,
            youtube_videos=all_videos,
            knowledge_assessment=knowledge_assessment,
            category=category,
            user_profile=user_profile
        )
        
        if not project_data:
            raise Exception("Failed to generate project data")
        
        # Adjust project based on emotion if provided
        if emotion and emotion_detector:
            logger.info(f"Adjusting project for emotion: {emotion}")
            project_data = emotion_detector.adjust_project_for_mood(project_data, emotion)
        
        logger.info("Roadmap generated successfully with mood consideration")
        
        # Find GitHub templates for software projects only
        github_templates = None
        hardware_suggestions = None
        software_tools = None
        
        if category == "software":
            logger.info("Finding GitHub templates for software project")
            github_templates = find_github_templates(topic, category, project_data.get('project_title', ''), project_data.get('project_overview', ''))
            # Extract software tools from project data
            if project_data.get('software_tools'):
                software_tools = project_data['software_tools']
                logger.info(f"Found structured software tools: {len(software_tools.get('tools', []))} tools")
        elif category == "other":
            logger.info("Processing other category project")
            # Extract tools from project data for other category
            if project_data.get('software_tools'):
                software_tools = project_data['software_tools']
                logger.info(f"Found structured other category tools: {len(software_tools.get('tools', []))} tools")
        elif category == "hardware":
            logger.info("Generating hardware suggestions for hardware project")
            hardware_suggestions = suggest_tools(
                topic, 
                category, 
                project_data.get('project_title', ''),
                project_data.get('project_overview', '')
            )
        
        response_data = {
            'success': True,
            'project_data': project_data,
            'keywords': keywords,
            'search_results': search_results,
            'videos': all_videos,
            'assessed_skill_level': assessed_skill_level,
            'knowledge_assessment': knowledge_assessment,
            'emotion_used': emotion
        }
        
        if github_templates:
            response_data['github_templates'] = github_templates
        if hardware_suggestions:
            response_data['hardware_suggestions'] = hardware_suggestions
        if software_tools:
            response_data['software_tools'] = software_tools
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error in generate_roadmap_with_mood API: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/emotion-detector-status', methods=['GET'])
def api_emotion_detector_status():
    """Check if emotion detector is available"""
    return jsonify({
        'success': True,
        'emotion_detector_available': emotion_detector is not None,
        'message': 'Emotion detector is ready' if emotion_detector else 'Emotion detector not available'
    })

@app.route('/api/detect-emotion-continuous', methods=['POST'])
def api_detect_emotion_continuous():
    """Detect emotion continuously and determine if popup should be shown"""
    try:
        if not emotion_detector:
            return jsonify({
                'success': False,
                'error': 'Emotion detector not available'
            }), 500
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # For continuous detection, we'll use a shorter duration and handle camera access better
        detection_duration = data.get('detection_duration', 1)  # Default 1 second
        
        try:
            # Capture emotion from camera with better error handling
            result = emotion_detector.capture_emotion_from_camera(detection_duration)
            
            if result['success'] and result['emotion']:
                emotion = result['emotion']
                confidence = result['confidence']
                
                # Define negative emotions that should trigger popup
                negative_emotions = ['Fear', 'Sad', 'Surprise', 'Angry']
                should_show_popup = emotion in negative_emotions and confidence > 0.4
                
                # Get mood adjustment message
                mood_adjustment = emotion_detector.get_mood_adjustment(emotion)
                
                logger.info(f"Continuous emotion detection: {emotion} (confidence: {confidence:.3f}, show_popup: {should_show_popup})")
                
                return jsonify({
                    'success': True,
                    'emotion': emotion,
                    'confidence': confidence,
                    'should_show_popup': should_show_popup,
                    'message': mood_adjustment['message'] if should_show_popup else None
                })
            else:
                # If detection failed, return a neutral response instead of error
                logger.warning(f"Emotion detection failed: {result.get('error', 'Unknown error')}")
                return jsonify({
                    'success': True,
                    'emotion': 'Neutral',
                    'confidence': 0.5,
                    'should_show_popup': False,
                    'message': None
                })
                
        except Exception as camera_error:
            logger.error(f"Camera access error: {str(camera_error)}")
            # Return neutral response instead of error to keep detection running
            return jsonify({
                'success': True,
                'emotion': 'Neutral',
                'confidence': 0.5,
                'should_show_popup': False,
                'message': None
            })
            
    except Exception as e:
        logger.error(f"Error in detect-emotion-continuous API: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/modify-project-for-mood', methods=['POST'])
def api_modify_project_for_mood():
    """Modify existing project based on detected emotion"""
    try:
        if not emotion_detector:
            return jsonify({
                'success': False,
                'error': 'Emotion detector not available'
            }), 500
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        current_project = data.get('current_project', {})
        emotion = data.get('emotion')
        action = data.get('action', 'modify')
        
        if not current_project:
            return jsonify({
                'success': False,
                'error': 'Current project data is required'
            }), 400
        
        if not emotion:
            return jsonify({
                'success': False,
                'error': 'Emotion is required'
            }), 400
        
        logger.info(f"Modifying project for emotion: {emotion}, action: {action}")
        
        # Get mood adjustment
        mood_adjustment = emotion_detector.get_mood_adjustment(emotion)
        
        # Create modified project data
        modified_project = current_project.copy()
        
        # Apply modifications based on emotion and action
        if action == 'modify':
            # Modify the current project
            if emotion == 'Fear':
                # Make project more guided and step-by-step
                modified_project['project_title'] = f"Step-by-Step: {current_project.get('title', 'DIY Project')}"
                modified_project['project_overview'] = f"This project has been modified to include detailed step-by-step guidance to help you succeed. {current_project.get('projectOverview', '')}"
                
            elif emotion == 'Sad':
                # Make project more fun and engaging
                modified_project['project_title'] = f"Fun & Engaging: {current_project.get('title', 'DIY Project')}"
                modified_project['project_overview'] = f"This project has been modified to be more fun and engaging while you learn. {current_project.get('projectOverview', '')}"
                
            elif emotion == 'Surprise':
                # Make project more exciting
                modified_project['project_title'] = f"Exciting: {current_project.get('title', 'DIY Project')}"
                modified_project['project_overview'] = f"This project has been modified to be more exciting and keep you engaged. {current_project.get('projectOverview', '')}"
                
            elif emotion == 'Angry':
                # Make project simpler and less frustrating
                modified_project['project_title'] = f"Simplified: {current_project.get('title', 'DIY Project')}"
                modified_project['project_overview'] = f"This project has been simplified to reduce complexity and frustration. {current_project.get('projectOverview', '')}"
        
        # Add mood information
        modified_project['mood_detected'] = emotion
        modified_project['mood_adjustment'] = mood_adjustment
        modified_project['adjustment_message'] = mood_adjustment['message']
        
        return jsonify({
            'success': True,
            'project_data': modified_project,
            'emotion': emotion,
            'mood_adjustment': mood_adjustment,
            'message': f'Project modified based on your {emotion.lower()} mood'
        })
        
    except Exception as e:
        logger.error(f"Error in modify-project-for-mood API: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 4009))  # Use PORT env var or default to 4009
    print(f"[ROCKET] AI DIY Service starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)