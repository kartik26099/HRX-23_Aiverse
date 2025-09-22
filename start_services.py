#!/usr/bin/env python3
"""
Azure App Service startup script for Hackronyx project
This script starts both the Flask backend and serves the Next.js frontend
"""

import os
import sys
import subprocess
import threading
import time
import signal
from pathlib import Path

# Add the backend directory to Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

def start_flask_app():
    """Start the Flask backend application"""
    try:
        print("🚀 Starting Flask backend...")
        
        # Change to backend directory
        os.chdir(backend_path)
        
        # Set Flask environment
        os.environ['FLASK_APP'] = 'app.py'
        os.environ['FLASK_ENV'] = os.getenv('FLASK_ENV', 'production')
        
        # Import and run the Flask app
        from app import app
        app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=False)
        
    except Exception as e:
        print(f"❌ Error starting Flask app: {e}")
        sys.exit(1)

def start_nextjs_app():
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
        subprocess.run([
            "npm", "run", "start"
        ], check=True)
        
    except Exception as e:
        print(f"❌ Error starting Next.js app: {e}")
        # Don't exit, just log the error as backend can work without frontend

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    print(f"\n🛑 Received signal {signum}, shutting down...")
    sys.exit(0)

def main():
    """Main startup function"""
    print("🌟 Starting Hackronyx Application on Azure...")
    print(f"📍 Working directory: {os.getcwd()}")
    print(f"🐍 Python version: {sys.version}")
    print(f"🌍 Environment: {os.getenv('FLASK_ENV', 'production')}")
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Check if we're in Azure App Service
    if os.getenv('WEBSITE_SITE_NAME'):
        print("☁️ Running in Azure App Service")
        print(f"🌐 Site name: {os.getenv('WEBSITE_SITE_NAME')}")
        print(f"🔧 Resource group: {os.getenv('WEBSITE_RESOURCE_GROUP')}")
    
    # Start Flask backend in the main thread
    # (Azure App Service expects the main process to be the web server)
    start_flask_app()

if __name__ == "__main__":
    main()
