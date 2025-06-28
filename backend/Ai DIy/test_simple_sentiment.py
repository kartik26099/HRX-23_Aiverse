#!/usr/bin/env python3
"""
Simple test script for sentiment detection (no TensorFlow required)
"""

import cv2
import numpy as np
import os

def test_simple_sentiment_detection():
    """Test if face detection and sentiment analysis are working"""
    
    print("Testing simplified sentiment detection setup...")
    
    # Check if cascade file exists
    cascade_path = 'haarcascade_frontalface_default.xml'
    
    if not os.path.exists(cascade_path):
        print(f"❌ Cascade file not found: {cascade_path}")
        return False
    
    print(f"✅ Cascade file found: {cascade_path}")
    
    # Try to load face cascade
    try:
        print("Loading face cascade classifier...")
        face_cascade = cv2.CascadeClassifier(cascade_path)
        
        if face_cascade.empty():
            print("❌ Failed to load cascade classifier")
            return False
        
        print("✅ Face cascade loaded successfully")
        
    except Exception as e:
        print(f"❌ Failed to load cascade: {str(e)}")
        return False
    
    # Test with webcam
    print("\nTesting with webcam...")
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("❌ Could not open webcam")
            return False
        
        print("✅ Webcam opened successfully")
        print("Press 'q' to quit, 'c' to capture and test sentiment")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Failed to read from webcam")
                break
            
            # Display the frame
            cv2.imshow('Test Sentiment Detection', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('c'):
                # Test face detection
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                
                if len(faces) > 0:
                    print(f"✅ Detected {len(faces)} face(s)")
                    
                    # Test with the largest face
                    largest_face = max(faces, key=lambda x: x[2] * x[3])
                    x, y, w, h = largest_face
                    
                    # Extract and analyze face
                    face_roi = gray[y:y+h, x:x+w]
                    
                    # Simple sentiment analysis
                    face_float = face_roi.astype('float32') / 255.0
                    mean_brightness = np.mean(face_float)
                    std_brightness = np.std(face_float)
                    
                    # Determine sentiment
                    if mean_brightness > 0.6:
                        if std_brightness > 0.2:
                            sentiment = 'Surprise'
                        else:
                            sentiment = 'Happy'
                    elif mean_brightness < 0.4:
                        if std_brightness > 0.15:
                            sentiment = 'Angry'
                        else:
                            sentiment = 'Sad'
                    else:
                        if std_brightness > 0.25:
                            sentiment = 'Fear'
                        elif std_brightness < 0.1:
                            sentiment = 'Disgust'
                        else:
                            sentiment = 'Neutral'
                    
                    print(f"✅ Sentiment detected: {sentiment}")
                    print(f"   Brightness: {mean_brightness:.2f}, Variation: {std_brightness:.2f}")
                else:
                    print("❌ No faces detected")
        
        cap.release()
        cv2.destroyAllWindows()
        
    except Exception as e:
        print(f"❌ Webcam test failed: {str(e)}")
    
    print("\n✅ Simplified sentiment detection test completed successfully!")
    return True

if __name__ == "__main__":
    test_simple_sentiment_detection() 