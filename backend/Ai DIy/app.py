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
CORS(app, origins=[
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",  # Keep for backward compatibility
    "http://127.0.0.1:3000"   # Keep for backward compatibility
])

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
            logger.warning("No AI model available, using fallback project")
            return create_fallback_project(topic, available_time, user_skill_level, user_description, youtube_videos)
        
        is_ml = is_ml_related_topic(topic, user_description)
        
        # Distribute videos across phases
        phase_videos = distribute_videos_to_phases(youtube_videos, topic, user_skill_level) if youtube_videos else {}
        
        # Create a comprehensive prompt for project generation
        prompt = f"""
You are an AI-powered DIY project mentor. Your task is to generate a personalized and engaging project idea and their roadmap for a learner based on their background, available time, and content they've recently learned. The goal is to help them build confidence through hands-on application by suggesting a creative, domain-specific project.

INPUT TOPIC: {topic}

USER PROFILE:
- Skill Level: {user_skill_level}
- Available Time: {available_time}
- Learner Description: {user_description}
- Knowledge Assessment: {knowledge_assessment}

CONTENT CONTEXT:
{transcript_content[:1000] if transcript_content else "No reference content provided"}

YOUR TASK:
Generate a personalized DIY project roadmap that fits the learner's profile. The roadmap should:
- Suggest a project in a relevant domain (e.g. coding, hardware, design, research)
- Match the learner's skill level and available time
- Scaffold learning with intelligent guidance and hints
- Build on the learner's recent knowledge or lecture content
- Encourage curiosity and practical creativity

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
- [List 5-8 specific tools, libraries, software, or hardware items needed]
- [Include exact names of software, libraries, or tools]
- [Specify versions if relevant]
- [Include both free and paid options if applicable]
- [Mention any physical materials for hardware projects]

LEARNING OBJECTIVES:
- [List 4-6 core skills or concepts the learner will gain]

PROJECT ROADMAP:

PHASE 1: Setup & Planning ({int(available_time.split()[0])//4 if available_time.split()[0].isdigit() else '30'} minutes)
- [3-4 setup tasks: research, install tools, define project scope, etc.]
{"- Explore relevant datasets or APIs" if is_ml else ""}

PHASE 2: Learning & Exploration ({int(available_time.split()[0])//3 if available_time.split()[0].isdigit() else '45'} minutes)
- [3-4 learning tasks: review examples, study methods, test snippets]

PHASE 3: Implementation & Build ({int(available_time.split()[0])//2 if available_time.split()[0].isdigit() else '60'} minutes)
- [4-5 implementation tasks: write code, build prototypes, design UI]
{"- Train and evaluate ML models" if is_ml else ""}

PHASE 4: Testing, Debugging & Reflection (Remaining time)
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
            'domain': project_data.get('domain', ''),
            'project_overview': project_data.get('project_overview', ''),
            'prerequisites': project_data.get('prerequisites', ''),
            'tools_and_materials': project_data.get('tools_and_materials', ''),
            'learning_objectives': project_data.get('learning_objectives', ''),
            'project_roadmap': project_data.get('project_roadmap', ''),
            'templates_hints': project_data.get('templates_hints', ''),
            'common_pitfalls_and_troubleshooting': project_data.get('common_pitfalls_and_troubleshooting', ''),
            'success_criteria': project_data.get('success_criteria', ''),
            'next_steps_and_extensions': project_data.get('next_steps_and_extensions', ''),
            'is_ml_project': is_ml,
            'phase_videos': phase_videos
        })
        
        # Debug logging
        logger.info(f"Generated tools_and_materials: {project_data.get('tools_and_materials', 'EMPTY')}")
        logger.info(f"Raw project text length: {len(project_text)}")
        logger.info(f"Parsed sections: {list(project_data.keys())}")
        
        # Ensure we have tools and materials, if not, use fallback
        if not project_data.get('tools_and_materials', '').strip():
            logger.warning("No tools and materials generated by AI, using fallback")
            fallback_project = create_fallback_project(topic, available_time, user_skill_level, user_description, youtube_videos)
            project_data['tools_and_materials'] = fallback_project.get('tools_and_materials', '')
        
        if youtube_videos:
            project_data['source_videos'] = youtube_videos
            
        if is_ml:
            project_data['datasets'] = get_dataset_recommendations(topic, user_skill_level)
            project_data['is_ml_project'] = True
        
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
    
    # Determine project type and set appropriate tools
    topic_lower = topic.lower()
    if 'app' in topic_lower or 'website' in topic_lower or 'web' in topic_lower:
        tools_materials = [
            "Computer with internet access",
            "Text editor (VS Code, Sublime Text, or Atom)",
            "Web browser (Chrome, Firefox, or Safari)",
            "Git for version control",
            "Node.js and npm (for JavaScript projects)",
            "Python 3.x (for Python projects)",
            "Documentation resources (MDN, W3Schools)"
        ]
    elif 'ml' in topic_lower or 'machine learning' in topic_lower or 'ai' in topic_lower:
        tools_materials = [
            "Computer with Python 3.7+ installed",
            "Jupyter Notebook or Google Colab",
            "Python libraries: pandas, numpy, scikit-learn",
            "Matplotlib or Plotly for visualization",
            "Sample datasets (Kaggle, UCI ML Repository)",
            "Text editor or IDE (PyCharm, VS Code)",
            "Git for version control"
        ]
    elif 'game' in topic_lower or 'mobile' in topic_lower:
        tools_materials = [
            "Computer with development environment",
            "Game engine (Unity, Godot, or Construct)",
            "Graphics software (GIMP, Photoshop, or Canva)",
            "Audio editing software (Audacity)",
            "Mobile device for testing (optional)",
            "Version control system (Git)",
            "Documentation and tutorials"
        ]
    else:
        tools_materials = [
            "Computer with internet access",
            "Text editor or IDE appropriate for the project",
            "Relevant programming language and tools",
            "Documentation and learning resources",
            "Version control system (Git)",
            "Testing environment",
            "Project management tools (optional)"
        ]
    
    return {
        'project_title': f"DIY Project: {topic}",
        'estimated_time': available_time,
        'difficulty_level': user_skill_level,
        'knowledge_assessment': "Basic assessment available",
        'domain': 'Coding' if 'app' in topic.lower() or 'website' in topic.lower() else 'General',
        'project_overview': f"This {topic} project is designed to help you learn the fundamentals while building something practical and useful. You'll gain hands-on experience with real-world applications and develop skills that are valuable in today's technology landscape. This project is perfect for {user_skill_level}s who want to understand {topic} concepts through practical application. By the end, you'll have a working project that demonstrates your understanding and can serve as a portfolio piece or foundation for more advanced work.",
        'prerequisites': f"- Basic understanding of {topic}\n- Computer with internet access\n- Text editor or IDE",
        'tools_and_materials': '\n'.join([f"- {tool}" for tool in tools_materials]),
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
        'templates_hints': f"- Start with a simple structure\n- Use online tutorials as reference\n- Break down complex tasks into smaller steps\n- Don't hesitate to ask for help",
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
                        sections[current_section] = '\n'.join(current_content)
                        logger.info(f"Saved section '{current_section}' with {len(current_content)} lines")
                    
                    # Start new section
                    current_section = marker.lower().replace(' & ', '_').replace(' ', '_').replace(':', '')
                    # Get content after the colon if it exists
                    content_after_colon = line.split(':', 1)[1].strip() if ':' in line else ''
                    current_content = [content_after_colon] if content_after_colon else []
                    logger.info(f"Started new section '{current_section}' with content: '{content_after_colon}'")
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
        user_description = data.get('user_description', '')
        youtube_url = data.get('youtube_url', '')
        transcript_content = ""

        if not topic or not available_time:
            return jsonify({"success": False, "error": "Topic and available_time are required"}), 400

        logger.info(f"Generating roadmap for topic: {topic}")
        logger.info(f"User description: {user_description[:50]}...")
        
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
            'assessed_skill_level': assessed_skill_level,
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

@app.route('/api/generate-excalidraw', methods=['POST'])
def api_generate_excalidraw():
    """Generate Excalidraw diagram for a project"""
    try:
        data = request.get_json()
        
        if not data or 'project_data' not in data:
            return jsonify({
                'success': False,
                'error': 'Project data is required'
            }), 400
        
        project_data = data['project_data']
        
        # Generate the diagram
        diagram_data = generate_excalidraw_diagram(project_data)
        
        if not diagram_data:
            return jsonify({
                'success': False,
                'error': 'Failed to generate diagram'
            }), 500
        
        return jsonify({
            'success': True,
            'diagram_data': diagram_data
        })
        
    except Exception as e:
        logger.error(f"Error in generate-excalidraw endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

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
        'description': 'Backend API for generating AI-powered project roadmaps',
        'endpoints': {
            'POST /api/generate-roadmap': 'Generate project roadmap',
            'POST /api/extract-video-id': 'Extract YouTube video ID',
            'POST /api/get-transcript': 'Get YouTube video transcript',
            'POST /api/available-languages': 'Get available transcript languages',
            'POST /api/generate-excalidraw': 'Generate Excalidraw diagram',
            'GET /health': 'Health check',
            'GET /': 'API information'
        },
        'frontend_integration': 'This API is designed to work with the Next.js DIY Generator frontend component'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)