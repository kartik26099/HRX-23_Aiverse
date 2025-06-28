#!/usr/bin/env python3
"""
Test script for sentiment analysis detection
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'community_sentiment_analyzer'))

from app import rule_based_sentiment_analysis

def test_sentiment_detection():
    """Test various sentiment detection cases"""
    
    test_cases = [
        # Your specific case
        {
            "text": "This tool is completely useless. It wasted my time and gave me nothing of value.",
            "expected": "NEGATIVE",
            "description": "User's negative feedback"
        },
        
        # Strong negative cases
        {
            "text": "This is absolutely terrible and a complete waste of time.",
            "expected": "NEGATIVE",
            "description": "Strong negative with 'absolutely' and 'waste of time'"
        },
        {
            "text": "I hate this tool. It doesn't work at all.",
            "expected": "NEGATIVE",
            "description": "Hate + doesn't work"
        },
        {
            "text": "This is completely useless and broken.",
            "expected": "NEGATIVE",
            "description": "Completely useless + broken"
        },
        
        # Positive cases
        {
            "text": "This tool is amazing! It helped me solve my problem quickly.",
            "expected": "POSITIVE",
            "description": "Positive feedback with 'amazing' and 'helped'"
        },
        {
            "text": "I love this feature. It's very useful and working perfectly.",
            "expected": "POSITIVE",
            "description": "Love + useful + working"
        },
        
        # Neutral cases
        {
            "text": "This is a tool that does what it says.",
            "expected": "NEUTRAL",
            "description": "Neutral statement"
        },
        {
            "text": "I used the tool and it processed my request.",
            "expected": "NEUTRAL",
            "description": "Factual statement"
        },
        
        # Edge cases
        {
            "text": "This is not bad at all.",
            "expected": "POSITIVE",
            "description": "Negation of negative"
        },
        {
            "text": "This is not good.",
            "expected": "NEGATIVE",
            "description": "Negation of positive"
        },
        
        # Technical issues
        {
            "text": "The app keeps crashing and freezing. It's buggy and slow.",
            "expected": "NEGATIVE",
            "description": "Technical problems"
        },
        {
            "text": "It's expensive and overpriced for what it does.",
            "expected": "NEGATIVE",
            "description": "Cost complaints"
        }
    ]
    
    print("🧪 Testing Sentiment Analysis Detection")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    for i, test_case in enumerate(test_cases, 1):
        text = test_case["text"]
        expected = test_case["expected"]
        description = test_case["description"]
        
        # Get actual result
        actual = rule_based_sentiment_analysis(text)
        
        # Check if passed
        if actual == expected:
            status = "✅ PASS"
            passed += 1
        else:
            status = "❌ FAIL"
            failed += 1
        
        print(f"\n{i}. {status} - {description}")
        print(f"   Text: \"{text}\"")
        print(f"   Expected: {expected}")
        print(f"   Actual: {actual}")
        
        if actual != expected:
            print(f"   ❌ Mismatch!")
    
    print("\n" + "=" * 60)
    print(f"📊 Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All tests passed! Sentiment analysis is working correctly.")
    else:
        print(f"⚠️  {failed} tests failed. Sentiment analysis needs improvement.")
    
    return failed == 0

def test_specific_phrases():
    """Test specific phrases that should be detected"""
    
    print("\n🔍 Testing Specific Phrases")
    print("=" * 40)
    
    phrases_to_test = [
        "completely useless",
        "totally useless", 
        "absolutely useless",
        "waste of time",
        "waste of money",
        "does not work",
        "doesn't work",
        "not working",
        "not worth it",
        "not helpful",
        "not useful"
    ]
    
    for phrase in phrases_to_test:
        result = rule_based_sentiment_analysis(phrase)
        status = "✅" if result == "NEGATIVE" else "❌"
        print(f"{status} \"{phrase}\" -> {result}")

if __name__ == "__main__":
    # Test general sentiment detection
    success = test_sentiment_detection()
    
    # Test specific phrases
    test_specific_phrases()
    
    if not success:
        sys.exit(1) 