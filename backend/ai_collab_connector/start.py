#!/usr/bin/env python3
"""
AI Collab Connector Startup Script
Starts the collaboration service with proper configuration
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    print("🤝 Starting AI Collab Connector...")
    
    # Set the working directory to the script's location
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)
    
    # Set environment variables
    os.environ['FLASK_ENV'] = 'development'
    os.environ['FLASK_DEBUG'] = '1'
    
    # Default port
    port = os.getenv('PORT', '4011')
    
    print(f"📍 Working directory: {script_dir}")
    print(f"🌐 Service will run on port: {port}")
    print(f"🔧 Environment: {os.environ.get('FLASK_ENV', 'production')}")
    
    try:
        # Start the Flask application
        from app import app
        print("✅ Flask app imported successfully")
        
        print(f"🚀 Starting server on port {port}...")
        app.run(
            host='0.0.0.0',
            port=int(port),
            debug=True,
            use_reloader=True
        )
        
    except ImportError as e:
        print(f"❌ Failed to import Flask app: {e}")
        print("💡 Make sure all dependencies are installed:")
        print("   pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 