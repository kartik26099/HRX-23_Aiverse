#!/usr/bin/env python3
"""
Test script for improved AI Faculty system with document summarization
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'faculty'))

from rag_chatbot import chat_with_documents, ChatMessage
import asyncio

def test_improved_faculty():
    """Test the improved AI Faculty system"""
    
    print("🧪 Testing Improved AI Faculty System")
    print("=" * 50)
    
    # Test chat functionality
    print("\n📝 Test: Chat with Documents")
    print("-" * 30)
    
    # Create a test message
    test_message = "What are the main topics covered in the uploaded documents?"
    
    try:
        # Run the async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        response = loop.run_until_complete(chat_with_documents(test_message))
        loop.close()
        
        print("✅ Chat response received:")
        print(f"Response: {response.response[:200]}...")
        print(f"Sources: {response.sources}")
        
    except Exception as e:
        print(f"❌ Error in chat: {e}")
    
    print("\n🎉 Testing completed!")

if __name__ == "__main__":
    test_improved_faculty() 