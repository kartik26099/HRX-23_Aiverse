"""
Webhook handler for Supabase database changes
This module handles webhooks from Supabase to trigger sentiment analysis updates
"""

import os
import requests
import json
from datetime import datetime
from typing import Dict, Any

# Configuration
SENTIMENT_ANALYZER_URL = os.getenv('SENTIMENT_ANALYZER_URL', 'http://localhost:5001')

def handle_post_insert(payload: Dict[Any, Any]) -> Dict[str, Any]:
    """Handle new post insertion"""
    try:
        print(f"New post detected: {payload.get('id')}")
        
        # Trigger sentiment analysis refresh
        response = requests.post(
            f"{SENTIMENT_ANALYZER_URL}/api/webhook/database-change",
            timeout=10
        )
        
        if response.status_code == 200:
            return {
                'status': 'success',
                'message': 'Sentiment analysis triggered for new post',
                'timestamp': datetime.now().isoformat()
            }
        else:
            return {
                'status': 'error',
                'message': 'Failed to trigger sentiment analysis',
                'timestamp': datetime.now().isoformat()
            }
            
    except Exception as e:
        print(f"Error handling post insert: {e}")
        return {
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }

def handle_comment_insert(payload: Dict[Any, Any]) -> Dict[str, Any]:
    """Handle new comment insertion"""
    try:
        print(f"New comment detected: {payload.get('id')}")
        
        # Trigger sentiment analysis refresh
        response = requests.post(
            f"{SENTIMENT_ANALYZER_URL}/api/webhook/database-change",
            timeout=10
        )
        
        if response.status_code == 200:
            return {
                'status': 'success',
                'message': 'Sentiment analysis triggered for new comment',
                'timestamp': datetime.now().isoformat()
            }
        else:
            return {
                'status': 'error',
                'message': 'Failed to trigger sentiment analysis',
                'timestamp': datetime.now().isoformat()
            }
            
    except Exception as e:
        print(f"Error handling comment insert: {e}")
        return {
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }

def handle_reaction_insert(payload: Dict[Any, Any]) -> Dict[str, Any]:
    """Handle new reaction insertion"""
    try:
        print(f"New reaction detected: {payload.get('id')}")
        
        # Trigger sentiment analysis refresh
        response = requests.post(
            f"{SENTIMENT_ANALYZER_URL}/api/webhook/database-change",
            timeout=10
        )
        
        if response.status_code == 200:
            return {
                'status': 'success',
                'message': 'Sentiment analysis triggered for new reaction',
                'timestamp': datetime.now().isoformat()
            }
        else:
            return {
                'status': 'error',
                'message': 'Failed to trigger sentiment analysis',
                'timestamp': datetime.now().isoformat()
            }
            
    except Exception as e:
        print(f"Error handling reaction insert: {e}")
        return {
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.now().isoformat()
        }

def handle_webhook(event_type: str, table: str, payload: Dict[Any, Any]) -> Dict[str, Any]:
    """Main webhook handler"""
    print(f"Webhook received: {event_type} on table {table}")
    
    # Handle different event types
    if event_type == 'INSERT':
        if table == 'posts':
            return handle_post_insert(payload)
        elif table == 'comments':
            return handle_comment_insert(payload)
        elif table == 'reactions':
            return handle_reaction_insert(payload)
        else:
            return {
                'status': 'ignored',
                'message': f'Unhandled table: {table}',
                'timestamp': datetime.now().isoformat()
            }
    else:
        return {
            'status': 'ignored',
            'message': f'Unhandled event type: {event_type}',
            'timestamp': datetime.now().isoformat()
        }

# Example usage for Supabase Edge Functions
def supabase_webhook_handler(request):
    """
    Example handler for Supabase Edge Functions
    This would be deployed as a Supabase Edge Function
    """
    try:
        # Parse the webhook payload
        payload = request.json()
        
        # Extract event information
        event_type = payload.get('type', 'INSERT')
        table = payload.get('table', '')
        record = payload.get('record', {})
        
        # Handle the webhook
        result = handle_webhook(event_type, table, record)
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f"Error in webhook handler: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            })
        } 