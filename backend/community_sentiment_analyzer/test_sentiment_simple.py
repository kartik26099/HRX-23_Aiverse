#!/usr/bin/env python3
"""
Simple test script to verify sentiment analysis with real data
"""

import os
import sys
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import supabase, analyze_sentiment, get_community_data

def test_sentiment_analysis():
    """Test sentiment analysis with real data from Supabase"""
    
    print("🧪 Testing Sentiment Analysis with Real Data")
    print("=" * 50)
    
    # Test 1: Check Supabase connection
    print("1. Testing Supabase connection...")
    if not supabase:
        print("❌ Supabase client not initialized")
        return False
    print("✅ Supabase client connected")
    
    # Test 2: Get real data
    print("\n2. Fetching real data from Supabase...")
    try:
        data = get_community_data()
        posts = data['posts']
        print(f"✅ Retrieved {len(posts)} posts")
        
        if len(posts) == 0:
            print("⚠️  No posts found in database")
            return False
            
    except Exception as e:
        print(f"❌ Error fetching data: {e}")
        return False
    
    # Test 3: Test sentiment analysis on real posts
    print("\n3. Testing sentiment analysis on real posts...")
    test_posts = posts[:5]  # Test first 5 posts
    
    for i, post in enumerate(test_posts, 1):
        content = post['content']
        sentiment = analyze_sentiment(content)
        print(f"   Post {i}: {content[:50]}... → {sentiment}")
    
    # Test 4: Test with known positive/negative content
    print("\n4. Testing with known content...")
    test_texts = [
        "I love this app! It's amazing!",
        "This is terrible, I hate it",
        "The app is okay, nothing special"
    ]
    
    for text in test_texts:
        sentiment = analyze_sentiment(text)
        print(f"   '{text}' → {sentiment}")
    
    print("\n✅ Sentiment analysis test completed successfully!")
    return True

if __name__ == "__main__":
    test_sentiment_analysis() 