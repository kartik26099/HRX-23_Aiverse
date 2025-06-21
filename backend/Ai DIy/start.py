#!/usr/bin/env python3
"""
Startup script for the AI DIY Project Generator backend
"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Set default environment variables if not already set
os.environ.setdefault('FLASK_ENV', 'development')
os.environ.setdefault('FLASK_DEBUG', '1')

# Import and run the Flask app
from app import app

if __name__ == '__main__':
    print("🚀 Starting AI DIY Project Generator Backend...")
    print("📍 Backend URL: http://localhost:5000")
    print("🔗 API Endpoints:")
    print("   - POST /api/generate-roadmap")
    print("   - POST /api/extract-video-id")
    print("   - POST /api/get-transcript")
    print("   - GET  /health")
    print("=" * 50)
    
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000,
        use_reloader=True
    ) 