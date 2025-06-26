#!/usr/bin/env python3
"""
Backend Services Startup Script
Manages all AI platform backend services
"""

import os
import sys
import subprocess
import time
import signal
import threading
from typing import Dict, List
import json

class ServiceManager:
    def __init__(self):
        self.services = {
            'ai_advisor': {
                'path': 'ai advisor',
                'file': 'app.py',
                'port': 5274,
                'env_var': 'PORT_AI_ADVISOR',
                'description': 'AI Advisor Service'
            },
            'faculty': {
                'path': 'faculty',
                'file': 'main.py',
                'port': 4002,
                'env_var': 'PORT_FACULTY',
                'description': 'Faculty Service'
            },
            'research_helper': {
                'path': 'ai research helper',
                'file': 'app.py',
                'port': 4003,
                'env_var': 'PORT_RESEARCH_HELPER',
                'description': 'AI Research Helper Service'
            },
            'ai_library': {
                'path': 'ai library',
                'file': 'app.py',
                'port': 4004,
                'env_var': 'PORT_AI_LIBRARY',
                'description': 'AI Library Service'
            },
            'ai_placement': {
                'path': 'ai-placement',
                'file': 'app.py',
                'port': 4005,
                'env_var': 'PORT_AI_PLACEMENT',
                'description': 'AI Placement Service'
            },
            'diy_evaluator': {
                'path': 'diy_project_evaluator',
                'file': 'start_server.py',
                'port': 4006,
                'env_var': 'PORT_DIY_EVALUATOR',
                'description': 'DIY Project Evaluator Service'
            },
            'ai_course': {
                'path': 'ai course',
                'file': 'course.py',
                'port': 4007,
                'env_var': 'PORT_AI_COURSE',
                'description': 'AI Course Service'
            },
            'diy_scheduler': {
                'path': 'diy_scheduler',
                'file': 'app.py',
                'port': 4008,
                'env_var': 'PORT_DIY_SCHEDULER',
                'description': 'DIY Scheduler Service'
            },
            'ai_diy': {
                'path': 'Ai DIy',
                'file': 'app.py',
                'port': 4009,
                'env_var': 'PORT_AI_DIY',
                'description': 'AI DIY Service'
            }
        }
        
        self.processes: Dict[str, subprocess.Popen] = {}
        self.running = False
        
    def load_env(self):
        """Load environment variables from .env file"""
        env_file = os.path.join(os.path.dirname(__file__), '.env')
        if os.path.exists(env_file):
            with open(env_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ[key] = value
            print("[OK] Environment variables loaded from .env")
        else:
            print("[WARNING] No .env file found. Using system environment variables.")
    
    def check_service_files(self) -> List[str]:
        """Check which service files exist"""
        missing_services = []
        for service_name, config in self.services.items():
            service_path = os.path.join(os.path.dirname(__file__), config['path'], config['file'])
            if not os.path.exists(service_path):
                missing_services.append(service_name)
                print(f"[ERROR] Missing: {config['description']} ({service_path})")
            else:
                print(f"[OK] Found: {config['description']}")
        return missing_services
    
    def start_service(self, service_name: str) -> bool:
        """Start a single service"""
        if service_name not in self.services:
            print(f"[ERROR] Unknown service: {service_name}")
            return False
            
        config = self.services[service_name]
        service_path = os.path.join(os.path.dirname(__file__), config['path'])
        service_file = os.path.join(service_path, config['file'])
        
        if not os.path.exists(service_file):
            print(f"[ERROR] Service file not found: {service_file}")
            return False
        
        # Set port environment variable
        port = os.getenv(config['env_var'], str(config['port']))
        env = os.environ.copy()
        env['PORT'] = port
        
        try:
            print(f"[ROCKET] Starting {config['description']} on port {port}...")
            process = subprocess.Popen(
                [sys.executable, config['file']],
                cwd=service_path,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            self.processes[service_name] = process
            
            # Wait a moment to see if it starts successfully
            time.sleep(2)
            if process.poll() is None:
                print(f"[OK] {config['description']} started successfully (PID: {process.pid})")
                return True
            else:
                stdout, stderr = process.communicate()
                print(f"[ERROR] {config['description']} failed to start:")
                print(f"   STDOUT: {stdout}")
                print(f"   STDERR: {stderr}")
                return False
                
        except Exception as e:
            print(f"[ERROR] Error starting {config['description']}: {str(e)}")
            return False
    
    def stop_service(self, service_name: str):
        """Stop a single service"""
        if service_name in self.processes:
            process = self.processes[service_name]
            try:
                process.terminate()
                process.wait(timeout=5)
                print(f"[STOP] Stopped {self.services[service_name]['description']}")
            except subprocess.TimeoutExpired:
                process.kill()
                print(f"[KILL] Force killed {self.services[service_name]['description']}")
            except Exception as e:
                print(f"[ERROR] Error stopping {service_name}: {str(e)}")
            finally:
                del self.processes[service_name]
    
    def start_all_services(self, services_to_start: List[str] = None):
        """Start all services or specified services"""
        if services_to_start is None:
            # Exclude ai_placement by default
            services_to_start = [name for name in self.services.keys() if name != 'ai_placement']
        
        print(f"[ROCKET] Starting {len(services_to_start)} services...")
        
        for service_name in services_to_start:
            if service_name in self.services:
                self.start_service(service_name)
                time.sleep(1)  # Small delay between starts
    
    def start_all_except_placement(self):
        """Start all services except ai_placement"""
        services_to_start = [name for name in self.services.keys() if name != 'ai_placement']
        self.start_all_services(services_to_start)
    
    def stop_all_services(self):
        """Stop all running services"""
        print("[STOP] Stopping all services...")
        for service_name in list(self.processes.keys()):
            self.stop_service(service_name)
    
    def show_status(self):
        """Show status of all services"""
        print("\n[CHART] Service Status:")
        print("-" * 60)
        
        for service_name, config in self.services.items():
            status = "[GREEN] Running" if service_name in self.processes else "[RED] Stopped"
            port = os.getenv(config['env_var'], str(config['port']))
            print(f"{config['description']:<25} | Port: {port:<5} | {status}")
        
        if self.processes:
            print(f"\n[UP] Running processes: {len(self.processes)}")
            for service_name, process in self.processes.items():
                print(f"   - {self.services[service_name]['description']} (PID: {process.pid})")
    
    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        print(f"\n[STOP] Received signal {signum}, shutting down...")
        self.stop_all_services()
        sys.exit(0)

def main():
    manager = ServiceManager()
    
    # Load environment variables
    manager.load_env()
    
    # Check service files
    print("[SEARCH] Checking service files...")
    missing_services = manager.check_service_files()
    
    if missing_services:
        print(f"\n[WARNING] {len(missing_services)} services are missing files")
    
    # Set up signal handlers
    signal.signal(signal.SIGINT, manager.signal_handler)
    signal.signal(signal.SIGTERM, manager.signal_handler)
    
    # Parse command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'start':
            services = sys.argv[2:] if len(sys.argv) > 2 else None
            manager.start_all_services(services)
            manager.show_status()
            
            # Keep running to maintain services
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                manager.signal_handler(signal.SIGINT, None)
        
        elif command == 'start-all':
            # Start all services except ai_placement
            manager.start_all_except_placement()
            manager.show_status()
            
            # Keep running to maintain services
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                manager.signal_handler(signal.SIGINT, None)
                
        elif command == 'stop':
            manager.stop_all_services()
            
        elif command == 'status':
            manager.show_status()
            
        elif command == 'restart':
            services = sys.argv[2:] if len(sys.argv) > 2 else None
            manager.stop_all_services()
            time.sleep(2)
            manager.start_all_services(services)
            manager.show_status()
            
        else:
            print(f"[ERROR] Unknown command: {command}")
            print_usage()
    else:
        print_usage()

def print_usage():
    print("""
[ROBOT] AI Platform Backend Service Manager

Usage:
  python start_services.py start-all                        # Start all services except ai_placement (recommended)
  python start_services.py start [service1] [service2] ...  # Start specific services (excludes ai_placement by default)
  python start_services.py stop                             # Stop all services
  python start_services.py restart [service1] [service2] ... # Restart all services or specific ones
  python start_services.py status                           # Show service status

Available services:
  ai_advisor      - AI Advisor Service (Port 5274)
  faculty         - Faculty Service (Port 4002)
  research_helper - AI Research Helper Service (Port 4003)
  ai_library      - AI Library Service (Port 4004)
  ai_placement    - AI Placement Service (Port 4005) - Excluded by default
  diy_evaluator   - DIY Project Evaluator Service (Port 4006)
  ai_course       - AI Course Service (Port 4007)
  diy_scheduler   - DIY Scheduler Service (Port 4008)
  ai_diy          - AI DIY Service (Port 4009)

Examples:
  python start_services.py start-all                        # Start all services except ai_placement
  python start_services.py start ai_library                 # Start only AI Library
  python start_services.py start ai_library faculty         # Start AI Library and Faculty
  python start_services.py start ai_placement               # Start only ai_placement (if needed)
  python start_services.py status                           # Check status
  python start_services.py stop                             # Stop all services
""")

if __name__ == '__main__':
    main() 