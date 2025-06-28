#!/usr/bin/env python3
"""
Test script to check machine learning tag feedback
"""

import requests
import json

def test_machine_learning_feedback():
    """Test the machine learning tag feedback specifically"""
    
    print("🧪 Testing Machine Learning Tag Feedback")
    print("=" * 50)
    
    # Test the sentiment analysis directly
    user_feedback = "This tool is completely useless. It wasted my time and gave me nothing of value."
    
    print(f"User feedback: \"{user_feedback}\"")
    
    # Test with backend API
    try:
        # Test sentiment analysis endpoint
        response = requests.get("http://localhost:5001/api/sentiment-analysis?force_refresh=true")
        if response.status_code == 200:
            data = response.json()
            print("✅ Sentiment analysis API working")
            
            # Check tag analysis
            tag_analysis = data['sentiment_data']['tag_analysis']
            print(f"\n📊 Tag Analysis Results:")
            for tag, stats in tag_analysis.items():
                print(f"  - {tag}: {stats['total_posts']} posts ({stats['negative']} negative)")
                
                if tag.lower() in ['machine learning', 'machine-learning', 'ml']:
                    print(f"    🎯 Found machine learning tag with {stats['negative']} negative posts!")
                    
        else:
            print(f"❌ API error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test debug endpoint
    try:
        print("\n🔍 Checking debug data...")
        response = requests.get("http://localhost:5001/api/debug-data")
        if response.status_code == 200:
            debug_data = response.json()
            print(f"📊 Total posts: {debug_data['total_posts']}")
            print(f"🏷️  Total tags: {debug_data['total_tags']}")
            print(f"🏷️  Available tags: {debug_data['all_tags']}")
            
            # Look for machine learning posts
            print(f"\n📝 Posts with sentiment:")
            for post in debug_data['posts_with_sentiment']:
                if post['sentiment'] == 'NEGATIVE':
                    print(f"  🚨 NEGATIVE: {post['content']}")
                    print(f"    Tags: {post['tags']}")
                    print(f"    User: {post['user']}")
                    
            # Check tag analysis
            print(f"\n🏷️  Tag Analysis:")
            for tag, stats in debug_data['tag_analysis'].items():
                if stats['negative'] > 0:
                    print(f"  🚨 {tag}: {stats['negative']} negative posts")
                    for post_content in stats['posts']:
                        print(f"    - {post_content}")
                        
        else:
            print(f"❌ Debug API error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Debug error: {e}")
    
    return True

def test_sentiment_detection():
    """Test sentiment detection for the specific feedback"""
    
    print("\n🧪 Testing Sentiment Detection")
    print("=" * 40)
    
    # Test with the test endpoint
    user_feedback = "This tool is completely useless. It wasted my time and gave me nothing of value."
    
    try:
        response = requests.post("http://localhost:5001/api/test-sentiment", 
                               json={'text': user_feedback})
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Sentiment test result: {result['rule_based_sentiment']}")
            return result['rule_based_sentiment'] == 'NEGATIVE'
        else:
            print(f"❌ Test API error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Machine Learning Feedback Test")
    
    # Test sentiment detection
    sentiment_ok = test_sentiment_detection()
    
    # Test machine learning tag
    tag_ok = test_machine_learning_feedback()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"  Sentiment Detection: {'✅ PASS' if sentiment_ok else '❌ FAIL'}")
    print(f"  Tag Analysis: {'✅ PASS' if tag_ok else '❌ FAIL'}")
    
    if sentiment_ok and tag_ok:
        print("\n🎉 All tests passed! Your negative feedback should be detected.")
    else:
        print("\n⚠️  Some tests failed. Check the backend logs for details.") 