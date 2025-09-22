from app import supabase
import os
from dotenv import load_dotenv
import json

load_dotenv()

def debug_data():
    """Debug the actual data in the database"""
    try:
        if not supabase:
            print("❌ Supabase client not initialized")
            return
        
        print("🔍 Debugging database data...")
        
        # Check posts table
        print("\n📝 Posts table:")
        try:
            posts_response = supabase.table('posts').select('*').execute()
            print(f"Total posts: {len(posts_response.data)}")
            for post in posts_response.data:
                print(f"  - ID: {post.get('id')}")
                print(f"    Content: {post.get('content', '')[:100]}...")
                print(f"    Status: {post.get('status')}")
                print(f"    Type: {post.get('type')}")
                print(f"    Created: {post.get('created_at')}")
                print()
        except Exception as e:
            print(f"Error reading posts: {e}")
        
        # Check comments table
        print("\n💬 Comments table:")
        try:
            comments_response = supabase.table('comments').select('*').execute()
            print(f"Total comments: {len(comments_response.data)}")
            for comment in comments_response.data:
                print(f"  - ID: {comment.get('id')}")
                print(f"    Post ID: {comment.get('post_id')}")
                print(f"    Content: {comment.get('content', '')[:100]}...")
                print(f"    Status: {comment.get('status')}")
                print()
        except Exception as e:
            print(f"Error reading comments: {e}")
        
        # Check users table
        print("\n👤 Users table:")
        try:
            users_response = supabase.table('users').select('*').execute()
            print(f"Total users: {len(users_response.data)}")
            for user in users_response.data:
                print(f"  - ID: {user.get('id')}")
                print(f"    Username: {user.get('username')}")
                print()
        except Exception as e:
            print(f"Error reading users: {e}")
            
    except Exception as e:
        print(f"Error debugging data: {e}")

if __name__ == "__main__":
    debug_data() 