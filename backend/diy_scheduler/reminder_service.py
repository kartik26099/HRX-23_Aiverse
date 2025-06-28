import os
import json
import requests
import re
from datetime import datetime, timedelta
from dotenv import load_dotenv
from twilio.rest import Client
from twilio.base.exceptions import TwilioException
import sqlite3
import threading
import time

load_dotenv()

class AIReminderService:
    def __init__(self):
        # Twilio configuration
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_number = os.getenv('TWILIO_PHONE_NUMBER')
        
        # Initialize Twilio client
        if self.account_sid and self.auth_token:
            self.twilio_client = Client(self.account_sid, self.auth_token)
        else:
            self.twilio_client = None
            print("⚠️ Twilio credentials not found. SMS reminders will be disabled.")
        
        # Database setup
        self.init_database()
        
        # Start reminder scheduler
        self.start_reminder_scheduler()
    
    def init_database(self):
        """Initialize SQLite database for storing reminders and user preferences"""
        self.conn = sqlite3.connect('reminders.db', check_same_thread=False)
        self.cursor = self.conn.cursor()
        
        # Create tables
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT NOT NULL,
                user_phone TEXT NOT NULL,
                scheduled_time DATETIME NOT NULL,
                message TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                sent_at DATETIME,
                response_status TEXT
            )
        ''')
        
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_phone TEXT UNIQUE NOT NULL,
                reminder_timing INTEGER DEFAULT 15,
                reminder_style TEXT DEFAULT 'motivational',
                timezone TEXT DEFAULT 'UTC',
                active_hours_start INTEGER DEFAULT 6,
                active_hours_end INTEGER DEFAULT 22,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.conn.commit()
    
    def format_phone_number(self, phone_number):
        """Format phone number to E.164 international format for Twilio"""
        # Remove all non-digit characters
        digits_only = re.sub(r'\D', '', str(phone_number))
        
        # Handle different phone number formats
        if len(digits_only) == 10:
            # Check if it's an Indian number (starts with 6, 7, 8, 9)
            if digits_only.startswith(('6', '7', '8', '9')):
                return f"+91{digits_only}"
            else:
                # US number without country code
                return f"+1{digits_only}"
        elif len(digits_only) == 11 and digits_only.startswith('1'):
            # US number with country code
            return f"+{digits_only}"
        elif len(digits_only) == 12 and digits_only.startswith('91'):
            # Indian number with country code
            return f"+{digits_only}"
        elif len(digits_only) >= 10 and len(digits_only) <= 15:
            # Other international numbers
            if not digits_only.startswith('+'):
                return f"+{digits_only}"
            else:
                return f"+{digits_only[1:]}"  # Remove extra +
        else:
            # Invalid format
            raise ValueError(f"Invalid phone number format: {phone_number}")
    
    def validate_phone_number(self, phone_number):
        """Validate phone number format"""
        try:
            formatted = self.format_phone_number(phone_number)
            # Basic validation - should start with + and have 10-15 digits
            if not formatted.startswith('+'):
                return False, "Phone number must include country code"
            
            digits = re.sub(r'\D', '', formatted)
            if len(digits) < 10 or len(digits) > 15:
                return False, "Phone number must be 10-15 digits"
            
            return True, formatted
        except Exception as e:
            return False, str(e)
    
    def generate_ai_reminder(self, task, user_context=None):
        """Generate AI-powered reminder message"""
        try:
            # Try multiple AI endpoints for reminder generation
            ai_endpoints = [
                "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
                "https://api-inference.huggingface.co/models/gpt2"
            ]
            
            # Create context-aware prompt
            current_hour = datetime.now().hour
            time_context = self.get_time_context(current_hour)
            
            prompt = f"""Generate a motivational reminder for this task:
            Task: {task['title']}
            Category: {task['category']}
            Priority: {task['priority']}
            Time: {time_context}
            
            Create a short, motivational SMS reminder (max 160 characters) that:
            - Motivates the user to complete the task
            - Is appropriate for the time of day
            - Considers the task category and priority
            - Uses emojis sparingly but effectively
            
            Response format: Just the reminder message, no explanations."""
            
            for endpoint in ai_endpoints:
                try:
                    headers = {"Authorization": "Bearer hf_demo"}
                    response = requests.post(endpoint, headers=headers, json={"inputs": prompt}, timeout=5)
                    
                    if response.status_code == 200:
                        ai_response = response.json()
                        # Extract the generated message
                        if isinstance(ai_response, list) and len(ai_response) > 0:
                            message = ai_response[0].get('generated_text', '')
                        else:
                            message = str(ai_response)
                        
                        # Clean and format the message
                        message = self.clean_ai_message(message, task)
                        return message
                        
                except Exception as e:
                    print(f"AI endpoint {endpoint} failed: {e}")
                    continue
            
            # Fallback to rule-based reminder generation
            return self.generate_fallback_reminder(task, time_context)
            
        except Exception as e:
            print(f"Error generating AI reminder: {e}")
            return self.generate_fallback_reminder(task, "now")
    
    def get_time_context(self, hour):
        """Get time-based context for reminder generation"""
        if 6 <= hour < 12:
            return "morning"
        elif 12 <= hour < 18:
            return "afternoon"
        elif 17 <= hour < 21:
            return "evening"
        else:
            return "night"
    
    def clean_ai_message(self, message, task):
        """Clean and format AI-generated message"""
        # Remove extra text and keep only the reminder
        lines = message.split('\n')
        for line in lines:
            line = line.strip()
            if line and not line.startswith('Task:') and not line.startswith('Response:'):
                # Limit to 160 characters for SMS
                if len(line) > 160:
                    line = line[:157] + "..."
                return line
        
        # Fallback if no good line found
        return self.generate_fallback_reminder(task, "now")
    
    def generate_fallback_reminder(self, task, time_context):
        """Generate fallback reminder when AI fails"""
        task_title = task['title'][:30]  # Limit title length
        
        if time_context == "morning":
            return f"[SUNRISE] Good morning! Time to tackle: {task_title} ({task['category']})"
        elif time_context == "afternoon":
            return f"[SUN] Afternoon energy! Ready for: {task_title} ({task['category']})"
        elif time_context == "evening":
            return f"[SUNSET] Evening focus time: {task_title} ({task['category']})"
        else:
            return f"[NIGHT] Night owl mode: {task_title} ({task['category']})"
    
    def schedule_reminder(self, task, user_phone, scheduled_time, reminder_timing=15):
        """Schedule a reminder for a task"""
        try:
            # Validate and format phone number
            is_valid, phone_result = self.validate_phone_number(user_phone)
            if not is_valid:
                print(f"❌ Invalid phone number: {phone_result}")
                return None
            
            formatted_phone = phone_result
            
            # Calculate reminder time (15 minutes before task)
            reminder_time = scheduled_time - timedelta(minutes=reminder_timing)
            
            # Generate AI reminder message
            reminder_message = self.generate_ai_reminder(task)
            
            # Store reminder in database
            self.cursor.execute('''
                INSERT INTO reminders (task_id, user_phone, scheduled_time, message)
                VALUES (?, ?, ?, ?)
            ''', (task['id'], formatted_phone, reminder_time, reminder_message))
            
            reminder_id = self.cursor.lastrowid
            self.conn.commit()
            
            print(f"✅ Reminder scheduled for task '{task['title']}' at {reminder_time}")
            return reminder_id
            
        except Exception as e:
            print(f"❌ Error scheduling reminder: {e}")
            return None
    
    def send_sms_reminder(self, reminder_id):
        """Send SMS reminder using Twilio"""
        try:
            # Get reminder details
            self.cursor.execute('''
                SELECT user_phone, message, task_id FROM reminders 
                WHERE id = ? AND status = 'pending'
            ''', (reminder_id,))
            
            result = self.cursor.fetchone()
            if not result:
                return False
            
            user_phone, message, task_id = result
            
            if not self.twilio_client:
                print("⚠️ Twilio not configured. Simulating SMS send.")
                print(f"[SMS] Would send to {user_phone}: {message}")
                self.update_reminder_status(reminder_id, 'sent', 'simulated')
                return True
            
            # Send SMS via Twilio
            try:
                message_sid = self.twilio_client.messages.create(
                    body=message,
                    from_=self.twilio_number,
                    to=user_phone
                )
                
                # Update reminder status
                self.update_reminder_status(reminder_id, 'sent', message_sid.sid)
                print(f"✅ SMS sent successfully: {message}")
                return True
                
            except TwilioException as e:
                error_msg = str(e)
                print(f"❌ Twilio error: {error_msg}")
                
                # Check if it's an unverified number error
                if "unverified" in error_msg.lower():
                    print(f"⚠️ Phone number {user_phone} is not verified in Twilio trial account")
                    print(f"💡 To fix this: Verify the number at https://console.twilio.com/ or upgrade to paid account")
                    
                    # For unverified numbers, simulate the send but mark as failed
                    print(f"[SIMULATED SMS] Would send to {user_phone}: {message}")
                    self.update_reminder_status(reminder_id, 'failed', 'unverified_number')
                    return False
                else:
                    self.update_reminder_status(reminder_id, 'failed', error_msg)
                    return False
                    
        except Exception as e:
            print(f"❌ Error sending SMS: {e}")
            self.update_reminder_status(reminder_id, 'failed', str(e))
            return False
    
    def update_reminder_status(self, reminder_id, status, response_status=None):
        """Update reminder status in database"""
        try:
            if status == 'sent':
                self.cursor.execute('''
                    UPDATE reminders 
                    SET status = ?, sent_at = CURRENT_TIMESTAMP, response_status = ?
                    WHERE id = ?
                ''', (status, response_status, reminder_id))
            else:
                self.cursor.execute('''
                    UPDATE reminders 
                    SET status = ?, response_status = ?
                    WHERE id = ?
                ''', (status, response_status, reminder_id))
            
            self.conn.commit()
        except Exception as e:
            print(f"❌ Error updating reminder status: {e}")
    
    def start_reminder_scheduler(self):
        """Start background thread to check and send reminders"""
        def scheduler_loop():
            while True:
                try:
                    # Check for due reminders
                    self.cursor.execute('''
                        SELECT id FROM reminders 
                        WHERE status = 'pending' 
                        AND scheduled_time <= datetime('now', '+1 minute')
                    ''')
                    
                    due_reminders = self.cursor.fetchall()
                    
                    for (reminder_id,) in due_reminders:
                        self.send_sms_reminder(reminder_id)
                    
                    # Sleep for 1 minute before next check
                    time.sleep(60)
                    
                except Exception as e:
                    print(f"❌ Scheduler error: {e}")
                    time.sleep(60)
        
        # Start scheduler in background thread
        scheduler_thread = threading.Thread(target=scheduler_loop, daemon=True)
        scheduler_thread.start()
        print("[CLOCK] Reminder scheduler started")
    
    def get_user_preferences(self, user_phone):
        """Get user reminder preferences"""
        self.cursor.execute('''
            SELECT reminder_timing, reminder_style, timezone, active_hours_start, active_hours_end
            FROM user_preferences WHERE user_phone = ?
        ''', (user_phone,))
        
        result = self.cursor.fetchone()
        if result:
            return {
                'reminder_timing': result[0],
                'reminder_style': result[1],
                'timezone': result[2],
                'active_hours_start': result[3],
                'active_hours_end': result[4]
            }
        return None
    
    def update_user_preferences(self, user_phone, preferences):
        """Update user reminder preferences"""
        try:
            # Validate and format phone number
            is_valid, phone_result = self.validate_phone_number(user_phone)
            if not is_valid:
                print(f"❌ Invalid phone number: {phone_result}")
                return False
            
            formatted_phone = phone_result
            
            self.cursor.execute('''
                INSERT OR REPLACE INTO user_preferences 
                (user_phone, reminder_timing, reminder_style, timezone, active_hours_start, active_hours_end)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                formatted_phone,
                preferences.get('reminder_timing', 15),
                preferences.get('reminder_style', 'motivational'),
                preferences.get('timezone', 'UTC'),
                preferences.get('active_hours_start', 6),
                preferences.get('active_hours_end', 22)
            ))
            
            self.conn.commit()
            print(f"✅ User preferences updated for {formatted_phone}")
            return True
            
        except Exception as e:
            print(f"❌ Error updating user preferences: {e}")
            return False
    
    def get_reminder_history(self, user_phone, limit=10):
        """Get reminder history for a user"""
        self.cursor.execute('''
            SELECT task_id, message, scheduled_time, status, sent_at
            FROM reminders 
            WHERE user_phone = ?
            ORDER BY created_at DESC
            LIMIT ?
        ''', (user_phone, limit))
        
        return self.cursor.fetchall()
    
    def cancel_reminder(self, reminder_id):
        """Cancel a scheduled reminder"""
        try:
            self.cursor.execute('''
                UPDATE reminders 
                SET status = 'cancelled'
                WHERE id = ? AND status = 'pending'
            ''', (reminder_id,))
            
            self.conn.commit()
            print(f"✅ Reminder {reminder_id} cancelled")
            return True
            
        except Exception as e:
            print(f"❌ Error cancelling reminder: {e}")
            return False

# Global instance
reminder_service = AIReminderService() 