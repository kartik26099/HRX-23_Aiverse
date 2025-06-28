#!/usr/bin/env python3
"""
Test script for the Community Sentiment Analysis System
"""

import requests
import json
import time

def test_health_endpoint():
    """Test the health endpoint"""
    try:
        response = requests.get('http://localhost:5001/api/health', timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed!")
            print(f"   Status: {data.get('status')}")
            print(f"   Supabase: {data.get('supabase_status')}")
            print(f"   Cache: {data.get('cache_status')}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_sentiment_analysis():
    """Test the sentiment analysis endpoint"""
    try:
        print("\n🔄 Testing sentiment analysis...")
        response = requests.get('http://localhost:5001/api/sentiment-analysis', timeout=30)
        if response.status_code == 200:
            data = response.json()
            print("✅ Sentiment analysis successful!")
            
            stats = data.get('sentiment_data', {}).get('overall_stats', {})
            print(f"   Total Posts: {stats.get('total_posts', 0)}")
            print(f"   Total Comments: {stats.get('total_comments', 0)}")
            print(f"   Positive Posts: {stats.get('positive_posts', 0)}")
            print(f"   Negative Posts: {stats.get('negative_posts', 0)}")
            print(f"   Neutral Posts: {stats.get('neutral_posts', 0)}")
            
            recommendations = data.get('recommendations', '')
            if recommendations:
                print(f"   AI Recommendations: {len(recommendations)} characters")
            
            return True
        else:
            print(f"❌ Sentiment analysis failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Sentiment analysis error: {e}")
        return False

def test_dashboard_access():
    """Test if the dashboard is accessible"""
    try:
        response = requests.get('http://localhost:3002', timeout=10)
        if response.status_code == 200:
            print("✅ Admin dashboard is accessible!")
            return True
        else:
            print(f"❌ Dashboard access failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Dashboard access error: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing Community Sentiment Analysis System")
    print("=" * 50)
    
    # Wait a moment for services to start
    print("⏳ Waiting for services to start...")
    time.sleep(3)
    
    # Test health endpoint
    health_ok = test_health_endpoint()
    
    if health_ok:
        # Test sentiment analysis
        sentiment_ok = test_sentiment_analysis()
        
        # Test dashboard access
        dashboard_ok = test_dashboard_access()
        
        print("\n" + "=" * 50)
        print("📊 Test Results Summary:")
        print(f"   Health Check: {'✅ PASS' if health_ok else '❌ FAIL'}")
        print(f"   Sentiment Analysis: {'✅ PASS' if sentiment_ok else '❌ FAIL'}")
        print(f"   Dashboard Access: {'✅ PASS' if dashboard_ok else '❌ FAIL'}")
        
        if health_ok and sentiment_ok and dashboard_ok:
            print("\n🎉 All tests passed! Your sentiment analysis system is working correctly.")
            print("\n📱 Access your dashboard at: http://localhost:3002")
            print("🔍 API health check at: http://localhost:5001/api/health")
        else:
            print("\n⚠️  Some tests failed. Check the error messages above.")
    else:
        print("\n❌ Health check failed. Make sure the backend is running.")

if __name__ == "__main__":
    main() 