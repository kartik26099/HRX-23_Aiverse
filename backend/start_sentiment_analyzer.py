#!/usr/bin/env python3
"""
Startup script for the Community Sentiment Analyzer
This script manages the sentiment analysis service and can restart it when needed.
"""

import os
import sys
import subprocess
import time
import signal
import requests
from pathlib import Path

# Configuration
SENTIMENT_ANALYZER_PORT = 5001
SENTIMENT_ANALYZER_PATH = Path(__file__).parent / "community_sentiment_analyzer"
SENTIMENT_ANALYZER_APP = SENTIMENT_ANALYZER_PATH / "app.py"

class SentimentAnalyzerManager:
    def __init__(self):
        self.process = None
        self.is_running = False
        
    def start_service(self):
        """Start the sentiment analyzer service"""
        try:
            print("Starting Community Sentiment Analyzer...")
            
            # Change to the sentiment analyzer directory
            os.chdir(SENTIMENT_ANALYZER_PATH)
            
            # Set environment variables if not already set
            env = os.environ.copy()
            if 'PORT' not in env:
                env['PORT'] = str(SENTIMENT_ANALYZER_PORT)
            
            # Start the Flask app
            self.process = subprocess.Popen([
                sys.executable, "app.py"
            ], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            
            self.is_running = True
            print(f"Sentiment Analyzer started with PID: {self.process.pid}")
            
            # Wait a moment for the service to start
            time.sleep(3)
            
            # Check if service is responding
            if self.check_service_health():
                print("✅ Sentiment Analyzer is running and healthy")
                return True
            else:
                print("❌ Sentiment Analyzer failed to start properly")
                return False
                
        except Exception as e:
            print(f"Error starting sentiment analyzer: {e}")
            return False
    
    def stop_service(self):
        """Stop the sentiment analyzer service"""
        if self.process and self.is_running:
            try:
                print("Stopping Sentiment Analyzer...")
                self.process.terminate()
                self.process.wait(timeout=10)
                self.is_running = False
                print("✅ Sentiment Analyzer stopped")
            except subprocess.TimeoutExpired:
                print("Force killing Sentiment Analyzer...")
                self.process.kill()
                self.is_running = False
            except Exception as e:
                print(f"Error stopping sentiment analyzer: {e}")
    
    def restart_service(self):
        """Restart the sentiment analyzer service"""
        print("🔄 Restarting Sentiment Analyzer...")
        self.stop_service()
        time.sleep(2)
        return self.start_service()
    
    def check_service_health(self):
        """Check if the service is healthy"""
        try:
            response = requests.get(f"http://localhost:{SENTIMENT_ANALYZER_PORT}/api/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def trigger_analysis_refresh(self):
        """Trigger a fresh sentiment analysis"""
        try:
            response = requests.post(f"http://localhost:{SENTIMENT_ANALYZER_PORT}/api/webhook/database-change", timeout=5)
            if response.status_code == 200:
                print("✅ Analysis refresh triggered")
                return True
            else:
                print("❌ Failed to trigger analysis refresh")
                return False
        except Exception as e:
            print(f"Error triggering analysis refresh: {e}")
            return False

def main():
    """Main function to manage the sentiment analyzer"""
    manager = SentimentAnalyzerManager()
    
    # Handle graceful shutdown
    def signal_handler(signum, frame):
        print("\n🛑 Shutting down Sentiment Analyzer...")
        manager.stop_service()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start the service
    if not manager.start_service():
        print("Failed to start sentiment analyzer")
        sys.exit(1)
    
    print("\n" + "="*50)
    print("Community Sentiment Analyzer is running!")
    print(f"Dashboard: http://localhost:3002")
    print(f"API Health: http://localhost:{SENTIMENT_ANALYZER_PORT}/api/health")
    print("="*50)
    print("\nCommands:")
    print("  'restart' - Restart the service")
    print("  'refresh' - Trigger fresh analysis")
    print("  'health'  - Check service health")
    print("  'quit'    - Stop the service")
    print("="*50)
    
    # Command loop
    try:
        while True:
            command = input("\nEnter command: ").strip().lower()
            
            if command == 'restart':
                manager.restart_service()
            elif command == 'refresh':
                manager.trigger_analysis_refresh()
            elif command == 'health':
                if manager.check_service_health():
                    print("✅ Service is healthy")
                else:
                    print("❌ Service is not responding")
            elif command == 'quit':
                break
            else:
                print("Unknown command. Use: restart, refresh, health, or quit")
                
    except KeyboardInterrupt:
        pass
    finally:
        manager.stop_service()

if __name__ == "__main__":
    main() 