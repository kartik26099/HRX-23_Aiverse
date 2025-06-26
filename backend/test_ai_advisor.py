#!/usr/bin/env python3
"""
Test script for AI Advisor Service
"""

import requests
import json
import time

def test_ai_advisor():
    """Test the AI advisor service"""
    base_url = "http://localhost:4010"
    
    print("🧪 Testing AI Advisor Service...")
    
    # Test 1: Health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False
    
    # Test 2: Basic chat
    print("\n2. Testing basic chat...")
    try:
        chat_data = {
            "message": "Hello, can you help me with career advice?",
            "history": [],
            "session_id": "test_session"
        }
        
        response = requests.post(
            f"{base_url}/api/advisor",
            json=chat_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Chat response received: {data['response'][:100]}...")
            print(f"   Session ID: {data.get('session_id', 'None')}")
        else:
            print(f"❌ Chat failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Chat error: {str(e)}")
        return False
    
    # Test 3: Quiz generation
    print("\n3. Testing quiz generation...")
    try:
        quiz_data = {
            "history": [
                {"role": "user", "content": "Tell me about machine learning"},
                {"role": "assistant", "content": "Machine learning is a subset of artificial intelligence..."}
            ],
            "topic": "machine learning"
        }
        
        response = requests.post(
            f"{base_url}/api/generate-quiz",
            json=quiz_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if "questions" in data and len(data["questions"]) > 0:
                print(f"✅ Quiz generated successfully with {len(data['questions'])} questions")
            else:
                print(f"⚠️  Quiz response received but no questions found: {data}")
        else:
            print(f"❌ Quiz generation failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Quiz generation error: {str(e)}")
    
    print("\n🎉 AI Advisor service tests completed!")
    return True

if __name__ == "__main__":
    test_ai_advisor() 