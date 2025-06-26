#!/usr/bin/env python3
"""
Startup script for the DIY Project Evaluator FastAPI server
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get port from environment or use default
    port = int(os.getenv("PORT", 4006))
    print(f"[ROCKET] DIY Project Evaluator Service starting on port {port}...")
    
    # Run the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )