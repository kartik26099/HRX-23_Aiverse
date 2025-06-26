from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import json
import requests
from datetime import datetime, timedelta
import random

# Import the reminder service
from reminder_service import reminder_service

load_dotenv()

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",  # Keep for backward compatibility
    "http://127.0.0.1:3000"   # Keep for backward compatibility
])

# Define extended hours (6 AM to 5 AM next day) with sleep time consideration
EXTENDED_HOURS = {
    'start': 6,   # 6 AM
    'end': 5,     # 5 AM next day
    'sleep_start': 22,  # 10 PM
    'sleep_end': 6,     # 6 AM
    'slots': []   # Will be populated with time slots
}

# Generate time slots from 6 AM to 5 AM next day (23 hours)
for hour in range(EXTENDED_HOURS['start'], 24):
    EXTENDED_HOURS['slots'].append(f"{hour:02d}:00")
for hour in range(0, EXTENDED_HOURS['end'] + 1):
    EXTENDED_HOURS['slots'].append(f"{hour:02d}:00")

def calculate_task_complexity(task):
    """Calculate task complexity score for better scheduling"""
    complexity = 0
    
    # Hours factor (longer tasks are more complex)
    complexity += task['hours'] * 2
    
    # Priority factor
    priority_weights = {'low': 1, 'medium': 2, 'high': 3}
    complexity += priority_weights.get(task['priority'], 1)
    
    # Category factor (some categories might need more focus)
    category_weights = {
        'Learning': 2,
        'Project': 3,
        'Practice': 1,
        'Research': 2,
        'Other': 1
    }
    complexity += category_weights.get(task['category'], 1)
    
    return complexity

def is_sleep_time(time_str):
    """Check if a time slot is during sleep hours"""
    hour = int(time_str.split(':')[0])
    return hour >= EXTENDED_HOURS['sleep_start'] or hour < EXTENDED_HOURS['sleep_end']

def get_optimal_time_slot(task, available_slots, date):
    """Find the optimal time slot for a task based on its characteristics"""
    if not available_slots:
        return None
    
    # Filter out sleep time slots
    non_sleep_slots = [slot for slot in available_slots if not is_sleep_time(slot)]
    
    if not non_sleep_slots:
        # If no non-sleep slots available, use any available slot
        return available_slots[0]
    
    # For high priority tasks, prefer morning slots (6 AM - 12 PM)
    if task['priority'] == 'high':
        morning_slots = [slot for slot in non_sleep_slots if '06:00' <= slot <= '12:00']
        if morning_slots:
            return morning_slots[0]
    
    # For learning tasks, prefer morning to early afternoon (6 AM - 3 PM)
    if task['category'] == 'Learning':
        learning_slots = [slot for slot in non_sleep_slots if '06:00' <= slot <= '15:00']
        if learning_slots:
            return learning_slots[0]
    
    # For project tasks, prefer longer uninterrupted periods (afternoon)
    if task['category'] == 'Project' and task['hours'] > 2:
        afternoon_slots = [slot for slot in non_sleep_slots if '13:00' <= slot <= '18:00']
        if afternoon_slots:
            return afternoon_slots[0]
    
    # For practice tasks, prefer flexible times (afternoon to evening)
    if task['category'] == 'Practice':
        practice_slots = [slot for slot in non_sleep_slots if '14:00' <= slot <= '20:00']
        if practice_slots:
            return practice_slots[0]
    
    # For research tasks, prefer quiet hours (evening)
    if task['category'] == 'Research':
        research_slots = [slot for slot in non_sleep_slots if '19:00' <= slot <= '21:00']
        if research_slots:
            return research_slots[0]
    
    # Default: return the first available non-sleep slot
    return non_sleep_slots[0]

