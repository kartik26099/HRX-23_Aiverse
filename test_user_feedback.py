#!/usr/bin/env python3
"""
Test script for the user's specific feedback case
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'community_sentiment_analyzer'))

from app import rule_based_sentiment_analysis

def test_user_feedback():
    """Test the user's specific feedback"""
    
    user_feedback = "This tool is completely useless. It wasted my time and gave me nothing of value."
    
    print("🧪 Testing User's Negative Feedback")
    print("=" * 50)
    print(f"Text: \"{user_feedback}\"")
    
    # Test the sentiment
    result = rule_based_sentiment_analysis(user_feedback)
    
    print(f"Result: {result}")
    
    if result == "NEGATIVE":
        print("✅ SUCCESS: Correctly detected as NEGATIVE")
        return True
    else:
        print("❌ FAILED: Should be NEGATIVE but got", result)
        
        # Debug: show what words were detected
        text_lower = user_feedback.lower()
        
        negative_words_found = []
        positive_words_found = []
        
        # Check for negative words
        negative_words = [
            'completely useless', 'totally useless', 'absolutely useless',
            'wasted', 'wasting', 'wastes', 'waste of time', 'waste of money',
            'pointless', 'meaningless', 'worthless', 'valueless',
            'useless', 'waste', 'stupid', 'ridiculous', 'nonsense', 'garbage'
        ]
        
        for word in negative_words:
            if word in text_lower:
                negative_words_found.append(word)
        
        # Check for positive words
        positive_words = [
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
            'love', 'like', 'enjoy', 'happy', 'excited', 'thrilled', 'perfect', 'best',
            'helpful', 'useful', 'brilliant', 'outstanding', 'superb', 'incredible'
        ]
        
        for word in positive_words:
            if word in text_lower:
                positive_words_found.append(word)
        
        print(f"\nDebug Info:")
        print(f"Negative words found: {negative_words_found}")
        print(f"Positive words found: {positive_words_found}")
        
        return False

def test_similar_phrases():
    """Test similar negative phrases"""
    
    print("\n🔍 Testing Similar Negative Phrases")
    print("=" * 40)
    
    test_phrases = [
        "This tool is completely useless",
        "It wasted my time",
        "gave me nothing of value",
        "This is completely useless",
        "It's a waste of time",
        "This tool is totally useless",
        "This tool is absolutely useless"
    ]
    
    for phrase in test_phrases:
        result = rule_based_sentiment_analysis(phrase)
        status = "✅" if result == "NEGATIVE" else "❌"
        print(f"{status} \"{phrase}\" -> {result}")

if __name__ == "__main__":
    success = test_user_feedback()
    test_similar_phrases()
    
    if not success:
        print("\n⚠️  The sentiment analysis needs improvement!")
        sys.exit(1)
    else:
        print("\n🎉 User feedback correctly detected as negative!") 