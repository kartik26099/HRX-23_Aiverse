#!/usr/bin/env python3
"""
Test script to check Groq API connection and configuration
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_api_configuration():
    """Test the API configuration and connection"""
    print("🔍 Testing Groq API Configuration...")
    print("=" * 50)
    
    # Check if .env file exists
    env_file = ".env"
    if os.path.exists(env_file):
        print("✅ .env file found")
    else:
        print("❌ .env file not found")
        print("   Please create a .env file with your GROQ_API_KEY")
        return False
    
    # Check API key
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        if api_key == "your_groq_api_key_here":
            print("❌ API key not configured (still using placeholder)")
            print("   Please update your .env file with a valid Groq API key")
            return False
        elif len(api_key) < 10:
            print("❌ API key appears to be too short")
            return False
        else:
            print("✅ API key found (length: {})".format(len(api_key)))
    else:
        print("❌ No API key found in environment")
        return False
    
    # Test Groq client import
    try:
        from groq import Groq
        print("✅ Groq library imported successfully")
    except ImportError as e:
        print("❌ Failed to import Groq library: {}".format(e))
        print("   Please install: pip install groq")
        return False
    
    # Test client creation
    try:
        client = Groq(api_key=api_key)
        print("✅ Groq client created successfully")
    except Exception as e:
        print("❌ Failed to create Groq client: {}".format(e))
        return False
    
    # Test simple API call
    try:
        print("🔄 Testing API connection...")
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": "Hello, this is a test message."}],
            model="llama-3.3-70b-versatile",
            max_tokens=10
        )
        print("✅ API connection successful!")
        print("   Response: {}".format(response.choices[0].message.content[:50]))
        return True
    except Exception as e:
        print("❌ API connection failed: {}".format(e))
        return False

def main():
    """Main function"""
    print("🚀 Groq API Connection Test")
    print("=" * 50)
    
    success = test_api_configuration()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 All tests passed! Your AI Advisor should work correctly.")
    else:
        print("❌ Configuration issues found. Please fix them before using the AI Advisor.")
        print("\n📋 Next steps:")
        print("1. Get a free API key from: https://console.groq.com/")
        print("2. Create a .env file in the 'ai advisor' directory")
        print("3. Add your API key: GROQ_API_KEY=your_actual_api_key_here")
        print("4. Run this test again")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 