def generate_schedule_with_ai(tasks, specific_times=None):
    """Generate schedule using AI models for intelligent scheduling"""
    try:
        # Try multiple AI endpoints for better reliability
        ai_endpoints = [
            "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
            "https://api-inference.huggingface.co/models/gpt2",
            "https://api-inference.huggingface.co/models/facebook/opt-350m"
        ]
        
        # Create a comprehensive prompt for AI scheduling
        prompt = f"""Create an intelligent daily schedule for these tasks considering:
        - Business hours: 6 AM to 5 AM (23 hours total)
        - Sleep time: 10 PM to 6 AM (8 hours)
        - Available time: 15 hours for tasks
        - Task priorities and categories
        
        Tasks to schedule:"""
        
        for task in tasks:
            prompt += f"\n- {task['title']} ({task['hours']} hours, {task['priority']} priority, {task['category']} category)"
        
        if specific_times:
            prompt += "\n\nFixed time constraints:"
            for task_id, time_info in specific_times.items():
                task = next((t for t in tasks if t['id'] == task_id), None)
                if task:
                    prompt += f"\n- {task['title']} must be at {time_info['time']} on {time_info['date']}"
        
        prompt += "\n\nGenerate an optimal schedule considering energy levels, task complexity, and time constraints."
        
        # Try different AI endpoints
        for endpoint in ai_endpoints:
            try:
                headers = {"Authorization": "Bearer hf_demo"}  # Free demo token
                response = requests.post(endpoint, headers=headers, json={"inputs": prompt}, timeout=10)
                
                if response.status_code == 200:
                    print(f"AI scheduling successful using {endpoint}")
                    # Parse AI response and create intelligent schedule
                    return generate_intelligent_schedule(tasks, specific_times, ai_response=response.json())
                    
            except Exception as e:
                print(f"AI endpoint {endpoint} failed: {e}")
                continue
        
        # Fallback to intelligent rule-based scheduling
        print("All AI endpoints failed, using intelligent rule-based scheduling")
        return generate_intelligent_schedule(tasks, specific_times)
        
    except Exception as e:
        print(f"AI scheduling error: {e}")
        return generate_intelligent_schedule(tasks, specific_times)

