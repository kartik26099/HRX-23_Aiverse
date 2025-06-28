#!/usr/bin/env python3
"""
Test script to verify that the DIY Project Evaluator can start 
with fallback implementations for missing dependencies.
"""

import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """Test if all modules can be imported with fallbacks."""
    print("Testing imports with fallback implementations...")
    
    try:
        from app.utils.image_caption import get_image_caption
        print("✓ Image caption module imported successfully")
        
        # Test the fallback
        result = get_image_caption("test_image.jpg")
        print(f"  Fallback result: {result[:100]}...")
        
    except Exception as e:
        print(f"✗ Image caption module failed: {e}")
    
    try:
        from app.utils.video_transcript import get_transcript
        print("✓ Video transcript module imported successfully")
        
        # Test the fallback
        result = get_transcript("test_video.mp4")
        print(f"  Fallback result: {result[:100]}...")
        
    except Exception as e:
        print(f"✗ Video transcript module failed: {e}")
    
    try:
        from app.utils.llm import ask_llm
        print("✓ LLM module imported successfully")
        
        # Test the mock response
        result = ask_llm("Test prompt")
        print(f"  Mock result: {result[:100]}...")
        
    except Exception as e:
        print(f"✗ LLM module failed: {e}")
    
    try:
        from app.main import app
        print("✓ Main FastAPI app imported successfully")
        
    except Exception as e:
        print(f"✗ Main app failed: {e}")
        return False
    
    return True

def test_agents():
    """Test if agent modules can be imported."""
    print("\nTesting agent imports...")
    
    agents = [
        'app.agents.completion_agent',
        'app.agents.functionality_agent', 
        'app.agents.presentation_agent',
        'app.agents.relevance_agent',
        'app.agents.supervisor_agent'
    ]
    
    for agent in agents:
        try:
            __import__(agent)
            print(f"✓ {agent} imported successfully")
        except Exception as e:
            print(f"✗ {agent} failed: {e}")

if __name__ == "__main__":
    print("DIY Project Evaluator - Fallback Test")
    print("=" * 50)
    
    success = test_imports()
    test_agents()
    
    if success:
        print("\n✅ All core modules imported successfully!")
        print("The application should be able to start with fallback implementations.")
        print("\nTo run the application:")
        print("cd hackronx/backend/diy_project_evaluator")
        print("python start_server.py")
    else:
        print("\n❌ Some modules failed to import.")
        print("Please install missing dependencies or check the error messages above.") 