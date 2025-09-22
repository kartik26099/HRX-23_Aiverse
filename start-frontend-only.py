#!/usr/bin/env python3
"""
Simple startup script for frontend-only deployment
This serves the Next.js frontend without the Flask backend
"""

import os
import subprocess
import sys
from pathlib import Path

def start_frontend():
    """Start the Next.js frontend application"""
    try:
        print("🎨 Starting Next.js frontend...")
        
        # Change to frontend directory
        frontend_path = Path(__file__).parent / "frontend"
        os.chdir(frontend_path)
        
        # Check if node_modules exists
        if not (frontend_path / "node_modules").exists():
            print("📦 Installing frontend dependencies...")
            subprocess.run(["npm", "install"], check=True)
        
        # Start Next.js in production mode
        print("🚀 Starting Next.js production server...")
        subprocess.run([
            "npm", "run", "start"
        ], check=True)
        
    except Exception as e:
        print(f"❌ Error starting Next.js app: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🌟 Starting Hackronyx Frontend on Azure...")
    print(f"📍 Working directory: {os.getcwd()}")
    print(f"🌍 Environment: {os.getenv('FLASK_ENV', 'production')}")
    
    # Check if we're in Azure App Service
    if os.getenv('WEBSITE_SITE_NAME'):
        print("☁️ Running in Azure App Service")
        print(f"🌐 Site name: {os.getenv('WEBSITE_SITE_NAME')}")
    
    start_frontend()
