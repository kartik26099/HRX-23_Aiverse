import requests
import json
import time

def test_server():
    base_url = "http://localhost:5001"
    
    print("🧪 Testing Community Sentiment Analyzer")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n1️⃣ Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health Check: {data['status']}")
            print(f"   Supabase Connected: {data['supabase_connected']}")
            print(f"   Cache Exists: {data['cache_exists']}")
        else:
            print(f"❌ Health Check Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health Check Error: {e}")
        return False
    
    # Test 2: Sentiment Analysis
    print("\n2️⃣ Testing Sentiment Analysis...")
    try:
        response = requests.get(f"{base_url}/api/sentiment-analysis", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Sentiment Analysis: Success")
            print(f"   Posts: {data['sentiment_data']['overall_stats']['total_posts']}")
            print(f"   Comments: {data['sentiment_data']['overall_stats']['total_comments']}")
            print(f"   Cache Age: {data.get('cache_age', 'N/A')}")
        else:
            print(f"❌ Sentiment Analysis Failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Sentiment Analysis Error: {e}")
    
    # Test 3: Active Users
    print("\n3️⃣ Testing Active Users...")
    try:
        response = requests.get(f"{base_url}/api/active-users", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Active Users: {data['active_users']}")
        else:
            print(f"❌ Active Users Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Active Users Error: {e}")
    
    # Test 4: Test Sentiment
    print("\n4️⃣ Testing Sentiment Analysis Function...")
    try:
        test_text = "This is a great platform! I love using it."
        response = requests.post(f"{base_url}/api/test-sentiment", 
                               json={"text": test_text}, 
                               timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Test Sentiment: {data['sentiment']}")
            print(f"   Text: {data['text']}")
        else:
            print(f"❌ Test Sentiment Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Test Sentiment Error: {e}")
    
    # Test 5: Force Refresh
    print("\n5️⃣ Testing Force Refresh...")
    try:
        response = requests.post(f"{base_url}/api/force-refresh", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Force Refresh: {data['message']}")
            print(f"   Posts: {data['data_summary']['total_posts']}")
            print(f"   Comments: {data['data_summary']['total_comments']}")
        else:
            print(f"❌ Force Refresh Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Force Refresh Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Testing Complete!")
    return True

if __name__ == "__main__":
    test_server() 