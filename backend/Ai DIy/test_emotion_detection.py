#!/usr/bin/env python3
"""
Test script for emotion detection functionality
"""

import requests
import json
import time

# API base URL
BASE_URL = "http://localhost:4009"

def test_emotion_detector_status():
    """Test if emotion detector is available"""
    print("Testing emotion detector status...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/emotion-detector-status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Emotion detector status: {data}")
            return data.get('emotion_detector_available', False)
        else:
            print(f"❌ Failed to get emotion detector status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing emotion detector status: {str(e)}")
        return False

def test_capture_emotion():
    """Test emotion capture from camera"""
    print("\nTesting emotion capture from camera...")
    print("This will open your camera for 3 seconds to detect emotion.")
    print("Make sure your camera is accessible and you're ready to show your face.")
    
    input("Press Enter to start emotion capture...")
    
    try:
        response = requests.post(f"{BASE_URL}/api/capture-emotion", 
                               json={"capture_duration": 3})
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Emotion detected: {data['emotion']}")
                print(f"   Confidence: {data['confidence']:.3f}")
                print(f"   Message: {data['message']}")
                return data['emotion']
            else:
                print(f"❌ Emotion detection failed: {data.get('error', 'Unknown error')}")
                return None
        else:
            print(f"❌ Failed to capture emotion: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error testing emotion capture: {str(e)}")
        return None

def test_generate_roadmap_with_mood(emotion):
    """Test generating roadmap with mood consideration"""
    print(f"\nTesting roadmap generation with mood: {emotion}")
    
    test_data = {
        "topic": "Weather App",
        "available_time": "2 hours",
        "skill_level": "beginner",
        "category": "software",
        "user_description": "I want to build a simple weather app",
        "emotion": emotion
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/generate-roadmap-with-mood", 
                               json=test_data)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                project_data = data['project_data']
                print(f"✅ Roadmap generated successfully!")
                print(f"   Project Title: {project_data.get('project_title', 'N/A')}")
                print(f"   Difficulty Level: {project_data.get('difficulty_level', 'N/A')}")
                print(f"   Mood Detected: {project_data.get('mood_detected', 'N/A')}")
                print(f"   Adjustment Message: {project_data.get('adjustment_message', 'N/A')}")
                return True
            else:
                print(f"❌ Roadmap generation failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Failed to generate roadmap: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing roadmap generation: {str(e)}")
        return False

def test_adjust_project_for_mood():
    """Test adjusting existing project for mood"""
    print("\nTesting project adjustment for mood...")
    
    # Sample project data
    original_project = {
        "project_title": "Simple Calculator",
        "difficulty_level": "intermediate",
        "project_overview": "A basic calculator application",
        "tools_and_materials": "- Python\n- Tkinter\n- Basic math operations"
    }
    
    test_emotions = ["Happy", "Sad", "Confused", "Neutral"]
    
    for emotion in test_emotions:
        print(f"\nTesting adjustment for emotion: {emotion}")
        
        test_data = {
            "project_data": original_project,
            "emotion": emotion
        }
        
        try:
            response = requests.post(f"{BASE_URL}/api/adjust-project-for-mood", 
                                   json=test_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    adjusted_project = data['adjusted_project']
                    print(f"✅ Project adjusted successfully!")
                    print(f"   Original Title: {original_project['project_title']}")
                    print(f"   Adjusted Title: {adjusted_project.get('project_title', 'N/A')}")
                    print(f"   Adjustment Message: {adjusted_project.get('adjustment_message', 'N/A')}")
                else:
                    print(f"❌ Project adjustment failed: {data.get('error', 'Unknown error')}")
            else:
                print(f"❌ Failed to adjust project: {response.status_code}")
        except Exception as e:
            print(f"❌ Error testing project adjustment: {str(e)}")

def main():
    """Main test function"""
    print("🧪 Testing AI DIY Project Generator with Emotion Detection")
    print("=" * 60)
    
    # Test 1: Check emotion detector status
    detector_available = test_emotion_detector_status()
    
    if not detector_available:
        print("\n❌ Emotion detector is not available. Please check:")
        print("   1. All dependencies are installed (tensorflow, opencv-python, etc.)")
        print("   2. model.h5 and haarcascade_frontalface_default.xml files are present")
        print("   3. The server is running on port 4009")
        return
    
    # Test 2: Capture emotion from camera
    detected_emotion = test_capture_emotion()
    
    if detected_emotion:
        # Test 3: Generate roadmap with mood
        test_generate_roadmap_with_mood(detected_emotion)
    
    # Test 4: Test project adjustment for different moods
    test_adjust_project_for_mood()
    
    print("\n🎉 Emotion detection testing completed!")
    print("\nTo use this in your frontend:")
    print("1. Call /api/capture-emotion to detect user's emotion")
    print("2. Show the mood adjustment message to the user")
    print("3. If user agrees, call /api/generate-roadmap-with-mood with the emotion")
    print("4. Or call /api/adjust-project-for-mood to modify existing project")

if __name__ == "__main__":
    main() 