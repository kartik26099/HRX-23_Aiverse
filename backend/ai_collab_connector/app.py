from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import time
import os
import logging
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv
import google.generativeai as genai
from typing import List, Dict, Any, Optional
import sqlite3
from dataclasses import dataclass, asdict
import hashlib

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
])

# Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', "AIzaSyCqHlRThnjAFm69qzPk7b1uhecSFatSdU0")
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', "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")

# Configure Gemini AI
try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
    logger.info("Gemini AI configured successfully")
except Exception as e:
    logger.error(f"Failed to configure Gemini AI: {str(e)}")
    model = None

# Database setup
DB_PATH = "collab_connector.db"

def init_db():
    """Initialize the database with required tables"""
    conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
    cursor = conn.cursor()
    
    # User profiles table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_profiles (
            id TEXT PRIMARY KEY,
            clerk_id TEXT UNIQUE,
            username TEXT,
            email TEXT,
            skills TEXT,  -- JSON string
            interests TEXT,  -- JSON string
            experience_level TEXT,
            availability TEXT,  -- JSON string
            timezone TEXT,
            preferred_domains TEXT,  -- JSON string
            working_style TEXT,
            completed_projects TEXT,  -- JSON string
            personality_traits TEXT,  -- JSON string
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Collaboration requests table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS collab_requests (
            id TEXT PRIMARY KEY,
            requester_id TEXT,
            project_title TEXT,
            project_description TEXT,
            required_skills TEXT,  -- JSON string
            preferred_domains TEXT,  -- JSON string
            estimated_duration TEXT,
            team_size INTEGER,
            status TEXT DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (requester_id) REFERENCES user_profiles (id)
        )
    ''')
    
    # Teams table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS teams (
            id TEXT PRIMARY KEY,
            name TEXT,
            project_id TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Team members table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS team_members (
            id TEXT PRIMARY KEY,
            team_id TEXT,
            user_id TEXT,
            role TEXT,
            assigned_tasks TEXT,  -- JSON string
            status TEXT DEFAULT 'active',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams (id),
            FOREIGN KEY (user_id) REFERENCES user_profiles (id)
        )
    ''')
    
    # Tasks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            team_id TEXT,
            title TEXT,
            description TEXT,
            assigned_to TEXT,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'medium',
            estimated_hours INTEGER,
            deadline TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams (id),
            FOREIGN KEY (assigned_to) REFERENCES user_profiles (id)
        )
    ''')
    
    # Chat messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            team_id TEXT,
            sender_id TEXT,
            message TEXT,
            message_type TEXT DEFAULT 'text',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams (id),
            FOREIGN KEY (sender_id) REFERENCES user_profiles (id)
        )
    ''')
    
    # Team achievements table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS team_achievements (
            id TEXT PRIMARY KEY,
            team_id TEXT,
            achievement_type TEXT,
            description TEXT,
            points INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

# Initialize database on startup
init_db()

@dataclass
class UserProfile:
    id: str
    clerk_id: str
    username: str
    email: str
    skills: List[str]
    interests: List[str]
    experience_level: str
    availability: Dict[str, Any]
    timezone: str
    preferred_domains: List[str]
    working_style: str
    completed_projects: List[Dict[str, Any]]
    personality_traits: List[str]

@dataclass
class CollabRequest:
    id: str
    requester_id: str
    project_title: str
    project_description: str
    required_skills: List[str]
    preferred_domains: List[str]
    estimated_duration: str
    team_size: int
    status: str

@dataclass
class Team:
    id: str
    name: str
    project_id: str
    status: str
    members: List[Dict[str, Any]]
    tasks: List[Dict[str, Any]]

