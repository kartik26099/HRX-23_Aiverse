#!/usr/bin/env python3
"""
Test script for the AI DIY Project Generator backend API
"""

import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_health():
    """Test the health check endpoint"""
    print("🏥 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
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

def test_generate_roadmap():
    """Test the roadmap generation endpoint"""
    print("\n🎯 Testing roadmap generation...")
    
    test_data = {
        "topic": "Build a Simple Todo App",
        "available_time": "10 hours",
        "skill_level": "beginner",
        "user_description": "I'm new to programming and want to learn React",
        "youtube_url": ""
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/generate-roadmap",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Roadmap generation successful!")
                print(f"📋 Project: {data['project_data'].get('project_title', 'N/A')}")
                print(f"⏱️  Duration: {data['project_data'].get('estimated_time', 'N/A')}")
                print(f"📊 Skill Level: {data.get('assessed_skill_level', 'N/A')}")
                return True
            else:
                print(f"❌ Roadmap generation failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Roadmap generation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Roadmap generation error: {e}")
        return False

def test_extract_video_id():
    """Test video ID extraction"""
    print("\n🎥 Testing video ID extraction...")
    
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/extract-video-id",
            json={"url": test_url},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Video ID extracted: {data.get('video_id')}")
                return True
            else:
                print(f"❌ Video ID extraction failed: {data.get('error')}")
                return False
        else:
            print(f"❌ Video ID extraction failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Video ID extraction error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing AI DIY Project Generator Backend API")
    print("=" * 50)
    
    # Wait a moment for server to be ready
    time.sleep(1)
    
    tests = [
        test_health,
        test_extract_video_id,
        test_generate_roadmap,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the backend logs for details.")
    
    return passed == total

if __name__ == "__main__":
    main() 