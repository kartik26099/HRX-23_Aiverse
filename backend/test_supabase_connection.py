#!/usr/bin/env python3
"""
Test Supabase connection
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Set environment variables directly for testing
os.environ['SUPABASE_URL'] = 'https://rcaulkjfpzpxbyuzcazm.supabase.co'
os.environ['SUPABASE_SERVICE_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjYXVsa2pmcHpweGJ5dXpjYXptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU4NjQwNywiZXhwIjoyMDY2MTYyNDA3fQ.sLs6seifOgB5TE8BtFPhuxzjIPDswanosO3zfyMBg8I'

def test_supabase_connection():
    """Test Supabase connection"""
    print("🧪 Testing Supabase Connection")
    print("=" * 40)
    
    # Get credentials
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
    
    print(f"URL: {SUPABASE_URL}")
    print(f"Key: {SUPABASE_SERVICE_KEY[:20]}..." if SUPABASE_SERVICE_KEY else "None")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Missing Supabase credentials")
        return False
    
    try:
        # Create client
        supabase: Client = create_client(
            supabase_url=SUPABASE_URL,
            supabase_key=SUPABASE_SERVICE_KEY
        )
        print("✅ Supabase client created successfully")
        
        # Test connection by getting user count
        response = supabase.table('users').select('id', count='exact').execute()
        count = response.count if hasattr(response, 'count') and response.count is not None else len(response.data)
        print(f"✅ Connection test successful - Found {count} users")
        
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False

if __name__ == "__main__":
    test_supabase_connection() 