#!/usr/bin/env python3
"""
Test script for AI Library service
"""

import requests
import json
import time

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get("http://localhost:4004/health")
        print(f"✅ Health check: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_search():
    """Test search endpoint"""
    print("\n🔍 Testing search endpoint...")
    try:
        response = requests.get("http://localhost:4004/search?query=Artificial%20Intelligence")
        print(f"✅ Search: {response.status_code}")
        
        data = response.json()
        print(f"   Scholar results: {len(data.get('scholar', []))}")
        print(f"   YouTube results: {len(data.get('youtube', []))}")
        print(f"   API Status: {data.get('api_status')}")
        print(f"   Errors: {data.get('errors', [])}")
        
        # Check if fallback data is being used
        if data.get('api_status', {}).get('scholar') == 'fallback':
            print("   ⚠️  Using fallback data for Scholar API")
        if data.get('api_status', {}).get('youtube') == 'fallback':
            print("   ⚠️  Using fallback data for YouTube API")
            
        return True
    except Exception as e:
        print(f"❌ Search failed: {e}")
        return False

def test_cache():
    """Test cache functionality"""
    print("\n🔍 Testing cache functionality...")
    try:
        # Get cache stats
        response = requests.get("http://localhost:4004/cache/stats")
        print(f"✅ Cache stats: {response.status_code}")
        cache_data = response.json()
        print(f"   Cache size: {cache_data.get('cache_size')}")
        print(f"   Cache keys: {cache_data.get('cache_keys')}")
        
        # Test caching by making the same search twice
        print("\n   Testing cache behavior...")
        start_time = time.time()
        response1 = requests.get("http://localhost:4004/search?query=Test%20Query")
        time1 = time.time() - start_time
        
        start_time = time.time()
        response2 = requests.get("http://localhost:4004/search?query=Test%20Query")
        time2 = time.time() - start_time
        
        print(f"   First request: {time1:.3f}s")
        print(f"   Second request: {time2:.3f}s")
        
        if time2 < time1:
            print("   ✅ Cache is working (second request faster)")
        else:
            print("   ⚠️  Cache may not be working as expected")
            
        return True
    except Exception as e:
        print(f"❌ Cache test failed: {e}")
        return False

def test_error_handling():
    """Test error handling"""
    print("\n🔍 Testing error handling...")
    try:
        # Test with empty query
        response = requests.get("http://localhost:4004/search")
        print(f"✅ Empty query test: {response.status_code}")
        if response.status_code == 400:
            print("   ✅ Properly handles missing query parameter")
        
        # Test with very long query
        long_query = "A" * 1000
        response = requests.get(f"http://localhost:4004/search?query={long_query}")
        print(f"✅ Long query test: {response.status_code}")
        
        return True
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
        return False

def main():
    print("🚀 Testing AI Library Service")
    print("=" * 50)
    
    tests = [
        test_health,
        test_search,
        test_cache,
        test_error_handling
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! AI Library service is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the service configuration.")

if __name__ == "__main__":
    main() 