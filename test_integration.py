import requests
import json
import time

def test_backend():
    """Test the backend directly"""
    print("🧪 Testing Backend (Port 5001)")
    print("=" * 40)
    
    base_url = "http://localhost:5001/api"
    
    # Test health
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend Health: {data['status']}")
            print(f"   Supabase: {data['supabase_connected']}")
        else:
            print(f"❌ Backend Health Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend Health Error: {e}")
        return False
    
    # Test sentiment analysis
    try:
        response = requests.get(f"{base_url}/sentiment-analysis", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend Sentiment: Success")
            print(f"   Posts: {data['sentiment_data']['overall_stats']['total_posts']}")
        else:
            print(f"❌ Backend Sentiment Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend Sentiment Error: {e}")
    
    return True

def test_frontend_api():
    """Test the frontend API proxy"""
    print("\n🧪 Testing Frontend API (Port 3010)")
    print("=" * 40)
    
    base_url = "http://localhost:3010/api"
    
    # Test health through frontend
    try:
        response = requests.get(f"{base_url}/sentiment/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Frontend Health: {data['status']}")
            print(f"   Supabase: {data['supabase_connected']}")
        else:
            print(f"❌ Frontend Health Failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Frontend Health Error: {e}")
        return False
    
    # Test sentiment analysis through frontend
    try:
        response = requests.get(f"{base_url}/sentiment/sentiment-analysis", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Frontend Sentiment: Success")
            print(f"   Posts: {data['sentiment_data']['overall_stats']['total_posts']}")
        else:
            print(f"❌ Frontend Sentiment Failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Frontend Sentiment Error: {e}")
    
    # Test active users through frontend
    try:
        response = requests.get(f"{base_url}/active-users", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Frontend Active Users: {data['active_users']}")
        else:
            print(f"❌ Frontend Active Users Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Frontend Active Users Error: {e}")
    
    # Test force refresh through frontend
    try:
        response = requests.post(f"{base_url}/sentiment/force-refresh", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Frontend Force Refresh: {data['message']}")
        else:
            print(f"❌ Frontend Force Refresh Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Frontend Force Refresh Error: {e}")
    
    return True

def test_admin_dashboard():
    """Test the admin dashboard page"""
    print("\n🧪 Testing Admin Dashboard Page")
    print("=" * 40)
    
    try:
        response = requests.get("http://localhost:3010", timeout=10)
        if response.status_code == 200:
            print("✅ Admin Dashboard: Loaded successfully")
            if "DoLab Analytics" in response.text:
                print("✅ Admin Dashboard: Contains expected content")
            else:
                print("⚠️ Admin Dashboard: Content may be different")
        else:
            print(f"❌ Admin Dashboard Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Admin Dashboard Error: {e}")
        return False
    
    return True

def main():
    print("🚀 DoLab Sentiment Analysis Integration Test")
    print("=" * 50)
    
    # Wait a bit for servers to start
    print("⏳ Waiting 10 seconds for servers to start...")
    time.sleep(10)
    
    # Test backend
    backend_ok = test_backend()
    
    # Test frontend API
    frontend_ok = test_frontend_api()
    
    # Test admin dashboard
    dashboard_ok = test_admin_dashboard()
    
    print("\n" + "=" * 50)
    print("🎉 Integration Test Results")
    print("=" * 50)
    print(f"Backend: {'✅ PASS' if backend_ok else '❌ FAIL'}")
    print(f"Frontend API: {'✅ PASS' if frontend_ok else '❌ FAIL'}")
    print(f"Admin Dashboard: {'✅ PASS' if dashboard_ok else '❌ FAIL'}")
    
    if backend_ok and frontend_ok and dashboard_ok:
        print("\n🎉 All tests passed! Integration is working correctly.")
        print("\n📊 Access your system at:")
        print("   Backend: http://localhost:5001")
        print("   Admin Dashboard: http://localhost:3010")
    else:
        print("\n⚠️ Some tests failed. Check the logs above for details.")
    
    print("\nPress Enter to exit...")
    input()

if __name__ == "__main__":
    main() 