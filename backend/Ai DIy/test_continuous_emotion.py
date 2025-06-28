#!/usr/bin/env python3
"""
Test script for continuous emotion detection endpoints
"""

import requests
import json
import time

# Backend URL
BACKEND_URL = "http://localhost:4009"

def test_emotion_detector_status():
    """Test emotion detector status endpoint"""
    print("Testing emotion detector status...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/emotion-detector-status")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Emotion detector status: {data}")
            return data.get('emotion_detector_available', False)
        else:
            print(f"❌ Failed to get emotion detector status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing emotion detector status: {e}")
        return False

def test_continuous_emotion_detection():
    """Test continuous emotion detection endpoint"""
    print("\nTesting continuous emotion detection...")
    
    try:
        # Test with 1 second detection
        response = requests.post(
            f"{BACKEND_URL}/api/detect-emotion-continuous",
            json={"detection_duration": 1},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Continuous emotion detection result: {data}")
            
            if data.get('success'):
                emotion = data.get('emotion')
                confidence = data.get('confidence', 0)
                should_show_popup = data.get('should_show_popup', False)
                
                print(f"   Detected emotion: {emotion}")
                print(f"   Confidence: {confidence:.3f}")
                print(f"   Should show popup: {should_show_popup}")
                
                if should_show_popup:
                    print(f"   Message: {data.get('message', 'No message')}")
                
                return True
            else:
                print(f"   ❌ Detection failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Failed to detect emotion: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing continuous emotion detection: {e}")
        return False

def test_modify_project_for_mood():
    """Test project modification endpoint"""
    print("\nTesting project modification for mood...")
    
    # Sample project data
    sample_project = {
        "title": "Test Project",
        "projectOverview": "This is a test project for emotion-based modification.",
        "days": [
            {
                "day": 1,
                "title": "Setup",
                "tasks": ["Install dependencies", "Configure environment"]
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/modify-project-for-mood",
            json={
                "current_project": sample_project,
                "emotion": "Fear",
                "action": "modify"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Project modification result: {data}")
            
            if data.get('success'):
                modified_project = data.get('project_data', {})
                print(f"   Original title: {sample_project['title']}")
                print(f"   Modified title: {modified_project.get('title', 'N/A')}")
                print(f"   Mood detected: {modified_project.get('mood_detected', 'N/A')}")
                return True
            else:
                print(f"   ❌ Modification failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Failed to modify project: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error testing project modification: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Continuous Emotion Detection System")
    print("=" * 50)
    
    # Test 1: Emotion detector status
    status_ok = test_emotion_detector_status()
    
    if not status_ok:
        print("\n❌ Emotion detector not available. Skipping other tests.")
        return
    
    # Test 2: Continuous emotion detection
    detection_ok = test_continuous_emotion_detection()
    
    # Test 3: Project modification
    modification_ok = test_modify_project_for_mood()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print(f"   Emotion detector status: {'✅' if status_ok else '❌'}")
    print(f"   Continuous detection: {'✅' if detection_ok else '❌'}")
    print(f"   Project modification: {'✅' if modification_ok else '❌'}")
    
    if all([status_ok, detection_ok, modification_ok]):
        print("\n🎉 All tests passed! The continuous emotion detection system is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the backend configuration.")

if __name__ == "__main__":
    main() 