#!/usr/bin/env python3
"""
Test script for AI Collab Connector
Tests all major functionality of the collaboration service
"""

import requests
import json
import time
import uuid
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:4011"
TEST_USER_1 = {
    "clerk_id": f"test_user_{uuid.uuid4()}",
    "username": "alice_dev",
    "email": "alice@test.com",
    "skills": ["Python", "Machine Learning", "Data Science"],
    "interests": ["AI", "Climate Tech", "Education"],
    "experience_level": "intermediate",
    "availability": {"timezone": "UTC", "hours_per_week": 15},
    "preferred_domains": ["AI/ML", "Web Development"],
    "working_style": "research_focused",
    "completed_projects": [{"title": "ML Weather Predictor", "skills_used": ["Python", "TensorFlow"]}],
    "personality_traits": ["analytical", "detail-oriented"]
}

TEST_USER_2 = {
    "clerk_id": f"test_user_{uuid.uuid4()}",
    "username": "bob_designer",
    "email": "bob@test.com",
    "skills": ["Figma", "React", "UI/UX Design"],
    "interests": ["Design", "Climate Tech", "Education"],
    "experience_level": "beginner",
    "availability": {"timezone": "UTC", "hours_per_week": 10},
    "preferred_domains": ["Web Development", "Design"],
    "working_style": "design_focused",
    "completed_projects": [{"title": "Eco Dashboard UI", "skills_used": ["Figma", "React"]}],
    "personality_traits": ["creative", "collaborative"]
}

