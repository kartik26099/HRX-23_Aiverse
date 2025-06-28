import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import img_to_array
import os
import logging
import base64
from PIL import Image
import io

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmotionDetector:
    def __init__(self):
        """Initialize the emotion detector with the pre-trained model"""
        try:
            # Load the face cascade classifier
            cascade_path = os.path.join(os.path.dirname(__file__), 'haarcascade_frontalface_default.xml')
            self.face_classifier = cv2.CascadeClassifier(cascade_path)
            
            # Load the emotion detection model
            model_path = os.path.join(os.path.dirname(__file__), 'model.h5')
            self.classifier = load_model(model_path)
            
            # Define emotion labels
            self.emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']
            
            # Define mood-based project adjustments
            self.mood_adjustments = {
                'Angry': {
                    'message': 'You look frustrated. Would you like a simpler project to start with?',
                    'adjustment': 'simpler',
                    'difficulty_reduction': 0.3
                },
                'Disgust': {
                    'message': 'You seem unimpressed. Would you like a more challenging project?',
                    'adjustment': 'more_challenging',
                    'difficulty_increase': 0.2
                },
                'Fear': {
                    'message': 'You look worried. Would you like a step-by-step guided project?',
                    'adjustment': 'guided',
                    'difficulty_reduction': 0.4
                },
                'Happy': {
                    'message': 'You look excited! Would you like to try a more advanced project?',
                    'adjustment': 'advanced',
                    'difficulty_increase': 0.3
                },
                'Neutral': {
                    'message': 'You seem focused. Would you like to continue with the current project?',
                    'adjustment': 'continue',
                    'difficulty_change': 0.0
                },
                'Sad': {
                    'message': 'You look a bit down. Would you like a fun and engaging project?',
                    'adjustment': 'fun',
                    'difficulty_reduction': 0.2
                },
                'Surprise': {
                    'message': 'You look surprised! Would you like a project that matches your excitement?',
                    'adjustment': 'exciting',
                    'difficulty_increase': 0.1
                }
            }
            
            logger.info("Emotion detector initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing emotion detector: {str(e)}")
            raise
    
    def detect_emotion_from_image(self, image_data):
        """
        Detect emotion from a base64 encoded image
        
        Args:
            image_data (str): Base64 encoded image data
            
        Returns:
            dict: Emotion detection results
        """
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert PIL image to OpenCV format
            opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            
            # Convert to grayscale for face detection
            gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.face_classifier.detectMultiScale(gray, 1.1, 4)
            
            if len(faces) == 0:
                return {
                    'success': False,
                    'error': 'No face detected in the image',
                    'emotion': None,
                    'confidence': 0.0
                }
            
            # Process the first detected face
            (x, y, w, h) = faces[0]
            
            # Extract face region
            roi_gray = gray[y:y+h, x:x+w]
            roi_gray = cv2.resize(roi_gray, (48, 48), interpolation=cv2.INTER_AREA)
            
            # Check if the face region has content
            if np.sum([roi_gray]) == 0:
                return {
                    'success': False,
                    'error': 'Face region is empty',
                    'emotion': None,
                    'confidence': 0.0
                }
            
            # Preprocess the image for the model
            roi = roi_gray.astype('float') / 255.0
            roi = img_to_array(roi)
            roi = np.expand_dims(roi, axis=0)
            
            # Make prediction
            prediction = self.classifier.predict(roi, verbose=0)[0]
            emotion_index = prediction.argmax()
            emotion = self.emotion_labels[emotion_index]
            confidence = float(prediction[emotion_index])
            
            logger.info(f"Detected emotion: {emotion} with confidence: {confidence:.3f}")
            
            return {
                'success': True,
                'emotion': emotion,
                'confidence': confidence,
                'all_predictions': {
                    label: float(pred) for label, pred in zip(self.emotion_labels, prediction)
                }
            }
            
        except Exception as e:
            logger.error(f"Error detecting emotion: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'emotion': None,
                'confidence': 0.0
            }
    
    def get_mood_adjustment(self, emotion):
        """
        Get mood-based project adjustment based on detected emotion
        
        Args:
            emotion (str): Detected emotion
            
        Returns:
            dict: Mood adjustment information
        """
        if emotion in self.mood_adjustments:
            return self.mood_adjustments[emotion]
        else:
            # Default to neutral if emotion not found
            return self.mood_adjustments['Neutral']
    
    def capture_emotion_from_camera(self, capture_duration=3):
        """
        Capture emotion from camera for a specified duration
        
        Args:
            capture_duration (int): Duration to capture in seconds
            
        Returns:
            dict: Emotion detection results
        """
        try:
            cap = cv2.VideoCapture(0)
            
            if not cap.isOpened():
                return {
                    'success': False,
                    'error': 'Could not open camera',
                    'emotion': None,
                    'confidence': 0.0
                }
            
            # Set camera properties
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            
            emotions_detected = []
            start_time = cv2.getTickCount()
            
            logger.info(f"Starting emotion capture for {capture_duration} seconds...")
            
            # For continuous detection, we might want to show the camera feed
            show_feed = capture_duration > 2  # Only show feed for longer captures
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Convert to grayscale for face detection
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = self.face_classifier.detectMultiScale(gray, 1.1, 4)
                
                # Draw rectangle around detected face
                for (x, y, w, h) in faces:
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 255), 2)
                    
                    # Extract and process face region
                    roi_gray = gray[y:y+h, x:x+w]
                    roi_gray = cv2.resize(roi_gray, (48, 48), interpolation=cv2.INTER_AREA)
                    
                    if np.sum([roi_gray]) != 0:
                        roi = roi_gray.astype('float') / 255.0
                        roi = img_to_array(roi)
                        roi = np.expand_dims(roi, axis=0)
                        
                        # Make prediction
                        prediction = self.classifier.predict(roi, verbose=0)[0]
                        emotion_index = prediction.argmax()
                        emotion = self.emotion_labels[emotion_index]
                        confidence = float(prediction[emotion_index])
                        
                        # Display emotion on frame
                        cv2.putText(frame, f"{emotion}: {confidence:.2f}", 
                                   (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                        
                        # Store emotion if confidence is high enough
                        if confidence > 0.3:
                            emotions_detected.append({
                                'emotion': emotion,
                                'confidence': confidence
                            })
                
                # Display frame only for longer captures
                if show_feed:
                    cv2.imshow('Emotion Detection - Press Q to stop early', frame)
                
                # Check if time is up or user pressed 'q'
                current_time = cv2.getTickCount()
                elapsed_time = (current_time - start_time) / cv2.getTickFrequency()
                
                if elapsed_time >= capture_duration or (show_feed and cv2.waitKey(1) & 0xFF == ord('q')):
                    break
            
            # Clean up
            cap.release()
            if show_feed:
                cv2.destroyAllWindows()
            
            # Analyze results
            if not emotions_detected:
                return {
                    'success': False,
                    'error': 'No emotions detected during capture period',
                    'emotion': None,
                    'confidence': 0.0
                }
            
            # Get the most frequent emotion with highest average confidence
            emotion_counts = {}
            emotion_confidences = {}
            
            for detection in emotions_detected:
                emotion = detection['emotion']
                confidence = detection['confidence']
                
                if emotion not in emotion_counts:
                    emotion_counts[emotion] = 0
                    emotion_confidences[emotion] = []
                
                emotion_counts[emotion] += 1
                emotion_confidences[emotion].append(confidence)
            
            # Find the most frequent emotion
            most_frequent_emotion = max(emotion_counts, key=emotion_counts.get)
            avg_confidence = np.mean(emotion_confidences[most_frequent_emotion])
            
            logger.info(f"Most frequent emotion: {most_frequent_emotion} (count: {emotion_counts[most_frequent_emotion]}, avg confidence: {avg_confidence:.3f})")
            
            return {
                'success': True,
                'emotion': most_frequent_emotion,
                'confidence': avg_confidence,
                'detection_count': emotion_counts[most_frequent_emotion],
                'total_detections': len(emotions_detected)
            }
            
        except Exception as e:
            logger.error(f"Error capturing emotion from camera: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'emotion': None,
                'confidence': 0.0
            }
    
    def adjust_project_for_mood(self, project_data, emotion):
        """
        Adjust project data based on detected emotion
        
        Args:
            project_data (dict): Original project data
            emotion (str): Detected emotion
            
        Returns:
            dict: Adjusted project data
        """
        try:
            mood_adjustment = self.get_mood_adjustment(emotion)
            adjustment_type = mood_adjustment['adjustment']
            
            # Create a copy of the project data
            adjusted_project = project_data.copy()
            
            # Apply adjustments based on emotion
            if adjustment_type == 'simpler':
                # Make project simpler
                adjusted_project['difficulty_level'] = 'beginner'
                adjusted_project['project_title'] = f"Simplified: {project_data.get('project_title', 'DIY Project')}"
                adjusted_project['project_overview'] = f"This is a simplified version of the project, perfect for getting started. {project_data.get('project_overview', '')}"
                
            elif adjustment_type == 'more_challenging':
                # Make project more challenging
                if project_data.get('difficulty_level') == 'beginner':
                    adjusted_project['difficulty_level'] = 'intermediate'
                elif project_data.get('difficulty_level') == 'intermediate':
                    adjusted_project['difficulty_level'] = 'advanced'
                adjusted_project['project_title'] = f"Advanced: {project_data.get('project_title', 'DIY Project')}"
                
            elif adjustment_type == 'guided':
                # Add more guidance
                adjusted_project['project_title'] = f"Step-by-Step: {project_data.get('project_title', 'DIY Project')}"
                adjusted_project['project_overview'] = f"This project includes detailed step-by-step guidance to help you succeed. {project_data.get('project_overview', '')}"
                
            elif adjustment_type == 'advanced':
                # Make project more advanced
                if project_data.get('difficulty_level') == 'beginner':
                    adjusted_project['difficulty_level'] = 'intermediate'
                elif project_data.get('difficulty_level') == 'intermediate':
                    adjusted_project['difficulty_level'] = 'advanced'
                adjusted_project['project_title'] = f"Advanced: {project_data.get('project_title', 'DIY Project')}"
                
            elif adjustment_type == 'fun':
                # Make project more fun and engaging
                adjusted_project['project_title'] = f"Fun & Engaging: {project_data.get('project_title', 'DIY Project')}"
                adjusted_project['project_overview'] = f"This project is designed to be fun and engaging while you learn. {project_data.get('project_overview', '')}"
                
            elif adjustment_type == 'exciting':
                # Make project more exciting
                adjusted_project['project_title'] = f"Exciting: {project_data.get('project_title', 'DIY Project')}"
                adjusted_project['project_overview'] = f"This exciting project will keep you engaged and motivated. {project_data.get('project_overview', '')}"
            
            # Add mood information to the project
            adjusted_project['mood_detected'] = emotion
            adjusted_project['mood_adjustment'] = mood_adjustment
            adjusted_project['adjustment_message'] = mood_adjustment['message']
            
            logger.info(f"Adjusted project for mood: {emotion} -> {adjustment_type}")
            
            return adjusted_project
            
        except Exception as e:
            logger.error(f"Error adjusting project for mood: {str(e)}")
            return project_data 