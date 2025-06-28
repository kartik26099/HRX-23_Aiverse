#!/usr/bin/env python3
"""
Simple camera test script
"""

import cv2
import os

def test_camera():
    """Test if camera can be accessed and face detection works"""
    
    print("Testing camera access...")
    
    # Check if cascade file exists
    cascade_path = 'haarcascade_frontalface_default.xml'
    if not os.path.exists(cascade_path):
        print(f"❌ Cascade file not found: {cascade_path}")
        return False
    
    print(f"✅ Cascade file found: {cascade_path}")
    
    # Try to load face cascade
    try:
        face_cascade = cv2.CascadeClassifier(cascade_path)
        if face_cascade.empty():
            print("❌ Failed to load cascade classifier")
            return False
        print("✅ Face cascade loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load cascade: {str(e)}")
        return False
    
    # Test camera access
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("❌ Could not open camera")
            return False
        
        print("✅ Camera opened successfully")
        print("Press 'q' to quit, 'c' to test face detection")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Failed to read from camera")
                break
            
            # Display the frame
            cv2.imshow('Camera Test', frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('c'):
                # Test face detection
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                
                if len(faces) > 0:
                    print(f"✅ Detected {len(faces)} face(s)")
                    # Draw rectangles around faces
                    for (x, y, w, h) in faces:
                        cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
                else:
                    print("❌ No faces detected")
        
        cap.release()
        cv2.destroyAllWindows()
        
    except Exception as e:
        print(f"❌ Camera test failed: {str(e)}")
        return False
    
    print("\n✅ Camera test completed successfully!")
    return True

if __name__ == "__main__":
    test_camera() 