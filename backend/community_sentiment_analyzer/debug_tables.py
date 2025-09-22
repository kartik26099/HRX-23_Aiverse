from app import supabase
import os
from dotenv import load_dotenv

load_dotenv()

def check_tables():
    """Check what tables exist in the Supabase database"""
    try:
        if not supabase:
            print("❌ Supabase client not initialized")
            return
        
        print("🔍 Checking available tables in Supabase...")
        
        # Try to query each expected table
        expected_tables = ['posts', 'comments', 'reactions', 'tags', 'post_tags', 'users']
        
        for table in expected_tables:
            try:
                response = supabase.table(table).select('*').limit(1).execute()
                count = len(response.data)
                print(f"✅ Table '{table}': {count} records")
            except Exception as e:
                print(f"❌ Table '{table}': {str(e)}")
        
        # Also try to get table list from information_schema
        try:
            response = supabase.rpc('get_tables').execute()
            print(f"📋 Available tables: {response.data}")
        except:
            print("📋 Could not get table list from information_schema")
            
    except Exception as e:
        print(f"Error checking tables: {e}")

if __name__ == "__main__":
    check_tables() 