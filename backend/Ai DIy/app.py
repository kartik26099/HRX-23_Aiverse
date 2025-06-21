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

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration - Use environment variables for security
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', "AIzaSyBtv_7aN0kuhxUt4R3aK9X6g53SXe2gQAE")
SCRAPINGDOG_API_KEY = os.getenv('SCRAPINGDOG_API_KEY', "6810d07d05e7d91c4e5ed577")

# Configure Gemini AI
try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
    logger.info("Gemini AI configured successfully")
except Exception as e:
    logger.error(f"Failed to configure Gemini AI: {str(e)}")
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
        logger.error(f"Error getting transcript: {str(e)}")
        return f"Error getting transcript: {str(e)}"

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
            return ["Sample dataset for practice"]
            
        prompt = f"""
        Recommend 3-5 popular datasets for a {skill_level} level {topic} project.
        Focus on well-known, accessible datasets that are good for learning.
        
        Return only the dataset names, one per line, nothing else.
        """
        
        response = model.generate_content(prompt)
        datasets = [line.strip() for line in response.text.strip().split('\n') if line.strip()]
        return datasets[:5]
        
    except Exception as e:
        logger.error(f"Error getting dataset recommendations: {str(e)}")
        return ["Sample dataset for practice"]

def generate_project_task(topic, transcript_content, available_time, user_skill_level="beginner", 
                         user_description="", youtube_videos=None, knowledge_assessment=""):
    """Generate a complete project task with roadmap"""
    try:
        if not model:
            return create_fallback_project(topic, available_time, user_skill_level, user_description, youtube_videos)
        
        is_ml = is_ml_related_topic(topic, user_description)
        
        # Create a comprehensive prompt for project generation
        prompt = f"""
        Create a detailed DIY project roadmap for: {topic}
        
        User Profile:
        - Skill Level: {user_skill_level}
        - Available Time: {available_time}
        - Description: {user_description}
        - Knowledge Assessment: {knowledge_assessment}
        
        Content Context: {transcript_content[:1000] if transcript_content else "No reference content"}
        
        Generate a comprehensive project plan with the following structure:
        
        PROJECT TITLE: [Creative project title]
        ESTIMATED TIME: [Time estimate]
        DIFFICULTY LEVEL: [beginner/intermediate/advanced]
        KNOWLEDGE ASSESSMENT: [Brief assessment based on user description]
        
        PREREQUISITES:
        - [List 3-5 prerequisites]
        
        TOOLS AND MATERIALS:
        - [List 5-8 tools and materials needed]
        
        LEARNING OBJECTIVES:
        - [List 4-6 learning objectives]
        
        PROJECT ROADMAP:
        PHASE 1: Setup and Planning ({int(available_time.split()[0])//4 if available_time.split()[0].isdigit() else '30'} minutes)
        - [List 3-4 setup tasks]
        {"- Download and explore recommended datasets" if is_ml else ""}
        
        PHASE 2: Learning ({int(available_time.split()[0])//3 if available_time.split()[0].isdigit() else '45'} minutes)
        - [List 3-4 learning tasks]
        
        PHASE 3: Implementation ({int(available_time.split()[0])//2 if available_time.split()[0].isdigit() else '60'} minutes)
        - [List 4-5 implementation tasks]
        {"- Train and evaluate models" if is_ml else ""}
        
        PHASE 4: Testing & Review (Remaining time)
        - [List 3-4 testing and review tasks]
        
        COMMON PITFALLS & TROUBLESHOOTING:
        [List 4-5 common issues and solutions]
        
        SUCCESS CRITERIA:
        [List 4-5 success criteria]
        
        NEXT STEPS & EXTENSIONS:
        [List 4-5 next steps for further development]
        """
        
        response = model.generate_content(prompt)
        project_text = response.text.strip()
        
        # Parse the project text into structured data
        project_data = parse_project_text(project_text)
        
        # Add additional metadata
        project_data.update({
            'project_title': project_data.get('project_title', f"DIY Project: {topic}"),
            'estimated_time': project_data.get('estimated_time', available_time),
            'difficulty_level': project_data.get('difficulty_level', user_skill_level),
            'knowledge_assessment': project_data.get('knowledge_assessment', knowledge_assessment),
            'prerequisites': project_data.get('prerequisites', ''),
            'tools_and_materials': project_data.get('tools_and_materials', ''),
            'learning_objectives': project_data.get('learning_objectives', ''),
            'project_roadmap': project_data.get('project_roadmap', ''),
            'common_pitfalls_and_troubleshooting': project_data.get('common_pitfalls_and_troubleshooting', ''),
            'success_criteria': project_data.get('success_criteria', ''),
            'next_steps_and_extensions': project_data.get('next_steps_and_extensions', ''),
            'is_ml_project': is_ml
        })
        
        if youtube_videos:
            project_data['source_videos'] = youtube_videos
            
        if is_ml:
            project_data['datasets'] = get_dataset_recommendations(topic, user_skill_level)
            project_data['is_ml_project'] = True
        
        return project_data
        
    except Exception as e:
        logger.error(f"Error generating project task: {str(e)}")
        return create_fallback_project(topic, available_time, user_skill_level, user_description, youtube_videos)

