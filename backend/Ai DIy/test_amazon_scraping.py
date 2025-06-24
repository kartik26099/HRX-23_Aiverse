#!/usr/bin/env python3
"""
Test script for Amazon scraping functionality
"""

import os
import sys
import json
from app import scrape_amazon_components

def test_amazon_scraping():
    """Test the Amazon scraping functionality with common hardware components"""
    
    # Test components
    test_components = [
        "Arduino Uno",
        "Breadboard",
        "LED kit",
        "Jumper wires",
        "Resistor kit"
    ]
    
    print("Testing Amazon scraping functionality...")
    print("=" * 50)
    
    for component in test_components:
        print(f"\nTesting component: {component}")
        try:
            result = scrape_amazon_components(component)
            if result:
                print(f"✅ Success! Found product:")
                print(f"   Title: {result.get('title', 'N/A')}")
                print(f"   Price: {result.get('price', 'N/A')}")
                print(f"   Rating: {result.get('rating', 'N/A')}")
                print(f"   Reviews: {result.get('reviews', 'N/A')}")
                print(f"   URL: {result.get('url', 'N/A')[:100]}...")
                print(f"   Availability: {result.get('availability', 'N/A')}")
            else:
                print(f"❌ No results found for {component}")
        except Exception as e:
            print(f"❌ Error scraping {component}: {str(e)}")
    
    print("\n" + "=" * 50)
    print("Test completed!")

if __name__ == "__main__":
    # Set up environment
    if not os.getenv('SCRAPINGDOG_API_KEY'):
        print("Warning: SCRAPINGDOG_API_KEY not set. Using default key from app.py")
    
    test_amazon_scraping() 