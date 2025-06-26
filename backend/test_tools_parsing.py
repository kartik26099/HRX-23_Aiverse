#!/usr/bin/env python3
"""
Test script to debug tools and materials parsing
"""

import sys
import os

# Add the Ai DIy directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Ai DIy'))

def test_tools_parsing():
    """Test the tools and materials parsing"""
    
    # Sample project text that should contain tools and materials
    sample_project_text = """
PROJECT TITLE: Weather App

ESTIMATED TIME: 2 hours

DIFFICULTY LEVEL: Beginner

DOMAIN: Web Development

PROJECT OVERVIEW: Build a weather application that displays current weather information.

PREREQUISITES:
- Basic HTML/CSS knowledge
- JavaScript fundamentals

TOOLS & MATERIALS:
- React 18.2.0 (for building the user interface)
- Axios (for API calls)
- OpenWeatherMap API (for weather data)
- CSS Grid (for responsive layout)

LEARNING OBJECTIVES:
- API integration
- React component development
- Responsive design

PROJECT ROADMAP:
PHASE 1: Setup & Planning (30 minutes)
- Install React and dependencies
- Set up project structure

PHASE 2: API Integration (45 minutes)
- Configure OpenWeatherMap API
- Create API service functions

PHASE 3: UI Development (60 minutes)
- Build weather display components
- Implement responsive design

PHASE 4: Testing & Deployment (30 minutes)
- Test all features
- Deploy to hosting platform

SUCCESS CRITERIA:
- Weather data displays correctly
- Responsive design works on all devices
- API calls are successful
"""
    
    try:
        from app import parse_project_text
        
        print("🧪 Testing tools and materials parsing...")
        
        # Parse the sample text
        parsed_sections = parse_project_text(sample_project_text)
        
        print(f"📋 Parsed sections: {list(parsed_sections.keys())}")
        
        # Check for tools and materials
        tools_materials = parsed_sections.get('tools_materials', 'NOT_FOUND')
        print(f"🔧 Tools & Materials: {tools_materials}")
        
        if tools_materials and tools_materials != 'NOT_FOUND':
            print("✅ Tools and materials parsed successfully!")
        else:
            print("❌ Tools and materials not found in parsed sections")
            
        # Check raw text for tools section
        if 'TOOLS & MATERIALS:' in sample_project_text:
            print("✅ 'TOOLS & MATERIALS:' found in raw text")
        else:
            print("❌ 'TOOLS & MATERIALS:' not found in raw text")
            
    except Exception as e:
        print(f"❌ Error testing tools parsing: {str(e)}")

if __name__ == "__main__":
    test_tools_parsing() 