#!/usr/bin/env python3
"""
Test script to verify emotion detector works in Flask context
"""

import os
import sys
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

print("🔍 Testing emotion detector in Flask context...")

try:
    # Import Flask and create app context
    from flask import Flask
    app = Flask(__name__)
    
    with app.app_context():
        print("📦 Importing emotion_detector module in Flask context...")
        from emotion_detector import EmotionDetector
        print("✅ Successfully imported emotion_detector module")
        
        print("🧠 Creating EmotionDetector instance in Flask context...")
        detector = EmotionDetector()
        print("✅ Successfully created EmotionDetector instance in Flask context")
        
        # Test emotion detection
        import numpy as np
        from PIL import Image, ImageDraw
        import base64
        import io
        
        # Create a simple test image
        img = Image.new('RGB', (224, 224), color='gray')
        draw = ImageDraw.Draw(img)
        
        # Draw a simple face
        draw.ellipse([50, 50, 174, 174], fill='white')  # Face
        draw.ellipse([70, 70, 100, 100], fill='black')   # Left eye
        draw.ellipse([124, 70, 154, 100], fill='black')  # Right eye
        draw.arc([70, 100, 154, 140], 0, 180, fill='black', width=3)  # Smile
        
        # Convert to base64
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='JPEG')
        img_data = base64.b64encode(img_buffer.getvalue()).decode()
        
        print("📸 Testing emotion detection in Flask context...")
        result = detector.detect_emotion_from_image(img_data)
        print("🎭 Emotion detection result:", result)
        
        if result['success']:
            print(f"✅ Emotion detected: {result['emotion']} (confidence: {result['confidence']:.3f})")
        else:
            print(f"❌ Emotion detection failed: {result['error']}")
    
except Exception as e:
    print(f"❌ Error in Flask context: {str(e)}")
    import traceback
    traceback.print_exc() 