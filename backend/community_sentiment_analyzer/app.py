from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
import json
from datetime import datetime, timedelta
import sqlite3
from supabase import create_client, Client
import threading
import time
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# Initialize Supabase client with error handling
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ Supabase client initialized successfully")
except Exception as e:
    print(f"❌ Error initializing Supabase client: {e}")
    supabase = None

# API Keys for different services
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY')  # Free tier available
COHERE_API_KEY = os.getenv('COHERE_API_KEY')  # Free tier available

# Global cache for sentiment data
sentiment_cache = None
last_analysis_time = None
last_api_call_time = 0
api_call_interval = 1.0  # Minimum 1 second between API calls

# Sentiment analysis method preference (can be changed via environment variable)
SENTIMENT_METHOD = os.getenv('SENTIMENT_METHOD', 'rule_based')  # Options: openrouter, huggingface, cohere, rule_based

def rule_based_sentiment_analysis(text):
    """Simple rule-based sentiment analysis using keyword matching"""
    text_lower = text.lower()
    
    # Positive keywords
    positive_words = [
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
        'love', 'like', 'enjoy', 'happy', 'excited', 'thrilled', 'perfect', 'best',
        'helpful', 'useful', 'brilliant', 'outstanding', 'superb', 'incredible',
        'thank', 'thanks', 'appreciate', 'grateful', 'blessed', 'lucky', 'fortunate',
        'satisfied', 'pleased', 'impressed', 'recommend', 'recommended', 'working',
        'solved', 'fixed', 'improved', 'better', 'successful', 'effective', 'valuable'
    ]
    
    # Negative keywords (expanded)
    negative_words = [
        # Basic negative words
        'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike',
        'angry', 'frustrated', 'annoyed', 'upset', 'sad', 'disappointed',
        'useless', 'waste', 'stupid', 'ridiculous', 'nonsense', 'garbage',
        'problem', 'issue', 'error', 'broken', 'fail', 'failure', 'wrong',
        
        # Strong negative words
        'completely useless', 'totally useless', 'absolutely useless',
        'wasted', 'wasting', 'wastes', 'waste of time', 'waste of money',
        'pointless', 'meaningless', 'worthless', 'valueless',
        'doesn\'t work', 'does not work', 'not working', 'broken',
        'crashed', 'crashes', 'crashing', 'failed', 'failing',
        
        # Frustration words
        'frustrating', 'annoying', 'irritating', 'maddening', 'infuriating',
        'disgusting', 'revolting', 'appalling', 'shocking', 'outrageous',
        'unacceptable', 'unbearable', 'intolerable', 'unforgivable',
        
        # Disappointment words
        'disappointing', 'disappointed', 'let down', 'letdown', 'underwhelming',
        'mediocre', 'average', 'poor', 'subpar', 'inferior', 'lacking',
        'missing', 'incomplete', 'unfinished', 'half-baked',
        
        # Technical problems
        'bug', 'bugs', 'buggy', 'glitch', 'glitches', 'glitchy',
        'slow', 'slower', 'slowest', 'lag', 'laggy', 'freeze', 'frozen',
        'crash', 'crashes', 'crashed', 'error', 'errors', 'broken',
        'not responding', 'unresponsive', 'dead', 'died', 'killed',
        
        # Quality issues
        'poor quality', 'low quality', 'cheap', 'cheaply', 'shoddy',
        'flimsy', 'weak', 'unreliable', 'unstable', 'inconsistent',
        'confusing', 'complicated', 'complex', 'difficult', 'hard to use',
        
        # Time-related negative
        'waste of time', 'time waste', 'time consuming', 'takes too long',
        'slow', 'slower', 'slowest', 'delayed', 'late', 'overdue',
        
        # Money-related negative
        'waste of money', 'money waste', 'expensive', 'overpriced',
        'costly', 'not worth it', 'not worth the money', 'rip off',
        
        # Emotional negative
        'hate', 'hated', 'hating', 'despise', 'loathe', 'abhor',
        'disgusted', 'disgusting', 'revolted', 'revolting',
        'angry', 'furious', 'enraged', 'livid', 'outraged'
    ]
    
    # Count positive and negative words
    positive_count = 0
    negative_count = 0
    
    # Check for positive words
    for word in positive_words:
        if word in text_lower:
            positive_count += 1
    
    # Check for negative words (including phrases)
    for word in negative_words:
        if word in text_lower:
            negative_count += 1
    
    # Check for negation patterns that might flip sentiment
    negation_words = ['not', 'no', 'never', 'none', 'neither', 'nor', 'cannot', "can't", "don't", "doesn't", "didn't", "won't", "wouldn't", "shouldn't", "couldn't"]
    has_negation = any(neg_word in text_lower for neg_word in negation_words)
    
    # Special handling for strong negative phrases
    strong_negative_phrases = [
        'completely useless', 'totally useless', 'absolutely useless',
        'waste of time', 'waste of money', 'does not work', 'doesn\'t work',
        'not working', 'not worth', 'not helpful', 'not useful'
    ]
    
    for phrase in strong_negative_phrases:
        if phrase in text_lower:
            negative_count += 3  # Give extra weight to strong negative phrases
    
    # Determine sentiment based on counts and context
    if negative_count > positive_count:
        return 'NEGATIVE'
    elif positive_count > negative_count:
        return 'POSITIVE'
    else:
        # If counts are equal, check for context clues
        if has_negation:
            return 'NEGATIVE'
        else:
            return 'NEUTRAL'

