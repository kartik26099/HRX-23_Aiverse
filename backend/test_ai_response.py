#!/usr/bin/env python3
"""
Test script to see what the AI is generating for tools and materials
"""

import sys
import os

# Add the Ai DIy directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Ai DIy'))

def test_ai_response():
    """Test the AI response generation"""
    
    try:
        from app import model
        
        if not model:
            print("❌ AI model not available")
            return
            
        # Simple test prompt
        test_prompt = """
You are an AI-powered DIY project mentor. Generate a simple project with tools and materials.

PROJECT TITLE: Simple Weather App

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

EXTENSIONS & NEXT STEPS:
- Add location-based weather
- Include weather forecasts
- Add weather alerts

Please generate a similar project structure with specific tools and materials for a "Todo List App".
        """
        
        print("🤖 Testing AI response generation...")
        
        response = model.generate_content(test_prompt)
        project_text = response.text.strip()
        
        print(f"📝 AI Response Length: {len(project_text)}")
        print(f"📝 First 1000 characters:")
        print(project_text[:1000])
        print("\n" + "="*50)
        print("🔍 Looking for TOOLS & MATERIALS section...")
        
        if 'TOOLS & MATERIALS:' in project_text:
            print("✅ Found 'TOOLS & MATERIALS:' in response")
            # Find the tools section
            tools_start = project_text.find('TOOLS & MATERIALS:')
            tools_end = project_text.find('\n\n', tools_start)
            if tools_end == -1:
                tools_end = len(project_text)
            
            tools_section = project_text[tools_start:tools_end]
            print(f"🔧 Tools section: {tools_section}")
        else:
            print("❌ 'TOOLS & MATERIALS:' not found in response")
            
    except Exception as e:
        print(f"❌ Error testing AI response: {str(e)}")

if __name__ == "__main__":
    test_ai_response() 