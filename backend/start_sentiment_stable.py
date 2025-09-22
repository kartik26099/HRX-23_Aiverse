#!/usr/bin/env python3
"""
Stable startup script for Community Sentiment Analyzer
"""

import os
import sys
import time
import signal
import subprocess
from pathlib import Path

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    print("\n🛑 Shutting down sentiment analyzer...")
    sys.exit(0)

def check_port_available(port):
    """Check if a port is available"""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('localhost', port))
            return True
    except OSError:
        return False

def kill_process_on_port(port):
    """Kill any process using the specified port"""
    try:
        if os.name == 'nt':  # Windows
            result = subprocess.run(
                ['netstat', '-ano'], 
                capture_output=True, 
                text=True, 
                shell=True
            )
            lines = result.stdout.split('\n')
            for line in lines:
                if f':{port}' in line and 'LISTENING' in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        subprocess.run(['taskkill', '/PID', pid, '/F'], shell=True)
                        print(f"🔪 Killed process {pid} on port {port}")
        else:  # Unix/Linux
            result = subprocess.run(
                ['lsof', '-ti', f':{port}'], 
                capture_output=True, 
                text=True
            )
            if result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    subprocess.run(['kill', '-9', pid])
                    print(f"🔪 Killed process {pid} on port {port}")
    except Exception as e:
        print(f"⚠️  Could not kill process on port {port}: {e}")

def main():
    """Main startup function"""
    print("🚀 Starting DoLab Community Sentiment Analyzer")
    print("=" * 50)
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Check and clear port 5001
    port = 5001
    if not check_port_available(port):
        print(f"⚠️  Port {port} is in use. Attempting to kill existing process...")
        kill_process_on_port(port)
        time.sleep(2)  # Wait for process to be killed
    
    if not check_port_available(port):
        print(f"❌ Port {port} is still in use. Please manually kill the process.")
        sys.exit(1)
    
    print(f"✅ Port {port} is available")
    
    # Change to the sentiment analyzer directory
    sentiment_dir = Path(__file__).parent / 'community_sentiment_analyzer'
    os.chdir(sentiment_dir)
    
    # Set environment variables
    env = os.environ.copy()
    env['PYTHONUNBUFFERED'] = '1'
    env['FLASK_ENV'] = 'production'
    
    print(f"📁 Working directory: {os.getcwd()}")
    print(f"🔧 Environment: {env.get('FLASK_ENV', 'development')}")
    
    try:
        # Start the Flask app
        print("🔄 Starting Flask application...")
        subprocess.run([
            sys.executable, 'app.py'
        ], env=env, check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Flask application failed to start: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutdown requested by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 