def create_fallback_project(topic, available_time, user_skill_level, user_description="", youtube_videos=None):
    """Create a fallback project when AI generation fails"""
    is_ml = is_ml_related_topic(topic, user_description)
    
    return {
        'project_title': f"DIY Project: {topic}",
        'estimated_time': available_time,
        'difficulty_level': user_skill_level,
        'knowledge_assessment': "Basic assessment available",
        'prerequisites': f"- Basic understanding of {topic}\n- Computer with internet access\n- Text editor or IDE",
        'tools_and_materials': f"- Computer\n- Text editor/IDE\n- Internet connection\n- Documentation resources",
        'learning_objectives': f"- Understand {topic} fundamentals\n- Build a working project\n- Learn best practices\n- Document your work",
        'project_roadmap': f"""
PHASE 1: Setup and Planning (30 minutes)
- Set up development environment
- Research project requirements
- Create project structure

PHASE 2: Learning (45 minutes)
- Study relevant tutorials
- Practice basic concepts
- Take notes on key points

PHASE 3: Implementation (60 minutes)
- Build the core project
- Implement main features
- Test basic functionality

PHASE 4: Testing & Review (Remaining time)
- Test all features
- Fix any issues
- Document your work
""",
        'common_pitfalls_and_troubleshooting': f"- Don't rush through the basics\n- Take breaks when stuck\n- Ask for help when needed\n- Document your learning process",
        'success_criteria': f"- Completed basic {topic} project\n- Understanding of core concepts\n- Documented learning outcomes\n- Identified areas for further study",
        'next_steps_and_extensions': f"- Explore advanced {topic} topics\n- Build more complex projects\n- Join {topic} communities\n- Consider formal courses or certifications",
        'is_ml_project': is_ml
    }

def parse_project_text(project_text):
    """Parse the generated project text into structured data"""
    try:
        sections = {}
        current_section = None
        current_content = []
        
        lines = project_text.split('\n')
        
        section_markers = [
            'PROJECT TITLE:', 'ESTIMATED TIME:', 'DIFFICULTY LEVEL:', 'KNOWLEDGE ASSESSMENT:',
            'PREREQUISITES:', 'TOOLS AND MATERIALS:', 'LEARNING OBJECTIVES:', 'PROJECT ROADMAP:',
            'COMMON PITFALLS & TROUBLESHOOTING:', 'SUCCESS CRITERIA:', 'NEXT STEPS & EXTENSIONS:',
            'DATASET RESOURCES:', 'ADDITIONAL RESOURCES:'
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
                        sections[current_section] = '\n'.join(current_content)
                    
                    # Start new section
                    current_section = marker.lower().replace(' & ', '_').replace(' ', '_').replace(':', '')
                    current_content = [line.split(':', 1)[1].strip() if ':' in line else '']
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
            sections[current_section] = '\n'.join(current_content)
        
        return sections
        
    except Exception as e:
        logger.error(f"Error parsing project text: {str(e)}")
        return {'raw_text': project_text}

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
        data = request.get_json()
        topic = data.get('topic', '')
        available_time = data.get('available_time', '2 hours')
        skill_level = data.get('skill_level', 'beginner')
        user_description = data.get('user_description', '')
        youtube_url = data.get('youtube_url', '')
        
        logger.info(f"Generating roadmap for topic: {topic}")
        logger.info(f"User description: {user_description[:100]}...")
        
        # Assess knowledge level based on description
        assessed_level, knowledge_assessment = assess_knowledge_level(user_description, skill_level)
        logger.info(f"Assessed skill level: {assessed_level}")
        
        transcript_content = "No transcript available"
        if youtube_url:
            video_id = extract_video_id(youtube_url)
            if video_id:
                transcript_content = get_transcript(video_id)
                logger.info("Transcript extracted successfully")
        
        keywords = extract_keywords_from_topic(topic, transcript_content, user_description)
        logger.info(f"Keywords extracted: {keywords}")
        
        search_results, all_videos = search_youtube_keywords(keywords)
        logger.info(f"Found {len(all_videos)} videos")
        
        project_data = generate_project_task(
            topic=topic,
            transcript_content=transcript_content,
            available_time=available_time,
            user_skill_level=assessed_level,
            user_description=user_description,
            youtube_videos=all_videos,
            knowledge_assessment=knowledge_assessment
        )
        
        if not project_data:
            raise Exception("Failed to generate project data")
        
        logger.info("Roadmap generated successfully")
        
        return jsonify({
            'success': True,
            'project_data': project_data,
            'keywords': keywords,
            'search_results': search_results,
            'videos': all_videos,
            'assessed_skill_level': assessed_level,
            'knowledge_assessment': knowledge_assessment
        })
        
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
        'description': 'Backend API for generating AI-powered project roadmaps',
        'endpoints': {
            'POST /api/generate-roadmap': 'Generate project roadmap',
            'POST /api/extract-video-id': 'Extract YouTube video ID',
            'POST /api/get-transcript': 'Get YouTube video transcript',
            'POST /api/available-languages': 'Get available transcript languages',
            'GET /health': 'Health check',
            'GET /': 'API information'
        },
        'frontend_integration': 'This API is designed to work with the Next.js DIY Generator frontend component'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)