def huggingface_sentiment_analysis(text):
    """Use HuggingFace's free sentiment analysis API"""
    try:
        if not HUGGINGFACE_API_KEY:
            print("⚠️ HuggingFace API key not found, falling back to rule-based")
            return rule_based_sentiment_analysis(text)
        
        headers = {
            "Authorization": f"Bearer {HUGGINGFACE_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "inputs": text,
            "options": {"wait_for_model": True}
        }
        
        response = requests.post(
            "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest",
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                # Get the label with highest score
                label = result[0]['label']
                if label == 'LABEL_0':
                    return 'NEGATIVE'
                elif label == 'LABEL_1':
                    return 'NEUTRAL'
                elif label == 'LABEL_2':
                    return 'POSITIVE'
        
        # Fallback to rule-based
        return rule_based_sentiment_analysis(text)
        
    except Exception as e:
        print(f"Error with HuggingFace API: {e}")
        return rule_based_sentiment_analysis(text)

def cohere_sentiment_analysis(text):
    """Use Cohere's free sentiment analysis API"""
    try:
        if not COHERE_API_KEY:
            print("⚠️ Cohere API key not found, falling back to rule-based")
            return rule_based_sentiment_analysis(text)
        
        headers = {
            "Authorization": f"Bearer {COHERE_API_KEY}",
            "Content-Type": "application/json"
        }
        
        data = {
            "texts": [text],
            "model": "embed-english-v3.0"
        }
        
        response = requests.post(
            "https://api.cohere.ai/v1/classify",
            headers=headers,
            json=data
        )
        
        if response.status_code == 200:
            result = response.json()
            if 'classifications' in result and len(result['classifications']) > 0:
                prediction = result['classifications'][0]['prediction']
                return prediction.upper()
        
        # Fallback to rule-based
        return rule_based_sentiment_analysis(text)
        
    except Exception as e:
        print(f"Error with Cohere API: {e}")
        return rule_based_sentiment_analysis(text)

def analyze_sentiment(text):
    """Analyze sentiment using the configured method"""
    global last_api_call_time
    
    try:
        # Rate limiting protection for API calls
        current_time = time.time()
        time_since_last_call = current_time - last_api_call_time
        if time_since_last_call < api_call_interval:
            time.sleep(api_call_interval - time_since_last_call)
        
        # Choose sentiment analysis method
        if SENTIMENT_METHOD == 'openrouter' and OPENROUTER_API_KEY:
            return openrouter_sentiment_analysis(text)
        elif SENTIMENT_METHOD == 'huggingface' and HUGGINGFACE_API_KEY:
            return huggingface_sentiment_analysis(text)
        elif SENTIMENT_METHOD == 'cohere' and COHERE_API_KEY:
            return cohere_sentiment_analysis(text)
        else:
            # Default to rule-based (no API calls needed)
            return rule_based_sentiment_analysis(text)
            
    except Exception as e:
        print(f"Error analyzing sentiment: {e}")
        return 'NEUTRAL'

def openrouter_sentiment_analysis(text):
    """Analyze sentiment using OpenRouter API with Llama model"""
    global last_api_call_time
    
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        
        prompt = f"""
        Analyze the sentiment of the following text and classify it as:
        - POSITIVE: if the text expresses happiness, satisfaction, excitement, or positive emotions
        - NEGATIVE: if the text expresses anger, frustration, disappointment, or negative emotions  
        - NEUTRAL: if the text is factual, neutral, or doesn't express strong emotions

        Text: "{text}"

        Respond with only one word: POSITIVE, NEGATIVE, or NEUTRAL
        """
        
        data = {
            "model": "meta-llama/llama-3.1-8b-instruct:free",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "max_tokens": 10
        }
        
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
        last_api_call_time = time.time()
        
        if response.status_code == 429:
            print("⚠️ OpenRouter API rate limit reached, using fallback sentiment")
            return rule_based_sentiment_analysis(text)
        
        response.raise_for_status()
        
        result = response.json()
        sentiment = result['choices'][0]['message']['content'].strip().upper()
        
        # Validate sentiment
        if sentiment not in ['POSITIVE', 'NEGATIVE', 'NEUTRAL']:
            return 'NEUTRAL'
            
        return sentiment
        
    except Exception as e:
        print(f"Error with OpenRouter API: {e}")
        return rule_based_sentiment_analysis(text)

def get_community_data():
    """Fetch all posts, comments, and tags from Supabase"""
    try:
        if not supabase:
            print("❌ Supabase client not initialized")
            return {'posts': [], 'tags': []}
        
        # Get posts with user info - simplified query to avoid structure issues
        posts_response = supabase.table('posts').select('''
            id,
            content,
            type,
            created_at,
            is_anonymous,
            status,
            user_id
        ''').eq('status', 'active').execute()
        
        posts_data = posts_response.data
        
        # Get user information separately
        user_ids = list(set([post['user_id'] for post in posts_data if post.get('user_id')]))
        users_data = {}
        
        if user_ids:
            users_response = supabase.table('users').select('id, username, avatar_url').in_('id', user_ids).execute()
            for user in users_response.data:
                users_data[user['id']] = user
        
        # Get comments separately
        comments_response = supabase.table('comments').select('''
            id,
            post_id,
            content,
            created_at,
            user_id,
            status
        ''').eq('status', 'active').execute()
        
        comments_data = comments_response.data
        
        # Get reactions separately
        reactions_response = supabase.table('reactions').select('id, post_id').execute()
        reactions_data = reactions_response.data
        
        # Get tags separately
        tags_response = supabase.table('tags').select('*').execute()
        tags_data = tags_response.data
        
        # Get post_tags separately
        post_tags_response = supabase.table('post_tags').select('post_id, tag_id').execute()
        post_tags_data = post_tags_response.data
        
        # Combine the data
        for post in posts_data:
            # Add user info
            user_info = users_data.get(post['user_id'], {})
            post['user_username'] = user_info.get('username', 'Anonymous')
            post['user_avatar_url'] = user_info.get('avatar_url')
            
            # Add comments
            post['comments'] = [c for c in comments_data if c['post_id'] == post['id']]
            
            # Add reactions
            post['reactions'] = [r for r in reactions_data if r['post_id'] == post['id']]
            
            # Add tags
            post_tag_ids = [pt['tag_id'] for pt in post_tags_data if pt['post_id'] == post['id']]
            post['tags'] = [t for t in tags_data if t['id'] in post_tag_ids]
        
        return {
            'posts': posts_data,
            'tags': tags_data
        }
        
    except Exception as e:
        print(f"Error fetching community data: {e}")
        return {'posts': [], 'tags': []}

def analyze_community_sentiment():
    """Analyze sentiment for all posts and comments"""
    global sentiment_cache, last_analysis_time
    
    try:
        data = get_community_data()
        posts = data['posts']
        tags = data['tags']
        
        sentiment_results = {
            'posts_sentiment': [],
            'comments_sentiment': [],
            'tag_analysis': {},
            'overall_stats': {
                'total_posts': len(posts),
                'total_comments': 0,
                'positive_posts': 0,
                'negative_posts': 0,
                'neutral_posts': 0,
                'positive_comments': 0,
                'negative_comments': 0,
                'neutral_comments': 0
            }
        }
        
        # Analyze posts sentiment
        for post in posts:
            sentiment = analyze_sentiment(post['content'])
            sentiment_results['posts_sentiment'].append({
                'post_id': post['id'],
                'content': post['content'],
                'sentiment': sentiment,
                'user': post.get('user_username', 'Anonymous'),
                'created_at': post['created_at'],
                'type': post['type'],
                'reaction_count': len(post.get('reactions', [])),
                'comment_count': len(post.get('comments', []))
            })
            
            # Update overall stats
            if sentiment == 'POSITIVE':
                sentiment_results['overall_stats']['positive_posts'] += 1
            elif sentiment == 'NEGATIVE':
                sentiment_results['overall_stats']['negative_posts'] += 1
            else:
                sentiment_results['overall_stats']['neutral_posts'] += 1
            
            # Analyze comments for this post
            for comment in post.get('comments', []):
                comment_sentiment = analyze_sentiment(comment['content'])
                sentiment_results['comments_sentiment'].append({
                    'comment_id': comment['id'],
                    'post_id': post['id'],
                    'content': comment['content'],
                    'sentiment': comment_sentiment,
                    'user': 'Anonymous',  # We'll get user info later if needed
                    'created_at': comment['created_at']
                })
                
                sentiment_results['overall_stats']['total_comments'] += 1
                
                if comment_sentiment == 'POSITIVE':
                    sentiment_results['overall_stats']['positive_comments'] += 1
                elif comment_sentiment == 'NEGATIVE':
                    sentiment_results['overall_stats']['negative_comments'] += 1
                else:
                    sentiment_results['overall_stats']['neutral_comments'] += 1
        
        # Analyze tags
        tag_stats = {}
        print(f"🔍 Analyzing {len(tags)} tags...")
        
        # Normalize tag names to prevent duplicates
        normalized_tags = {}
        for tag in tags:
            # Normalize to title case and remove extra spaces
            normalized_name = tag['name'].strip().title()
            if normalized_name not in normalized_tags:
                normalized_tags[normalized_name] = tag
            else:
                # If duplicate found, merge the tag IDs
                print(f"  🔄 Found duplicate tag: '{tag['name']}' -> '{normalized_name}'")
        
        print(f"  📊 After normalization: {len(normalized_tags)} unique tags")
        
        for normalized_name, tag in normalized_tags.items():
            print(f"  📊 Processing tag: {normalized_name} (original: {tag['name']})")
            
            # Find posts that have this tag (check both original and normalized names)
            tag_posts = []
            for post in posts:
                post_tags = post.get('tags', [])
                # Check if any post tag matches this tag (case insensitive)
                if any(t.get('id') == tag['id'] or 
                       t.get('name', '').strip().title() == normalized_name 
                       for t in post_tags):
                    tag_posts.append(post)
            
            print(f"    Found {len(tag_posts)} posts with tag '{normalized_name}'")
            
            positive_count = 0
            negative_count = 0
            neutral_count = 0
            
            # Count sentiment for posts with this tag
            for post in tag_posts:
                # Find the sentiment for this post
                post_sentiment = None
                for sentiment_post in sentiment_results['posts_sentiment']:
                    if sentiment_post['post_id'] == post['id']:
                        post_sentiment = sentiment_post['sentiment']
                        break
                
                if post_sentiment == 'POSITIVE':
                    positive_count += 1
                elif post_sentiment == 'NEGATIVE':
                    negative_count += 1
                    print(f"      🚨 NEGATIVE post in '{normalized_name}': {post['content'][:50]}...")
                else:
                    neutral_count += 1
            
            # Only include tags that have posts
            if len(tag_posts) > 0:
                tag_stats[normalized_name] = {
                    'total_posts': len(tag_posts),
                    'positive': positive_count,
                    'negative': negative_count,
                    'neutral': neutral_count
                }
                print(f"    📈 Tag '{normalized_name}' stats: {positive_count} positive, {negative_count} negative, {neutral_count} neutral")
        
        print(f"📊 Final tag analysis: {len(tag_stats)} tags with posts")
        for tag_name, stats in tag_stats.items():
            print(f"  - {tag_name}: {stats['total_posts']} posts ({stats['negative']} negative)")
        
        # If no tags have posts, create a default entry
        if not tag_stats:
            tag_stats = {
                'General': {
                    'total_posts': sentiment_results['overall_stats']['total_posts'],
                    'positive': sentiment_results['overall_stats']['positive_posts'],
                    'negative': sentiment_results['overall_stats']['negative_posts'],
                    'neutral': sentiment_results['overall_stats']['neutral_posts']
                }
            }
        
        sentiment_results['tag_analysis'] = tag_stats
        
        # Update cache
        sentiment_cache = sentiment_results
        last_analysis_time = datetime.now()
        
        return sentiment_results
        
    except Exception as e:
        print(f"Error in community sentiment analysis: {e}")
        return None

def generate_recommendations(sentiment_data):
    """Generate recommendations based on sentiment analysis"""
    try:
        if not sentiment_data:
            return "Unable to generate recommendations due to data issues."
        
        stats = sentiment_data['overall_stats']
        
        # Simple recommendations based on data
        recommendations = []
        
        if stats['total_posts'] == 0:
            return "No posts found to analyze. Consider encouraging community engagement."
        
        positive_percentage = (stats['positive_posts'] + stats['positive_comments']) / (stats['total_posts'] + stats['total_comments']) * 100
        negative_percentage = (stats['negative_posts'] + stats['negative_comments']) / (stats['total_posts'] + stats['total_comments']) * 100
        
        recommendations.append(f"1. Community Sentiment Overview: {positive_percentage:.1f}% positive, {negative_percentage:.1f}% negative")
        
        if negative_percentage > 20:
            recommendations.append("2. Consider implementing content moderation guidelines to reduce negative sentiment")
            recommendations.append("3. Encourage positive community interactions through gamification")
        
        if stats['total_posts'] < 10:
            recommendations.append("4. Boost community engagement with regular prompts and discussions")
        
        recommendations.append("5. Monitor sentiment trends regularly to identify improvement areas")
        recommendations.append("6. Consider implementing a community feedback system")
        recommendations.append("7. Encourage constructive discussions and discourage toxic behavior")
        
        return "\n".join(recommendations)
        
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return "Unable to generate recommendations at this time."

@app.route('/api/sentiment-analysis', methods=['GET'])
def get_sentiment_analysis():
    """Get comprehensive sentiment analysis"""
    global sentiment_cache, last_analysis_time
    
    try:
        # Check if force refresh is requested
        force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'
        
        # Check if we need to refresh the cache (every 5 minutes or if no cache exists or force refresh)
        if (force_refresh or 
            sentiment_cache is None or 
            last_analysis_time is None or 
            (datetime.now() - last_analysis_time).total_seconds() > 300):
            
            print("🔄 Refreshing sentiment analysis cache...")
            sentiment_data = analyze_community_sentiment()
            if not sentiment_data:
                return jsonify({'error': 'Failed to analyze sentiment'}), 500
        else:
            print("📋 Using cached sentiment data...")
            sentiment_data = sentiment_cache
        
        recommendations = generate_recommendations(sentiment_data)
        
        return jsonify({
            'sentiment_data': sentiment_data,
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat(),
            'cache_age': (datetime.now() - last_analysis_time).total_seconds() if last_analysis_time else 0,
            'force_refresh_used': force_refresh
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/webhook/database-change', methods=['POST'])
def handle_database_change():
    """Handle database change webhook from Supabase"""
    global sentiment_cache, last_analysis_time
    
    try:
        # Invalidate cache to force refresh
        sentiment_cache = None
        last_analysis_time = None
        
        print("Database change detected, cache invalidated")
        
        return jsonify({'status': 'success', 'message': 'Cache invalidated'}), 200
        
    except Exception as e:
        print(f"Error handling webhook: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy', 
        'timestamp': datetime.now().isoformat(),
        'cache_status': 'valid' if sentiment_cache is not None else 'invalid',
        'last_analysis': last_analysis_time.isoformat() if last_analysis_time else None,
        'supabase_status': 'connected' if supabase else 'disconnected'
    })

@app.route('/api/test-sentiment', methods=['POST'])
def test_sentiment():
    """Test sentiment analysis with custom text"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Test with different methods
        rule_based_result = rule_based_sentiment_analysis(text)
        
        result = {
            'text': text,
            'rule_based_sentiment': rule_based_result,
            'method_used': SENTIMENT_METHOD,
            'timestamp': datetime.now().isoformat()
        }
        
        # Add API-based results if available
        if SENTIMENT_METHOD == 'huggingface' and HUGGINGFACE_API_KEY:
            try:
                api_result = huggingface_sentiment_analysis(text)
                result['api_sentiment'] = api_result
            except Exception as e:
                result['api_error'] = str(e)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug-data', methods=['GET'])
def debug_data():
    """Debug endpoint to inspect current data"""
    try:
        data = get_community_data()
        posts = data['posts']
        tags = data['tags']
        
        # Analyze sentiment for all posts
        posts_with_sentiment = []
        for post in posts:
            sentiment = analyze_sentiment(post['content'])
            # Normalize the tags for this post
            normalized_post_tags = []
            for tag in post.get('tags', []):
                normalized_name = tag.get('name', '').strip().title()
                if normalized_name and normalized_name not in normalized_post_tags:
                    normalized_post_tags.append(normalized_name)
            
            posts_with_sentiment.append({
                'id': post['id'],
                'content': post['content'][:100] + '...' if len(post['content']) > 100 else post['content'],
                'sentiment': sentiment,
                'tags': normalized_post_tags,
                'user': post.get('user_username', 'Anonymous')
            })
        
        # Show tag analysis
        tag_analysis = {}
        normalized_tags = {}
        
        # First, normalize all tags
        for tag in tags:
            normalized_name = tag['name'].strip().title()
            if normalized_name not in normalized_tags:
                normalized_tags[normalized_name] = tag
        
        for normalized_name, tag in normalized_tags.items():
            tag_posts = []
            for post in posts:
                post_tags = post.get('tags', [])
                if any(t.get('id') == tag['id'] or 
                       t.get('name', '').strip().title() == normalized_name 
                       for t in post_tags):
                    tag_posts.append(post)
            
            if len(tag_posts) > 0:
                positive_count = 0
                negative_count = 0
                neutral_count = 0
                
                for post in tag_posts:
                    sentiment = analyze_sentiment(post['content'])
                    if sentiment == 'POSITIVE':
                        positive_count += 1
                    elif sentiment == 'NEGATIVE':
                        negative_count += 1
                    else:
                        neutral_count += 1
                
                tag_analysis[normalized_name] = {
                    'total_posts': len(tag_posts),
                    'positive': positive_count,
                    'negative': negative_count,
                    'neutral': neutral_count,
                    'posts': [p['content'][:50] + '...' for p in tag_posts],
                    'original_name': tag['name']
                }
        
        return jsonify({
            'total_posts': len(posts),
            'total_tags': len(tags),
            'posts_with_sentiment': posts_with_sentiment,
            'tag_analysis': tag_analysis,
            'all_tags': [t['name'] for t in tags],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"🚀 Starting Community Sentiment Analyzer on port {port}")
    print(f"📊 Dashboard: http://localhost:3002")
    print(f"🔍 Health Check: http://localhost:{port}/api/health")
    app.run(host='0.0.0.0', port=port, debug=True) 