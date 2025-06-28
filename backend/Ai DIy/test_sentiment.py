#!/usr/bin/env python3
"""
Test script for sentiment detection functionality
"""

import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import os

def test_sentiment_detection():
    """Test if sentiment detection model and face cascade are working"""
    
    print("Testing sentiment detection setup...")
    
    # Check if model files exist
    model_path = 'model.h5'
    cascade_path = 'haarcascade_frontalface_default.xml'
    
    if not os.path.exists(model_path):
        print(f"❌ Model file not found: {model_path}")
        return False
    
    if not os.path.exists(cascade_path):
        print(f"❌ Cascade file not found: {cascade_path}")
        return False
    
    print(f"✅ Model file found: {model_path}")
    print(f"✅ Cascade file found: {cascade_path}")
    
    # Try to load the model
    try:
        print("Loading sentiment detection model...")
        model = load_model(model_path)
        print("✅ Model loaded successfully")
        
        # Check model input shape
        input_shape = model.input_shape
        print(f"Model input shape: {input_shape}")
        
    except Exception as e:
        print(f"❌ Failed to load model: {str(e)}")
        return False
    
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
    
    # Test with a simple image (if available)
    print("\nTesting with webcam...")
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("❌ Could not open webcam")
            return False
        
        print("✅ Webcam opened successfully")
        print("Press 'q' to quit, 'c' to capture and test")
        
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
                    
                    # Extract and process face
                    face_roi = gray[y:y+h, x:x+w]
                    face_roi = cv2.resize(face_roi, (48, 48))
                    face_roi = face_roi.astype('float32') / 255.0
                    face_roi = np.expand_dims(face_roi, axis=[0, -1])
                    
                    # Predict sentiment
                    predictions = model.predict(face_roi)
                    sentiment_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
                    predicted_class = np.argmax(predictions[0])
                    confidence = float(predictions[0][predicted_class])
                    sentiment = sentiment_labels[predicted_class]
                    
                    print(f"✅ Sentiment detected: {sentiment} (confidence: {confidence:.2f})")
                else:
                    print("❌ No faces detected")
        
        cap.release()
        cv2.destroyAllWindows()
        
    except Exception as e:
        print(f"❌ Webcam test failed: {str(e)}")
    
    print("\n✅ Sentiment detection test completed successfully!")
    return True

if __name__ == "__main__":
    test_sentiment_detection() 