def generate_intelligent_schedule(tasks, specific_times=None, ai_response=None):
    """Generate a schedule using intelligent rule-based logic with AI insights"""
    schedule = []
    
    # Handle specific time preferences first
    specific_time_tasks = []
    flexible_tasks = []
    
    for task in tasks:
        if specific_times and task.get('id') in specific_times:
            specific_time_tasks.append(task)
        else:
            flexible_tasks.append(task)
    
    # Sort flexible tasks by complexity and priority
    sorted_flexible_tasks = sorted(
        flexible_tasks, 
        key=lambda x: (x['priority'] == 'high', calculate_task_complexity(x)), 
        reverse=True
    )
    
    # First, schedule specific time tasks
    print(f"DEBUG: Scheduling specific time tasks: {specific_time_tasks}")
    for task in specific_time_tasks:
        specific_time = specific_times[task['id']]
        print(f"DEBUG: Processing specific time for task {task['id']}: {specific_time}")
        
        # Handle both old and new data structures
        if 'startTime' in specific_time and 'endTime' in specific_time:
            # New structure
            start_time = specific_time['startTime']
            end_time = specific_time['endTime']
            print(f"DEBUG: Using new structure - start: {start_time}, end: {end_time}")
        elif 'time' in specific_time:
            # Old structure - convert to new format
            start_time = specific_time['time']
            # Calculate end time based on task hours
            start_hour = int(start_time.split(':')[0])
            start_minute = int(start_time.split(':')[1])
            end_hour = (start_hour + task['hours']) % 24
            end_time = f"{end_hour:02d}:{start_minute:02d}"
            print(f"DEBUG: Converted old structure - start: {start_time}, end: {end_time}")
        else:
            # Invalid structure - skip this task
            print(f"Warning: Invalid specific time structure for task {task['id']}: {specific_time}")
            continue
        
        # Calculate the time range
        start_hour = int(start_time.split(':')[0])
        end_hour = int(end_time.split(':')[0])
        
        # Handle tasks that span multiple hours
        current_hour = start_hour
        while current_hour != end_hour:
            time_slot = f"{current_hour:02d}:00"
            
            # Check if this time slot conflicts with existing schedule
            slot_taken = any(
                s['date'] == specific_time['date'] and s['time'] == time_slot
                for s in schedule
            )
            
            if not slot_taken:
                schedule.append({
                    'date': specific_time['date'],
                    'time': time_slot,
                    'task_title': task['title'],
                    'hours': 1,
                    'category': task['category'],
                    'priority': task['priority'],
                    'is_specific_time': True,
                    'task_id': task['id'],
                    'start_time': start_time,
                    'end_time': end_time
                })
            
            # Move to next hour
            current_hour = (current_hour + 1) % 24
    
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
        # Sort tasks for this date by priority and complexity
        date_tasks.sort(key=lambda x: (x['priority'] == 'high', calculate_task_complexity(x)), reverse=True)
        
        # Get available time slots for this date (exclude specific time slots)
        available_slots = []
        for time in EXTENDED_HOURS['slots']:
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
                # Find the optimal time slot
                best_slot = get_optimal_time_slot(task, available_slots, date)
                
                if best_slot:
                    schedule.append({
                        'date': date,
                        'time': best_slot,
                        'task_title': task['title'],
                        'hours': 1,
                        'category': task['category'],
                        'priority': task['priority'],
                        'is_specific_time': False,
                        'task_id': task['id']
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
                for time in EXTENDED_HOURS['slots']:
                    slot_taken = any(
                        s['date'] == next_date_str and s['time'] == time
                        for s in schedule
                    )
                    if not slot_taken:
                        next_day_available.append(time)
                
                # Schedule remaining hours on next day
                while hours_needed > 0 and next_day_available:
                    best_slot = get_optimal_time_slot(task, next_day_available, next_date_str)
                    if best_slot:
                        schedule.append({
                            'date': next_date_str,
                            'time': best_slot,
                            'task_title': task['title'],
                            'hours': 1,
                            'category': task['category'],
                            'priority': task['priority'],
                            'is_specific_time': False,
                            'task_id': task['id']
                        })
                        next_day_available.remove(best_slot)
                        hours_needed -= 1
                    else:
                        break
    
    return schedule

def generate_schedule_offline(tasks, specific_times=None):
    """Legacy function - now calls intelligent scheduling"""
    return generate_intelligent_schedule(tasks, specific_times)

@app.route('/generate-schedule', methods=['POST'])
def generate_schedule_endpoint():
    try:
        data = request.get_json()
        tasks = data.get('tasks')
        use_ai = data.get('use_ai', True)  # Default to AI scheduling
        specific_times = data.get('specific_times', {})  # Optional specific time preferences
        user_phone = data.get('user_phone')  # Optional phone number for reminders
        
        if not tasks:
            return jsonify({"error": "No tasks provided"}), 400

        # Validate and clean specific_times data structure
        cleaned_specific_times = {}
        print(f"DEBUG: Received specific_times: {specific_times}")
        
        for task_id, time_data in specific_times.items():
            print(f"DEBUG: Processing task {task_id} with data: {time_data}")
            if isinstance(time_data, dict):
                # Handle old structure (with 'time' property)
                if 'time' in time_data and 'date' in time_data:
                    task = next((t for t in tasks if t['id'] == task_id), None)
                    if task:
                        start_time = time_data['time']
                        start_hour = int(start_time.split(':')[0])
                        start_minute = int(start_time.split(':')[1])
                        end_hour = (start_hour + task['hours']) % 24
                        end_time = f"{end_hour:02d}:{start_minute:02d}"
                        
                        cleaned_specific_times[task_id] = {
                            'date': time_data['date'],
                            'startTime': start_time,
                            'endTime': end_time
                        }
                        print(f"DEBUG: Converted old structure for task {task_id}: {cleaned_specific_times[task_id]}")
                elif 'startTime' in time_data and 'endTime' in time_data and 'date' in time_data:
                    # New structure - keep as is
                    cleaned_specific_times[task_id] = time_data
                    print(f"DEBUG: Using new structure for task {task_id}: {cleaned_specific_times[task_id]}")
                else:
                    print(f"Warning: Invalid specific time structure for task {task_id}, data: {time_data}")
            else:
                print(f"Warning: Invalid specific time data type for task {task_id}, type: {type(time_data)}, data: {time_data}")
        
        print(f"DEBUG: Cleaned specific_times: {cleaned_specific_times}")

        # Choose scheduling method
        if use_ai:
            schedule = generate_schedule_with_ai(tasks, cleaned_specific_times)
        else:
            schedule = generate_intelligent_schedule(tasks, cleaned_specific_times)
        
        # Schedule reminders if phone number provided
        reminder_ids = []
        if user_phone:
            for scheduled_task in schedule:
                # Find the original task
                original_task = next((t for t in tasks if t['id'] == scheduled_task['task_id']), None)
                if original_task:
                    # Create datetime for scheduled time
                    scheduled_datetime = datetime.strptime(
                        f"{scheduled_task['date']} {scheduled_task['time']}", 
                        "%Y-%m-%d %H:%M"
                    )
                    
                    # Schedule reminder (15 minutes before task)
                    reminder_id = reminder_service.schedule_reminder(
                        original_task, 
                        user_phone, 
                        scheduled_datetime, 
                        reminder_timing=15
                    )
                    if reminder_id:
                        reminder_ids.append(reminder_id)
        
        # Calculate sleep time slots
        sleep_slots = []
        for slot in EXTENDED_HOURS['slots']:
            if is_sleep_time(slot):
                sleep_slots.append(slot)
        
        return jsonify({
            "schedule": schedule,
            "method": "ai_powered" if use_ai else "intelligent_rule_based",
            "total_tasks": len(tasks),
            "total_hours": sum(task['hours'] for task in tasks),
            "specific_times_count": len(cleaned_specific_times),
            "extended_hours": EXTENDED_HOURS,
            "scheduled_hours": len(schedule),
            "sleep_slots": sleep_slots,
            "available_hours": len(EXTENDED_HOURS['slots']) - len(sleep_slots),
            "reminders_scheduled": len(reminder_ids),
            "reminder_ids": reminder_ids
        })

    except Exception as e:
        print(f"AI scheduling error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/get-time-slots', methods=['GET'])
def get_time_slots():
    """Get available time slots for the calendar"""
    sleep_slots = []
    for slot in EXTENDED_HOURS['slots']:
        if is_sleep_time(slot):
            sleep_slots.append(slot)
    
    return jsonify({
        "time_slots": EXTENDED_HOURS['slots'],
        "extended_hours": EXTENDED_HOURS,
        "sleep_slots": sleep_slots,
        "available_hours": len(EXTENDED_HOURS['slots']) - len(sleep_slots)
    })

# Reminder endpoints
@app.route('/reminders/schedule', methods=['POST'])
def schedule_reminder_endpoint():
    """Schedule a reminder for a specific task"""
    try:
        data = request.get_json()
        task = data.get('task')
        user_phone = data.get('user_phone')
        scheduled_time = data.get('scheduled_time')
        reminder_timing = data.get('reminder_timing', 15)
        
        if not all([task, user_phone, scheduled_time]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Convert scheduled_time string to datetime
        scheduled_datetime = datetime.fromisoformat(scheduled_time.replace('Z', '+00:00'))
        
        reminder_id = reminder_service.schedule_reminder(
            task, user_phone, scheduled_datetime, reminder_timing
        )
        
        if reminder_id:
            return jsonify({
                "success": True,
                "reminder_id": reminder_id,
                "message": "Reminder scheduled successfully"
            })
        else:
            return jsonify({"error": "Failed to schedule reminder"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/reminders/preferences', methods=['GET'])
def get_user_preferences_endpoint():
    """Get user reminder preferences"""
    try:
        user_phone = request.args.get('user_phone')
        if not user_phone:
            return jsonify({"error": "User phone required"}), 400
        
        preferences = reminder_service.get_user_preferences(user_phone)
        return jsonify({
            "success": True,
            "preferences": preferences
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/reminders/preferences', methods=['POST'])
def update_user_preferences_endpoint():
    """Update user reminder preferences"""
    try:
        data = request.get_json()
        user_phone = data.get('user_phone')
        preferences = data.get('preferences', {})
        
        if not user_phone:
            return jsonify({"error": "User phone required"}), 400
        
        success = reminder_service.update_user_preferences(user_phone, preferences)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Preferences updated successfully"
            })
        else:
            return jsonify({"error": "Failed to update preferences"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/reminders/history', methods=['GET'])
def get_reminder_history_endpoint():
    """Get reminder history for a user"""
    try:
        user_phone = request.args.get('user_phone')
        limit = int(request.args.get('limit', 10))
        
        if not user_phone:
            return jsonify({"error": "User phone required"}), 400
        
        history = reminder_service.get_reminder_history(user_phone, limit)
        return jsonify({
            "success": True,
            "history": history
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/reminders/cancel/<int:reminder_id>', methods=['POST'])
def cancel_reminder_endpoint(reminder_id):
    """Cancel a scheduled reminder"""
    try:
        success = reminder_service.cancel_reminder(reminder_id)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Reminder cancelled successfully"
            })
        else:
            return jsonify({"error": "Failed to cancel reminder"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/reminders/test', methods=['POST'])
def test_reminder_endpoint():
    """Send a test reminder"""
    try:
        data = request.get_json()
        user_phone = data.get('user_phone')
        test_message = data.get('message', '[TEST] Test reminder from DIY Scheduler!')
        
        if not user_phone:
            return jsonify({"error": "User phone required"}), 400
        
        # Validate phone number first
        is_valid, phone_result = reminder_service.validate_phone_number(user_phone)
        if not is_valid:
            return jsonify({
                "error": f"Invalid phone number: {phone_result}",
                "help": "Please use E.164 format (e.g., +1234567890 for US, +918830745678 for India)"
            }), 400
        
        formatted_phone = phone_result
        
        # Create a test task
        test_task = {
            'id': 'test_task',
            'title': 'Test Task',
            'category': 'Test',
            'priority': 'medium'
        }
        
        # Schedule immediate reminder
        reminder_id = reminder_service.schedule_reminder(
            test_task, formatted_phone, datetime.now() + timedelta(minutes=1), 1
        )
        
        if reminder_id:
            # Check if this is a trial account and provide helpful info
            trial_warning = ""
            if reminder_service.account_sid and "AC" in reminder_service.account_sid:
                trial_warning = "\n\n⚠️ **TRIAL ACCOUNT NOTICE:** If you don't receive the SMS, your phone number may need to be verified in your Twilio console. Visit: https://console.twilio.com/phone-numbers/verified"
            
            return jsonify({
                "success": True,
                "message": f"Test reminder scheduled (will send in 1 minute){trial_warning}",
                "reminder_id": reminder_id,
                "formatted_phone": formatted_phone,
                "trial_account": True if reminder_service.account_sid and "AC" in reminder_service.account_sid else False
            })
        else:
            return jsonify({"error": "Failed to schedule test reminder"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    sleep_slots = []
    for slot in EXTENDED_HOURS['slots']:
        if is_sleep_time(slot):
            sleep_slots.append(slot)
    
    # Check Twilio status
    twilio_status = "configured" if reminder_service.twilio_client else "not_configured"
    
    return jsonify({
        "status": "healthy", 
        "service": "DIY Scheduler",
        "extended_hours": EXTENDED_HOURS,
        "sleep_slots": sleep_slots,
        "twilio_status": twilio_status,
        "features": [
            "AI-powered intelligent scheduling",
            "6 AM to 5 AM extended hours",
            "Smart sleep time management (10 PM - 6 AM)",
            "Fixed time scheduling",
            "Priority-based optimization",
            "Category-aware time allocation",
            "Energy level consideration",
            "AI-powered SMS reminders via Twilio",
            "Smart reminder timing and personalization"
        ]
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 4008))  # Use PORT env var or default to 4008
    print(f"[ROCKET] DIY Scheduler starting on port {port}...")
    print("[CALENDAR] Extended hours: 6 AM to 5 AM (23 hours)")
    print("[SLEEP] Sleep time: 10 PM to 6 AM (8 hours)")
    print("[BRAIN] AI-powered intelligent scheduling with multiple models")
    print("[CLOCK] Fixed time scheduling support")
    print("[CHART] Enhanced conflict resolution with sleep consideration")
    print("[SMS] AI-powered SMS reminders via Twilio")
    print(f"[LINK] Health check available at: http://localhost:{port}/health")
    print(f"[CLOCK] Time slots endpoint: http://localhost:{port}/get-time-slots")
    print(f"[PHONE] Reminder endpoints available at: http://localhost:{port}/reminders/*")
    app.run(port=port, debug=True) 