TEST_PROJECT = {
    "title": "Climate Education Platform",
    "description": "An interactive platform to teach climate science through gamification",
    "required_skills": ["Python", "React", "UI/UX", "Data Science"],
    "preferred_domains": ["Education", "Climate Tech"],
    "estimated_duration": "4 weeks",
    "team_size": 2
}

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_create_user_profile(user_data: Dict[str, Any]) -> str:
    """Test creating a user profile"""
    print(f"👤 Creating profile for {user_data['username']}...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/create-profile",
            headers={"Content-Type": "application/json"},
            json=user_data
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Profile created: {data}")
            return data.get("profile_id")
        else:
            print(f"❌ Profile creation failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Profile creation error: {e}")
        return None

def test_find_collaborators(requester_id: str, project_requirements: Dict[str, Any]):
    """Test finding collaborators"""
    print("🔍 Testing collaborator matching...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/find-collaborators",
            headers={"Content-Type": "application/json"},
            json={
                "requester_id": requester_id,
                "project_requirements": project_requirements
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {data.get('total_matches', 0)} collaborators")
            for match in data.get('matches', []):
                print(f"   - {match['username']} (Score: {match['compatibility_score']})")
            return data.get('matches', [])
        else:
            print(f"❌ Collaborator matching failed: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"❌ Collaborator matching error: {e}")
        return []

def test_create_team(requester_id: str, collaborator_id: str, project_title: str) -> str:
    """Test creating a team"""
    print("👥 Creating team...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/create-team",
            headers={"Content-Type": "application/json"},
            json={
                "team_name": f"Team for {project_title}",
                "project_id": str(uuid.uuid4()),
                "members": [
                    {"user_id": requester_id, "role": "Project Lead"},
                    {"user_id": collaborator_id, "role": "Developer"}
                ]
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Team created: {data}")
            return data.get("team_id")
        else:
            print(f"❌ Team creation failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Team creation error: {e}")
        return None

def test_generate_tasks(team_id: str, project_requirements: Dict[str, Any]):
    """Test generating tasks for a team"""
    print("📋 Generating tasks...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/generate-tasks",
            headers={"Content-Type": "application/json"},
            json={
                "team_id": team_id,
                "project_requirements": project_requirements
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Generated {len(data.get('task_distribution', {}).get('tasks', []))} tasks")
            return data.get('task_distribution', {})
        else:
            print(f"❌ Task generation failed: {response.status_code} - {response.text}")
            return {}
    except Exception as e:
        print(f"❌ Task generation error: {e}")
        return {}

def test_get_team_tasks(team_id: str):
    """Test getting team tasks"""
    print("📋 Getting team tasks...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/team/{team_id}/tasks")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Retrieved {len(data.get('tasks', []))} tasks")
            return data.get('tasks', [])
        else:
            print(f"❌ Task retrieval failed: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"❌ Task retrieval error: {e}")
        return []

def test_team_chat(team_id: str, sender_id: str):
    """Test team chat functionality"""
    print("💬 Testing team chat...")
    
    try:
        # Send a message
        message_data = {
            "sender_id": sender_id,
            "message": "Hello team! Let's get started on our project! 🚀",
            "message_type": "text"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/team/{team_id}/chat",
            headers={"Content-Type": "application/json"},
            json=message_data
        )
        
        if response.status_code == 200:
            print("✅ Message sent successfully")
            
            # Get chat messages
            response = requests.get(f"{BASE_URL}/api/team/{team_id}/chat")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Retrieved {len(data.get('messages', []))} chat messages")
                return True
            else:
                print(f"❌ Chat retrieval failed: {response.status_code}")
                return False
        else:
            print(f"❌ Message sending failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return False

def test_complete_project(team_id: str):
    """Test completing a team project"""
    print("🏆 Testing project completion...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/team/{team_id}/complete",
            headers={"Content-Type": "application/json"},
            json={"complexity": "medium"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Project completed! XP awarded: {data.get('total_xp', 0)}")
            return True
        else:
            print(f"❌ Project completion failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Project completion error: {e}")
        return False

def test_leaderboard():
    """Test getting the leaderboard"""
    print("🏆 Testing leaderboard...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/leaderboard")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Retrieved leaderboard with {len(data.get('leaderboard', []))} entries")
            return data.get('leaderboard', [])
        else:
            print(f"❌ Leaderboard retrieval failed: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"❌ Leaderboard error: {e}")
        return []

def run_full_test():
    """Run the complete test suite"""
    print("🚀 Starting AI Collab Connector Test Suite")
    print("=" * 50)
    
    # Test 1: Health check
    if not test_health_check():
        print("❌ Health check failed. Make sure the service is running.")
        return False
    
    print("\n" + "=" * 50)
    
    # Test 2: Create user profiles
    user1_id = test_create_user_profile(TEST_USER_1)
    if not user1_id:
        print("❌ Failed to create first user profile")
        return False
    
    user2_id = test_create_user_profile(TEST_USER_2)
    if not user2_id:
        print("❌ Failed to create second user profile")
        return False
    
    print("\n" + "=" * 50)
    
    # Test 3: Find collaborators
    matches = test_find_collaborators(user1_id, TEST_PROJECT)
    if not matches:
        print("❌ No collaborators found")
        return False
    
    # Use the first match
    collaborator = matches[0]
    collaborator_id = collaborator['user_id']
    
    print("\n" + "=" * 50)
    
    # Test 4: Create team
    team_id = test_create_team(user1_id, collaborator_id, TEST_PROJECT['title'])
    if not team_id:
        print("❌ Failed to create team")
        return False
    
    print("\n" + "=" * 50)
    
    # Test 5: Generate tasks
    task_distribution = test_generate_tasks(team_id, TEST_PROJECT)
    if not task_distribution:
        print("❌ Failed to generate tasks")
        return False
    
    print("\n" + "=" * 50)
    
    # Test 6: Get team tasks
    tasks = test_get_team_tasks(team_id)
    if not tasks:
        print("❌ Failed to retrieve tasks")
        return False
    
    print("\n" + "=" * 50)
    
    # Test 7: Team chat
    if not test_team_chat(team_id, user1_id):
        print("❌ Chat functionality failed")
        return False
    
    print("\n" + "=" * 50)
    
    # Test 8: Complete project
    if not test_complete_project(team_id):
        print("❌ Project completion failed")
        return False
    
    print("\n" + "=" * 50)
    
    # Test 9: Leaderboard
    leaderboard = test_leaderboard()
    if leaderboard is None:
        print("❌ Leaderboard failed")
        return False
    
    print("\n" + "=" * 50)
    print("🎉 All tests completed successfully!")
    print("✅ AI Collab Connector is working perfectly!")
    
    return True

if __name__ == "__main__":
    # Wait a moment for the service to be ready
    print("⏳ Waiting for service to be ready...")
    time.sleep(2)
    
    success = run_full_test()
    
    if success:
        print("\n🎯 Test Summary: All functionality working correctly!")
        print("🚀 The AI Collab Connector is ready for production use!")
    else:
        print("\n❌ Test Summary: Some tests failed. Check the service configuration.")
        print("💡 Make sure the service is running on port 4011") 