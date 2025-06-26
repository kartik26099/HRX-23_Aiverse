#!/usr/bin/env python3
"""
Test script to check AI Advisor startup
"""

import sys
import os

# Add the ai advisor directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai advisor'))

def test_imports():
    """Test if all imports work"""
    print("🧪 Testing AI Advisor imports...")
    
    try:
        print("1. Testing config import...")
        from config import OPENROUTER_API_KEY, LLM_API_URL, MODEL_NAME
        print(f"   ✅ Config imported successfully")
        print(f"   API Key: {'Set' if OPENROUTER_API_KEY else 'Not set'}")
        print(f"   Model: {MODEL_NAME}")
        
    except Exception as e:
        print(f"   ❌ Config import failed: {str(e)}")
        return False
    
    try:
        print("2. Testing schemas import...")
        from schemas import ChatMessage
        print("   ✅ Schemas imported successfully")
        
    except Exception as e:
        print(f"   ❌ Schemas import failed: {str(e)}")
        return False
    
    try:
        print("3. Testing document_cache import...")
        from document_cache import document_cache
        print("   ✅ Document cache imported successfully")
        
    except Exception as e:
        print(f"   ❌ Document cache import failed: {str(e)}")
        return False
    
    try:
        print("4. Testing openrouter_client import...")
        from openrouter_client import openrouter_client
        print("   ✅ OpenRouter client imported successfully")
        
    except Exception as e:
        print(f"   ❌ OpenRouter client import failed: {str(e)}")
        return False
    
    try:
        print("5. Testing advisor import...")
        from advisor import career_advisor_response, generate_quiz_from_context
        print("   ✅ Advisor functions imported successfully")
        
    except Exception as e:
        print(f"   ❌ Advisor import failed: {str(e)}")
        return False
    
    try:
        print("6. Testing document_handler import...")
        from document_handler import process_document, get_document_segments_for_context
        print("   ✅ Document handler imported successfully")
        
    except Exception as e:
        print(f"   ❌ Document handler import failed: {str(e)}")
        return False
    
    try:
        print("7. Testing Flask app import...")
        from app import app
        print("   ✅ Flask app imported successfully")
        
    except Exception as e:
        print(f"   ❌ Flask app import failed: {str(e)}")
        return False
    
    print("\n🎉 All imports successful!")
    return True

def test_basic_functionality():
    """Test basic functionality"""
    print("\n🧪 Testing basic functionality...")
    
    try:
        from schemas import ChatMessage
        from document_cache import document_cache
        
        # Test ChatMessage creation
        msg = ChatMessage(role="user", content="test")
        print("   ✅ ChatMessage creation works")
        
        # Test document cache
        doc_id = document_cache.add_document("test.txt", "test content", "test")
        print(f"   ✅ Document cache works (added doc: {doc_id})")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Basic functionality test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 AI Advisor Startup Test")
    print("=" * 40)
    
    if test_imports() and test_basic_functionality():
        print("\n✅ All tests passed! AI Advisor should start successfully.")
        print("\nTo start the service, run:")
        print("cd backend/ai\\ advisor && python app.py")
    else:
        print("\n❌ Some tests failed. Check the errors above.")
        sys.exit(1) 