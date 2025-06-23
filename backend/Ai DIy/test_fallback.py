#!/usr/bin/env python3
"""
Test script for fallback project generation
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_fallback():
    """Test the fallback project generation"""
    print("🧪 Testing fallback project generation...")
    
    test_data = {
        "topic": "Build a Weather App",
        "available_time": "3 hours",
        "skill_level": "beginner",
        "user_description": "I'm new to programming and want to learn React"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/test-fallback",
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Fallback project generation successful!")
                print(f"📋 Project: {data['fallback_project'].get('project_title', 'N/A')}")
                print(f"⏱️  Duration: {data['fallback_project'].get('estimated_time', 'N/A')}")
                print(f"🔧 Tools & Materials:")
                tools_materials = data['fallback_project'].get('tools_and_materials', '')
                if tools_materials:
                    print(tools_materials)
                else:
                    print("❌ No tools and materials found!")
                print(f"🤖 Model available: {data.get('model_available', False)}")
                return True
            else:
                print(f"❌ Fallback generation failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Fallback generation failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Fallback generation error: {e}")
        return False

if __name__ == "__main__":
    test_fallback() 