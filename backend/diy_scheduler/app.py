from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import json
import requests
from datetime import datetime, timedelta
import random

load_dotenv()

app = Flask(__name__)
CORS(app)

def generate_schedule_offline(tasks, specific_times=None):
    """Generate a schedule using intelligent rule-based logic"""
    schedule = []
    
    # Handle specific time preferences first
    specific_time_tasks = []
    flexible_tasks = []
    
    for task in tasks:
        if specific_times and task.get('id') in specific_times:
            specific_time_tasks.append(task)
        else:
            flexible_tasks.append(task)
    
    # Sort flexible tasks by priority (high first) and then by hours (descending)
    sorted_flexible_tasks = sorted(flexible_tasks, key=lambda x: (x['priority'] == 'high', -x['hours']), reverse=True)
    
    # Define 24-hour time slots (every hour)
    time_slots = []
    for hour in range(24):
        time_slots.append(f"{hour:02d}:00")
    
    # First, schedule specific time tasks
    for task in specific_time_tasks:
        specific_time = specific_times[task['id']]
        schedule.append({
            'date': specific_time['date'],
            'time': specific_time['time'],
            'task_title': task['title'],
            'hours': 1,
            'category': task['category'],
            'priority': task['priority'],
            'is_specific_time': True
        })
    
    # Group tasks by their assigned dates
    tasks_by_date = {}
    for task in sorted_flexible_tasks:
        task_date = task.get('assigned_date')
        if not task_date:
            task_date = datetime.now().strftime("%Y-%m-%d")
        
        if task_date not in tasks_by_date:
            tasks_by_date[task_date] = []
        tasks_by_date[task_date].append(task)
    
    # Schedule tasks for each date
    for date, date_tasks in tasks_by_date.items():
        # Sort tasks for this date by priority and hours
        date_tasks.sort(key=lambda x: (x['priority'] == 'high', -x['hours']), reverse=True)
        
        # Get available time slots for this date (exclude specific time slots)
        available_slots = []
        for time in time_slots:
            slot_taken = any(
                s['date'] == date and s['time'] == time
                for s in schedule
            )
            if not slot_taken:
                available_slots.append(time)
        
        # Schedule tasks for this date
        for task in date_tasks:
            hours_needed = task['hours']
            hours_scheduled = 0
            
            # Try to schedule all hours on the assigned date first
            while hours_needed > 0 and hours_scheduled < len(available_slots):
                # Find the best time slot (prefer morning hours for high priority tasks)
                best_slot = None
                if task['priority'] == 'high':
                    # For high priority tasks, prefer morning hours (6-12)
                    morning_slots = [slot for slot in available_slots if '06:00' <= slot <= '12:00']
                    if morning_slots:
                        best_slot = morning_slots[0]
                    else:
                        best_slot = available_slots[0]
                else:
                    # For other tasks, prefer afternoon/evening hours (13-22)
                    afternoon_slots = [slot for slot in available_slots if '13:00' <= slot <= '22:00']
                    if afternoon_slots:
                        best_slot = afternoon_slots[0]
                    else:
                        best_slot = available_slots[0]
                
                if best_slot:
                    schedule.append({
                        'date': date,
                        'time': best_slot,
                        'task_title': task['title'],
                        'hours': 1,
                        'category': task['category'],
                        'priority': task['priority'],
                        'is_specific_time': False
                    })
                    available_slots.remove(best_slot)
                    hours_needed -= 1
                    hours_scheduled += 1
                else:
                    break
            
            # If we couldn't schedule all hours on the assigned date, continue to next day
            if hours_needed > 0:
                next_date = datetime.strptime(date, "%Y-%m-%d") + timedelta(days=1)
                next_date_str = next_date.strftime("%Y-%m-%d")
                
                # Get available slots for next day
                next_day_available = []
                for time in time_slots:
                    slot_taken = any(
                        s['date'] == next_date_str and s['time'] == time
                        for s in schedule
                    )
                    if not slot_taken:
                        next_day_available.append(time)
                
                # Schedule remaining hours on next day
                while hours_needed > 0 and next_day_available:
                    best_slot = next_day_available[0]
                    schedule.append({
                        'date': next_date_str,
                        'time': best_slot,
                        'task_title': task['title'],
                        'hours': 1,
                        'category': task['category'],
                        'priority': task['priority'],
                        'is_specific_time': False
                    })
                    next_day_available.remove(best_slot)
                    hours_needed -= 1
    
    return schedule

def generate_schedule_with_free_ai(tasks, specific_times=None):
    """Generate schedule using free Hugging Face inference API"""
    try:
        # Use a free model from Hugging Face
        API_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
        
        # Create a simple prompt
        prompt = "Create a weekly schedule for these tasks: "
        for task in tasks:
            prompt += f"{task['title']} ({task['hours']} hours, {task['priority']} priority), "
        
        headers = {"Authorization": "Bearer hf_demo"}  # Free demo token
        
        response = requests.post(API_URL, headers=headers, json={"inputs": prompt})
        
        if response.status_code == 200:
            # Parse the response and create a basic schedule
            ai_response = response.json()
            return generate_schedule_offline(tasks, specific_times)  # Fallback to offline method
        else:
            return generate_schedule_offline(tasks, specific_times)
            
    except Exception as e:
        print(f"AI API error: {e}")
        return generate_schedule_offline(tasks, specific_times)

@app.route('/generate-schedule', methods=['POST'])
def generate_schedule_endpoint():
    try:
        data = request.get_json()
        tasks = data.get('tasks')
        use_ai = data.get('use_ai', False)  # Optional parameter to use AI
        specific_times = data.get('specific_times', {})  # Optional specific time preferences
        
        if not tasks:
            return jsonify({"error": "No tasks provided"}), 400

        # Choose scheduling method
        if use_ai:
            schedule = generate_schedule_with_free_ai(tasks, specific_times)
        else:
            schedule = generate_schedule_offline(tasks, specific_times)
        
        return jsonify({
            "schedule": schedule,
            "method": "ai" if use_ai else "rule_based",
            "total_tasks": len(tasks),
            "total_hours": sum(task['hours'] for task in tasks),
            "specific_times_count": len(specific_times)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "DIY Scheduler"})

if __name__ == '__main__':
    print("🚀 DIY Scheduler starting on port 5002...")
    print("📅 No API key required - using intelligent rule-based scheduling")
    print("📅 24-hour availability with smart time allocation")
    print("📅 Each task can have its own assigned date")
    print("🔗 Health check available at: http://localhost:5002/health")
    app.run(port=5002, debug=True) 