def analyze_user_compatibility(user1: UserProfile, user2: UserProfile, project_requirements: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze compatibility between two users for a specific project"""
    try:
        if not model:
            return {"compatibility_score": 0.5, "reasoning": "AI model not available"}
        
        prompt = f"""
        Analyze the compatibility between two users for a collaborative project.
        
        USER 1:
        - Skills: {user1.skills}
        - Experience Level: {user1.experience_level}
        - Interests: {user1.interests}
        - Working Style: {user1.working_style}
        - Preferred Domains: {user1.preferred_domains}
        - Completed Projects: {len(user1.completed_projects)}
        
        USER 2:
        - Skills: {user2.skills}
        - Experience Level: {user2.experience_level}
        - Interests: {user2.interests}
        - Working Style: {user2.working_style}
        - Preferred Domains: {user2.preferred_domains}
        - Completed Projects: {len(user2.completed_projects)}
        
        PROJECT REQUIREMENTS:
        - Title: {project_requirements.get('title', 'N/A')}
        - Required Skills: {project_requirements.get('required_skills', [])}
        - Preferred Domains: {project_requirements.get('preferred_domains', [])}
        - Estimated Duration: {project_requirements.get('estimated_duration', 'N/A')}
        
        Analyze and provide:
        1. Compatibility Score (0-100)
        2. Skill Complementarity (how well their skills complement each other)
        3. Learning Potential (how much they can learn from each other)
        4. Potential Challenges
        5. Recommended Team Roles
        6. Overall Assessment
        
        Return as JSON with these fields:
        - compatibility_score: number (0-100)
        - skill_complementarity: string
        - learning_potential: string
        - challenges: array of strings
        - recommended_roles: object with user1_role and user2_role
        - assessment: string
        """
        
        response = model.generate_content(prompt)
        analysis_text = response.text.strip()
        
        # Try to parse JSON from the response
        try:
            if '```json' in analysis_text:
                analysis_text = analysis_text.split('```json')[1].split('```')[0]
            elif '```' in analysis_text:
                analysis_text = analysis_text.split('```')[1]
            
            analysis = json.loads(analysis_text)
            return analysis
        except json.JSONDecodeError:
            # Fallback analysis
            return {
                "compatibility_score": 70,
                "skill_complementarity": "Skills appear complementary",
                "learning_potential": "Good learning potential",
                "challenges": ["Communication differences"],
                "recommended_roles": {
                    "user1_role": "Primary developer",
                    "user2_role": "Support developer"
                },
                "assessment": "Promising collaboration potential"
            }
            
    except Exception as e:
        logger.error(f"Error analyzing user compatibility: {str(e)}")
        return {"compatibility_score": 50, "reasoning": f"Analysis failed: {str(e)}"}

def find_optimal_teammates(requester_profile: UserProfile, project_requirements: Dict[str, Any], available_users: List[UserProfile]) -> List[Dict[str, Any]]:
    """Find optimal teammates for a project"""
    try:
        if not model:
            return []
        
        # Analyze compatibility with each available user
        compatibility_results = []
        
        for user in available_users:
            if user.id != requester_profile.id:  # Don't match with self
                compatibility = analyze_user_compatibility(requester_profile, user, project_requirements)
                compatibility_results.append({
                    "user": user,
                    "compatibility": compatibility
                })
        
        # Sort by compatibility score
        compatibility_results.sort(key=lambda x: x["compatibility"]["compatibility_score"], reverse=True)
        
        # Return top matches
        return compatibility_results[:5]  # Return top 5 matches
        
    except Exception as e:
        logger.error(f"Error finding optimal teammates: {str(e)}")
        return []

def generate_task_distribution(team_members: List[UserProfile], project_requirements: Dict[str, Any]) -> Dict[str, Any]:
    """Generate optimal task distribution for team members"""
    try:
        if not model:
            return {"tasks": [], "reasoning": "AI model not available"}
        
        prompt = f"""
        Generate an optimal task distribution for a collaborative project team.
        
        PROJECT:
        - Title: {project_requirements.get('title', 'N/A')}
        - Description: {project_requirements.get('description', 'N/A')}
        - Required Skills: {project_requirements.get('required_skills', [])}
        - Estimated Duration: {project_requirements.get('estimated_duration', 'N/A')}
        
        TEAM MEMBERS:
        {chr(10).join([f"Member {i+1}: {member.username} - Skills: {member.skills}, Experience: {member.experience_level}" for i, member in enumerate(team_members)])}
        
        Generate:
        1. Task breakdown with clear responsibilities
        2. Timeline for each task
        3. Dependencies between tasks
        4. Integration checkpoints
        5. Success criteria for each task
        
        Return as JSON with:
        - tasks: array of task objects with title, description, assigned_to, estimated_hours, dependencies
        - timeline: overall project timeline
        - checkpoints: integration checkpoints
        - success_criteria: criteria for project completion
        """
        
        response = model.generate_content(prompt)
        task_text = response.text.strip()
        
        try:
            if '```json' in task_text:
                task_text = task_text.split('```json')[1].split('```')[0]
            elif '```' in task_text:
                task_text = task_text.split('```')[1]
            
            task_distribution = json.loads(task_text)
            return task_distribution
        except json.JSONDecodeError:
            # Fallback task distribution
            return {
                "tasks": [
                    {
                        "title": "Project Setup",
                        "description": "Initialize project structure and environment",
                        "assigned_to": team_members[0].username if team_members else "TBD",
                        "estimated_hours": 2,
                        "dependencies": []
                    }
                ],
                "timeline": "2-4 weeks",
                "checkpoints": ["Week 1: Setup", "Week 2: Development", "Week 3: Testing", "Week 4: Deployment"],
                "success_criteria": "Project completed and deployed"
            }
            
    except Exception as e:
        logger.error(f"Error generating task distribution: {str(e)}")
        return {"tasks": [], "reasoning": f"Task generation failed: {str(e)}"}

def calculate_team_xp(team_members: List[UserProfile], project_complexity: str) -> Dict[str, int]:
    """Calculate XP rewards for team members"""
    base_xp = {
        "beginner": 100,
        "intermediate": 150,
        "advanced": 200
    }
    
    complexity_multiplier = {
        "simple": 1.0,
        "medium": 1.5,
        "complex": 2.0
    }
    
    team_xp = {}
    for member in team_members:
        member_xp = base_xp.get(member.experience_level, 100)
        adjusted_xp = int(member_xp * complexity_multiplier.get(project_complexity, 1.0))
        team_xp[member.id] = adjusted_xp
    
    return team_xp

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "AI Collab Connector",
        "timestamp": time.time(),
        "gemini_available": model is not None
    })

@app.route('/api/create-profile', methods=['POST'])
def create_user_profile():
    """Create or update user profile"""
    try:
        data = request.json
        logger.info(f"[PROFILE CREATE] Incoming data: {data}")
        user_id = str(uuid.uuid4())
        profile = UserProfile(
            id=user_id,
            clerk_id=data.get('clerk_id'),
            username=data.get('username'),
            email=data.get('email'),
            skills=data.get('skills', []),
            interests=data.get('interests', []),
            experience_level=data.get('experience_level', 'beginner'),
            availability=data.get('availability', {}),
            timezone=data.get('timezone', 'UTC'),
            preferred_domains=data.get('preferred_domains', []),
            working_style=data.get('working_style', 'balanced'),
            completed_projects=data.get('completed_projects', []),
            personality_traits=data.get('personality_traits', [])
        )
        # Save to database
        conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO user_profiles 
            (id, clerk_id, username, email, skills, interests, experience_level, 
             availability, timezone, preferred_domains, working_style, 
             completed_projects, personality_traits, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ''', (
            profile.id, profile.clerk_id, profile.username, profile.email,
            json.dumps(profile.skills), json.dumps(profile.interests),
            profile.experience_level, json.dumps(profile.availability),
            profile.timezone, json.dumps(profile.preferred_domains),
            profile.working_style, json.dumps(profile.completed_projects),
            json.dumps(profile.personality_traits)
        ))
        conn.commit()
        conn.close()
        logger.info(f"[PROFILE CREATE] Success for clerk_id={profile.clerk_id}, id={profile.id}")
        return jsonify({
            "success": True,
            "profile_id": user_id,
            "message": "Profile created successfully"
        })
    except Exception as e:
        logger.error(f"[PROFILE CREATE] Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/find-collaborators', methods=['POST'])
def find_collaborators():
    """Find optimal collaborators for a project"""
    try:
        data = request.json
        requester_id = data.get('requester_id')
        project_requirements = data.get('project_requirements', {})
        
        # Get requester profile
        conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM user_profiles WHERE id = ?', (requester_id,))
        requester_data = cursor.fetchone()
        
        if not requester_data:
            return jsonify({
                "success": False,
                "error": "Requester profile not found"
            }), 404
        
        # Get all available users
        cursor.execute('SELECT * FROM user_profiles WHERE id != ?', (requester_id,))
        available_users_data = cursor.fetchall()
        
        conn.close()
        
        # Convert to UserProfile objects
        requester_profile = UserProfile(
            id=requester_data[0],
            clerk_id=requester_data[1],
            username=requester_data[2],
            email=requester_data[3],
            skills=json.loads(requester_data[4]),
            interests=json.loads(requester_data[5]),
            experience_level=requester_data[6],
            availability=json.loads(requester_data[7]),
            timezone=requester_data[8],
            preferred_domains=json.loads(requester_data[9]),
            working_style=requester_data[10],
            completed_projects=json.loads(requester_data[11]),
            personality_traits=json.loads(requester_data[12])
        )
        
        available_users = []
        for user_data in available_users_data:
            user_profile = UserProfile(
                id=user_data[0],
                clerk_id=user_data[1],
                username=user_data[2],
                email=user_data[3],
                skills=json.loads(user_data[4]),
                interests=json.loads(user_data[5]),
                experience_level=user_data[6],
                availability=json.loads(user_data[7]),
                timezone=user_data[8],
                preferred_domains=json.loads(user_data[9]),
                working_style=user_data[10],
                completed_projects=json.loads(user_data[11]),
                personality_traits=json.loads(user_data[12])
            )
            available_users.append(user_profile)
        
        # Find optimal teammates
        matches = find_optimal_teammates(requester_profile, project_requirements, available_users)
        
        # Format response
        formatted_matches = []
        for match in matches:
            user = match["user"]
            compatibility = match["compatibility"]
            
            formatted_matches.append({
                "user_id": user.id,
                "username": user.username,
                "skills": user.skills,
                "experience_level": user.experience_level,
                "interests": user.interests,
                "compatibility_score": compatibility.get("compatibility_score", 0),
                "skill_complementarity": compatibility.get("skill_complementarity", ""),
                "learning_potential": compatibility.get("learning_potential", ""),
                "recommended_role": compatibility.get("recommended_roles", {}).get("user2_role", ""),
                "challenges": compatibility.get("challenges", [])
            })
        
        return jsonify({
            "success": True,
            "matches": formatted_matches,
            "total_matches": len(formatted_matches)
        })
        
    except Exception as e:
        logger.error(f"Error finding collaborators: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/create-team', methods=['POST'])
def create_team():
    """Create a new team with selected collaborators"""
    try:
        data = request.json
        team_id = str(uuid.uuid4())
        
        # Create team
        conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO teams (id, name, project_id, status)
            VALUES (?, ?, ?, ?)
        ''', (team_id, data.get('team_name'), data.get('project_id'), 'active'))
        
        # Add team members
        members = data.get('members', [])
        for member in members:
            member_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO team_members (id, team_id, user_id, role, assigned_tasks)
                VALUES (?, ?, ?, ?, ?)
            ''', (member_id, team_id, member['user_id'], member.get('role', 'member'), json.dumps([])))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "team_id": team_id,
            "message": "Team created successfully"
        })
        
    except Exception as e:
        logger.error(f"Error creating team: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/generate-tasks', methods=['POST'])
def generate_tasks():
    """Generate task distribution for a team"""
    try:
        data = request.json
        team_id = data.get('team_id')
        project_requirements = data.get('project_requirements', {})
        
        # Get team members
        conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.* FROM user_profiles u
            JOIN team_members tm ON u.id = tm.user_id
            WHERE tm.team_id = ?
        ''', (team_id,))
        
        team_members_data = cursor.fetchall()
        conn.close()
        
        # Convert to UserProfile objects
        team_members = []
        for member_data in team_members_data:
            user_profile = UserProfile(
                id=member_data[0],
                clerk_id=member_data[1],
                username=member_data[2],
                email=member_data[3],
                skills=json.loads(member_data[4]),
                interests=json.loads(member_data[5]),
                experience_level=member_data[6],
                availability=json.loads(member_data[7]),
                timezone=member_data[8],
                preferred_domains=json.loads(member_data[9]),
                working_style=member_data[10],
                completed_projects=json.loads(member_data[11]),
                personality_traits=json.loads(member_data[12])
            )
            team_members.append(user_profile)
        
        # Generate task distribution
        task_distribution = generate_task_distribution(team_members, project_requirements)
        
        # Save tasks to database
        conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
        cursor = conn.cursor()
        
        for task in task_distribution.get('tasks', []):
            task_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO tasks (id, team_id, title, description, assigned_to, 
                                 estimated_hours, priority, deadline)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                task_id, team_id, task.get('title'), task.get('description'),
                task.get('assigned_to'), task.get('estimated_hours', 1),
                task.get('priority', 'medium'),
                datetime.now() + timedelta(days=7)
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "task_distribution": task_distribution,
            "message": "Tasks generated successfully"
        })
        
    except Exception as e:
        logger.error(f"Error generating tasks: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/team/<team_id>/tasks', methods=['GET'])
def get_team_tasks(team_id):
    """Get all tasks for a team"""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT t.*, u.username as assigned_username 
            FROM tasks t
            LEFT JOIN user_profiles u ON t.assigned_to = u.id
            WHERE t.team_id = ?
            ORDER BY t.priority DESC, t.created_at ASC
        ''', (team_id,))
        
        tasks_data = cursor.fetchall()
        conn.close()
        
        tasks = []
        for task_data in tasks_data:
            task = {
                "id": task_data[0],
                "title": task_data[2],
                "description": task_data[3],
                "assigned_to": task_data[4],
                "assigned_username": task_data[11],
                "status": task_data[5],
                "priority": task_data[6],
                "estimated_hours": task_data[7],
                "deadline": task_data[8],
                "created_at": task_data[9]
            }
            tasks.append(task)
        
        return jsonify({
            "success": True,
            "tasks": tasks
        })
        
    except Exception as e:
        logger.error(f"Error getting team tasks: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/team/<team_id>/chat', methods=['GET'])
def get_team_chat(team_id):
    """Get chat messages for a team"""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT cm.*, u.username as sender_username
            FROM chat_messages cm
            JOIN user_profiles u ON cm.sender_id = u.id
            WHERE cm.team_id = ?
            ORDER BY cm.created_at ASC
        ''', (team_id,))
        
        messages_data = cursor.fetchall()
        conn.close()
        
        messages = []
        for msg_data in messages_data:
            message = {
                "id": msg_data[0],
                "sender_id": msg_data[2],
                "sender_username": msg_data[6],
                "message": msg_data[3],
                "message_type": msg_data[4],
                "created_at": msg_data[5]
            }
            messages.append(message)
        
        return jsonify({
            "success": True,
            "messages": messages
        })
        
    except Exception as e:
        logger.error(f"Error getting team chat: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/team/<team_id>/chat', methods=['POST'])
def send_chat_message(team_id):
    """Send a chat message to team"""
    try:
        data = request.json
        message_id = str(uuid.uuid4())
        
        conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO chat_messages (id, team_id, sender_id, message, message_type)
            VALUES (?, ?, ?, ?, ?)
        ''', (message_id, team_id, data.get('sender_id'), data.get('message'), data.get('message_type', 'text')))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message_id": message_id,
            "message": "Message sent successfully"
        })
        
    except Exception as e:
        logger.error(f"Error sending chat message: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/team/<team_id>/complete', methods=['POST'])
def complete_team_project(team_id):
    """Mark team project as complete and award XP"""
    try:
        data = request.json
        project_complexity = data.get('complexity', 'medium')
        
        # Get team members
        conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.* FROM user_profiles u
            JOIN team_members tm ON u.id = tm.user_id
            WHERE tm.team_id = ?
        ''', (team_id,))
        
        team_members_data = cursor.fetchall()
        
        # Calculate XP rewards
        team_members = []
        for member_data in team_members_data:
            user_profile = UserProfile(
                id=member_data[0],
                clerk_id=member_data[1],
                username=member_data[2],
                email=member_data[3],
                skills=json.loads(member_data[4]),
                interests=json.loads(member_data[5]),
                experience_level=member_data[6],
                availability=json.loads(member_data[7]),
                timezone=member_data[8],
                preferred_domains=json.loads(member_data[9]),
                working_style=member_data[10],
                completed_projects=json.loads(member_data[11]),
                personality_traits=json.loads(member_data[12])
            )
            team_members.append(user_profile)
        
        xp_rewards = calculate_team_xp(team_members, project_complexity)
        
        # Create achievement record
        achievement_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO team_achievements (id, team_id, achievement_type, description, points)
            VALUES (?, ?, ?, ?, ?)
        ''', (achievement_id, team_id, 'project_completion', 'Successfully completed collaborative project', sum(xp_rewards.values())))
        
        # Update team status
        cursor.execute('UPDATE teams SET status = ? WHERE id = ?', ('completed', team_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "xp_rewards": xp_rewards,
            "total_xp": sum(xp_rewards.values()),
            "achievement_id": achievement_id,
            "message": "Project completed successfully! XP awarded to all team members."
        })
        
    except Exception as e:
        logger.error(f"Error completing team project: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get collaboration leaderboard"""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.username, COUNT(DISTINCT t.id) as completed_projects, 
                   SUM(ta.points) as total_xp
            FROM user_profiles u
            LEFT JOIN team_members tm ON u.id = tm.user_id
            LEFT JOIN teams t ON tm.team_id = t.id AND t.status = 'completed'
            LEFT JOIN team_achievements ta ON t.id = ta.team_id
            GROUP BY u.id, u.username
            ORDER BY total_xp DESC, completed_projects DESC
            LIMIT 20
        ''')
        
        leaderboard_data = cursor.fetchall()
        conn.close()
        
        leaderboard = []
        for rank, (username, completed_projects, total_xp) in enumerate(leaderboard_data, 1):
            leaderboard.append({
                "rank": rank,
                "username": username,
                "completed_projects": completed_projects or 0,
                "total_xp": total_xp or 0
            })
        
        return jsonify({
            "success": True,
            "leaderboard": leaderboard
        })
        
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 4011))  # Use PORT env var or default to 4011
    print(f"[🤝] AI Collab Connector starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True) 