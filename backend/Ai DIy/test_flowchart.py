#!/usr/bin/env python3
"""
Test script for OpenRouter flowchart generation
"""

import requests
import json
import os

# OpenRouter API credentials
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', "sk-or-v1-1234567890abcdef")  # Replace with your actual key
OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct:free"

def test_openrouter_flowchart():
    """Test OpenRouter API for flowchart generation"""
    
    # Sample project description
    project_description = """
    Project: Build a Weather App
    
    This project involves the following workflow:
    
    Phase 1 - Setup and Planning:
    - Project initialization and environment setup
    - Gathering required tools and materials: React, Node.js, Weather API
    - Understanding project requirements and objectives
    
    Phase 2 - Development Process:
    Day 1: Project Setup
    - Tasks: Initialize React app, install dependencies, set up project structure
    - Duration: 2-3 hours
    
    Day 2: API Integration
    - Tasks: Set up Weather API, create API service, handle API responses
    - Duration: 3-4 hours
    
    Day 3: UI Development
    - Tasks: Create weather display components, implement responsive design
    - Duration: 4-5 hours
    
    Phase 3 - Testing and Refinement:
    - Testing the implemented features
    - Debugging and fixing issues
    - Performance optimization
    
    Phase 4 - Finalization:
    - Final testing and validation
    - Documentation and cleanup
    - Project completion and delivery
    
    The process follows a systematic approach from initial setup through development, testing, and final delivery.
    """
    
    # System prompt for flowchart generation
    system_prompt = """
    You are a visual design expert specializing in creating beautiful, modern, and highly readable flowcharts using the Graphviz DOT language.
    Your goal is to transform user text into a professional and aesthetically pleasing diagram.

    *MANDATORY DOT STRUCTURE AND STYLE GUIDE:*

    1.  *Overall Graph:*
        -   Use rankdir=TB; for a top-to-bottom flow.
        -   Set a soft background color: bgcolor="#f7f9f9";
        -   Use curved lines for a smoother look: splines=ortho;
        -   Ensure good spacing between node layers and nodes: nodesep=0.6; ranksep=0.8;

    2.  *Default Node Style (for all nodes):*
        -   shape=box, style="filled,rounded", fontname="Helvetica", penwidth=1.5, color="#34495e"

    3.  *Default Edge Style (for all arrows):*
        -   color="#34495e", penwidth=1.5, arrowsize=0.9, fontname="Helvetica"

    4.  *Specific Node Types (use these fill colors and shapes):*
        -   *Start/End Nodes:* Use shape=ellipse and fillcolor="#a2d9ce" (Mint Green).
        -   *Process/Action Nodes:* Use shape=box and fillcolor="#aed6f1" (Sky Blue).
        -   *Decision Nodes (if/then):* Use shape=diamond and fillcolor="#fdebd0" (Pale Orange).
        -   *Error/Stop/Negative Outcome Nodes:* Use shape=box and fillcolor="#f5b7b1" (Soft Red).
        -   *Database/Data Nodes:* Use shape=cylinder and fillcolor="#d7dbdd" (Light Grey).

    *YOUR TASK:*
    Analyze the user's text. Generate ONLY the DOT language code that implements the described process using the styles defined above. Keep labels concise. Enclose the final code in a single markdown block.
    """
    
    # Generate flowchart using OpenRouter API
    openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "DIY Project Generator"
    }
    
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": project_description}
        ],
        "temperature": 0.1,
        "max_tokens": 1500
    }
    
    print("Testing OpenRouter API...")
    print(f"Model: {OPENROUTER_MODEL}")
    print(f"API Key: {OPENROUTER_API_KEY[:10]}...")
    
    try:
        response = requests.post(openrouter_url, headers=headers, json=payload, timeout=60)
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            dot_string = response_data['choices'][0]['message']['content'].strip()
            
            print("✅ OpenRouter API test successful!")
            print("\nGenerated DOT code:")
            print("=" * 50)
            print(dot_string)
            print("=" * 50)
            
            return True
        else:
            print(f"❌ OpenRouter API error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing OpenRouter API: {str(e)}")
        return False

if __name__ == "__main__":
    test_openrouter_flowchart() 