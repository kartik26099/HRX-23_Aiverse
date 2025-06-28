import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Please set SUPABASE_URL and SUPABASE_KEY environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def extract_posts_and_comments():
    print("Extracting posts...")
    posts_resp = supabase.table("posts").select("id, user_id, content, created_at").execute()
    posts = posts_resp.data if hasattr(posts_resp, 'data') else posts_resp
    print(f"Found {len(posts)} posts:")
    for post in posts:
        print(f"POST | id: {post['id']} | user_id: {post['user_id']} | content: {post['content']} | created_at: {post['created_at']}")

    print("\nExtracting comments...")
    comments_resp = supabase.table("comments").select("id, post_id, user_id, content, created_at").execute()
    comments = comments_resp.data if hasattr(comments_resp, 'data') else comments_resp
    print(f"Found {len(comments)} comments:")
    for comment in comments:
        print(f"COMMENT | id: {comment['id']} | post_id: {comment['post_id']} | user_id: {comment['user_id']} | content: {comment['content']} | created_at: {comment['created_at']}")

if __name__ == "__main__":
    extract_posts_and_comments() 