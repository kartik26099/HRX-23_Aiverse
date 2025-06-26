#!/usr/bin/env python3
"""
Test script to verify timeline generation dynamics
"""

import sys
import os
import json

# Add the Ai DIy directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Ai DIy'))

def test_timeline_dynamics():
    """Test timeline generation to see if it's truly dynamic"""
    
    try:
        from app import generate_timeline_from_roadmap, calculate_phase_times
        
        print("🔍 Testing timeline generation dynamics...")
        
        # Test different project complexities
        test_cases = [
            {
                "name": "Simple Todo App",
                "project_data": {
                    "project_title": "Simple Todo App",
                    "project_overview": "A basic todo list application with add, delete, and mark complete functionality.",
                    "project_roadmap": "PHASE 1: Setup (30 min)\nPHASE 2: Build (60 min)\nPHASE 3: Test (30 min)"
                },
                "available_time": "2 hours"
            },
            {
                "name": "Complex E-commerce Platform",
                "project_data": {
                    "project_title": "Full E-commerce Platform",
                    "project_overview": "A comprehensive e-commerce platform with user authentication, product catalog, shopping cart, payment processing, order management, and admin dashboard.",
                    "project_roadmap": "PHASE 1: Planning & Design (2 hours)\nPHASE 2: User Auth & Database (3 hours)\nPHASE 3: Product Catalog (2 hours)\nPHASE 4: Shopping Cart (2 hours)\nPHASE 5: Payment Integration (2 hours)\nPHASE 6: Order Management (2 hours)\nPHASE 7: Admin Dashboard (2 hours)\nPHASE 8: Testing & Deployment (1 hour)"
                },
                "available_time": "16 hours"
            },
            {
                "name": "Medium Weather App",
                "project_data": {
                    "project_title": "Weather Dashboard",
                    "project_overview": "A weather application with API integration, data visualization, location services, and forecast features.",
                    "project_roadmap": "PHASE 1: Setup & API (45 min)\nPHASE 2: Core Features (90 min)\nPHASE 3: UI/UX (60 min)\nPHASE 4: Testing (45 min)"
                },
                "available_time": "4 hours"
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n📊 Test Case {i}: {test_case['name']}")
            print(f"   Time: {test_case['available_time']}")
            print(f"   Complexity: {'High' if 'Complex' in test_case['name'] else 'Medium' if 'Medium' in test_case['name'] else 'Low'}")
            
            try:
                timeline = generate_timeline_from_roadmap(
                    test_case['project_data'], 
                    test_case['available_time']
                )
                
                if timeline:
                    print(f"   ✅ Timeline generated with {len(timeline)} steps")
                    for j, step in enumerate(timeline, 1):
                        print(f"     Step {j}: {step.get('title', 'N/A')} ({step.get('duration', 'N/A')})")
                else:
                    print(f"   ❌ No timeline generated")
                    
            except Exception as e:
                print(f"   ⚠️  Timeline generation failed: {str(e)}")
        
        print(f"\n🔍 Analysis:")
        print(f"   If all timelines have 4 steps, the AI is not being truly dynamic")
        print(f"   Complex projects should have 6-8 steps")
        print(f"   Simple projects should have 3-4 steps")
        print(f"   Medium projects should have 4-6 steps")
        
    except Exception as e:
        print(f"❌ Error in timeline dynamics test: {str(e)}")

if __name__ == "__main__":
    test_timeline_dynamics() 