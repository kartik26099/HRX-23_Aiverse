#!/usr/bin/env python3
"""
Test script for the sentiment analysis API
"""

import requests
import json
import time

def test_sentiment_api():
    """Test the sentiment analysis API endpoints"""
    
    base_url = "http://localhost:5001"
    
    print("🧪 Testing Sentiment Analysis API")
    print("=" * 50)
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/api/health")
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Health check passed")
            print(f"   Status: {health_data.get('status')}")
            print(f"   Supabase: {health_data.get('supabase_status')}")
            print(f"   Cache: {health_data.get('cache_status')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test sentiment analysis endpoint
    print("\n2. Testing sentiment analysis endpoint...")
    try:
        response = requests.get(f"{base_url}/api/sentiment-analysis")
        if response.status_code == 200:
            sentiment_data = response.json()
            print("✅ Sentiment analysis successful")
            
            # Check data structure
            if 'sentiment_data' in sentiment_data:
                data = sentiment_data['sentiment_data']
                print(f"   Total posts: {data.get('overall_stats', {}).get('total_posts', 0)}")
                print(f"   Total comments: {data.get('overall_stats', {}).get('total_comments', 0)}")
                
                # Check tag analysis
                tag_analysis = data.get('tag_analysis', {})
                print(f"   Tags found: {len(tag_analysis)}")
                for tag, stats in tag_analysis.items():
                    print(f"     - {tag}: {stats.get('total_posts', 0)} posts")
                
                # Check recommendations
                if 'recommendations' in sentiment_data:
                    print(f"   Recommendations: {len(sentiment_data['recommendations'])} characters")
                
                return True
            else:
                print("❌ Invalid data structure")
                return False
        else:
            print(f"❌ Sentiment analysis failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Sentiment analysis error: {e}")
        return False

def test_frontend_proxy():
    """Test the frontend proxy to backend"""
    
    print("\n3. Testing frontend proxy...")
    try:
        response = requests.get("http://localhost:3002/api/sentiment/sentiment-analysis")
        if response.status_code == 200:
            print("✅ Frontend proxy working")
            return True
        else:
            print(f"❌ Frontend proxy failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend proxy error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting API tests...")
    
    # Test backend directly
    backend_ok = test_sentiment_api()
    
    # Test frontend proxy
    frontend_ok = test_frontend_proxy()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"   Backend API: {'✅ PASS' if backend_ok else '❌ FAIL'}")
    print(f"   Frontend Proxy: {'✅ PASS' if frontend_ok else '❌ FAIL'}")
    
    if backend_ok and frontend_ok:
        print("\n🎉 All tests passed! The sentiment analysis system is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the backend and frontend services.")
        
        if not backend_ok:
            print("   - Make sure the backend is running on port 5001")
            print("   - Check the backend logs for errors")
            
        if not frontend_ok:
            print("   - Make sure the frontend is running on port 3002")
            print("   - Check the frontend logs for errors") 