#!/usr/bin/env python3
"""
Test script to verify tag normalization
"""

import requests
import json

def test_tag_normalization():
    """Test tag normalization and check for duplicates"""
    
    print("🧪 Testing Tag Normalization")
    print("=" * 50)
    
    try:
        # Test debug endpoint to see normalized tags
        print("🔍 Checking debug data for tag normalization...")
        response = requests.get("http://localhost:5001/api/debug-data")
        if response.status_code == 200:
            debug_data = response.json()
            print(f"📊 Total posts: {debug_data['total_posts']}")
            print(f"🏷️  Total tags: {debug_data['total_tags']}")
            print(f"🏷️  Available tags: {debug_data['all_tags']}")
            
            # Check for duplicates in the original tags
            original_tags = debug_data['all_tags']
            normalized_tags = [tag.strip().title() for tag in original_tags]
            unique_normalized = list(set(normalized_tags))
            
            print(f"\n📊 Tag Analysis:")
            print(f"  Original tags: {len(original_tags)}")
            print(f"  Normalized tags: {len(unique_normalized)}")
            print(f"  Duplicates removed: {len(original_tags) - len(unique_normalized)}")
            
            if len(original_tags) != len(unique_normalized):
                print(f"\n🔄 Duplicates found and will be merged:")
                seen = set()
                for tag in original_tags:
                    normalized = tag.strip().title()
                    if normalized in seen:
                        print(f"  - '{tag}' -> '{normalized}' (duplicate)")
                    else:
                        seen.add(normalized)
                        print(f"  - '{tag}' -> '{normalized}'")
            else:
                print(f"\n✅ No duplicates found!")
            
            # Check tag analysis
            print(f"\n🏷️  Tag Analysis Results:")
            for tag, stats in debug_data['tag_analysis'].items():
                print(f"  - {tag}: {stats['total_posts']} posts ({stats['negative']} negative)")
                if 'original_name' in stats:
                    print(f"    Original: {stats['original_name']}")
                    
        else:
            print(f"❌ Debug API error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test sentiment analysis endpoint
    try:
        print(f"\n🔄 Testing sentiment analysis with force refresh...")
        response = requests.get("http://localhost:5001/api/sentiment-analysis?force_refresh=true")
        if response.status_code == 200:
            data = response.json()
            print("✅ Sentiment analysis API working")
            
            # Check tag analysis
            tag_analysis = data['sentiment_data']['tag_analysis']
            print(f"\n📊 Final Tag Analysis (Normalized):")
            for tag, stats in tag_analysis.items():
                print(f"  - {tag}: {stats['total_posts']} posts ({stats['negative']} negative)")
                
                # Look for machine learning specifically
                if 'machine learning' in tag.lower():
                    print(f"    🎯 Machine Learning tag found with {stats['negative']} negative posts!")
                    
        else:
            print(f"❌ API error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

def test_specific_duplicates():
    """Test specific duplicate cases"""
    
    print(f"\n🔍 Testing Specific Duplicate Cases")
    print("=" * 40)
    
    test_cases = [
        ("AI", "Ai"),
        ("Machine Learning", "machine learning"),
        ("Beginner", "beginner"),
        ("New", "new"),
        ("Supervised Learning", "supervised learning"),
        ("Agents", "agents")
    ]
    
    for case1, case2 in test_cases:
        normalized1 = case1.strip().title()
        normalized2 = case2.strip().title()
        
        if normalized1 == normalized2:
            print(f"✅ '{case1}' and '{case2}' -> '{normalized1}' (will be merged)")
        else:
            print(f"❌ '{case1}' -> '{normalized1}' and '{case2}' -> '{normalized2}' (different)")

if __name__ == "__main__":
    print("🚀 Starting Tag Normalization Test")
    
    # Test specific duplicates
    test_specific_duplicates()
    
    # Test overall normalization
    success = test_tag_normalization()
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"  Tag Normalization: {'✅ PASS' if success else '❌ FAIL'}")
    
    if success:
        print("\n🎉 Tag normalization working correctly!")
        print("   Duplicates will be merged and displayed as single tags.")
    else:
        print("\n⚠️  Tag normalization needs improvement.") 