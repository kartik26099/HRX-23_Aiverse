#!/usr/bin/env python3
"""
Test script to check if backend services are accessible
"""

import requests
import time

def test_service(url, service_name):
    """Test if a service is accessible"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print(f"✅ {service_name}: {url} - Status: {response.status_code}")
            return True
        else:
            print(f"❌ {service_name}: {url} - Status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ {service_name}: {url} - Connection refused")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ {service_name}: {url} - Timeout")
        return False
    except Exception as e:
        print(f"❌ {service_name}: {url} - Error: {str(e)}")
        return False

def main():
    print("🔍 Testing Backend Services...")
    print("=" * 50)
    
    # Test all backend services
    SERVICES = {
        "AI Advisor": "http://localhost:4001/test",
        "Faculty": "http://localhost:4002/test", 
        "AI Research Helper": "http://localhost:4003/health",
        "AI Library": "http://localhost:4004/test",
        "AI Placement": "http://localhost:4005/test",
        "DIY Project Evaluator": "http://localhost:4006/health",
        "AI Course": "http://localhost:4007/test",
        "DIY Scheduler": "http://localhost:4008/health",
        "AI DIY": "http://localhost:4009/test"
    }
    
    successful = 0
    total = len(SERVICES)
    
    for name, url in SERVICES.items():
        if test_service(url, name):
            successful += 1
        time.sleep(0.5)  # Small delay between tests
    
    print("=" * 50)
    print(f"📊 Results: {successful}/{total} services accessible")
    
    if successful == total:
        print("🎉 All services are running and accessible!")
        print("✅ Your frontend should now work properly.")
    else:
        print("⚠️  Some services are not accessible.")
        print("💡 Make sure you're running: python start_services.py start-all")
        print("💡 And keep the terminal open!")

if __name__ == "__main__":
    main() 