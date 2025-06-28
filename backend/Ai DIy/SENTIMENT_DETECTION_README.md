# Sentiment Detection Integration

This document describes the sentiment detection feature that has been integrated into the AI DIY Project Generator.

## Overview

The sentiment detection feature automatically captures the user's facial expression after a project roadmap is generated and provides personalized motivational messages based on their detected mood.

## How It Works

1. **Roadmap Generation**: When a user generates a project roadmap, the system waits for 10 seconds
2. **Camera Activation**: The sentiment detector activates the user's camera
3. **Face Detection**: Uses OpenCV with Haar Cascade to detect faces in the camera feed
4. **Sentiment Analysis**: The detected face is processed through a trained sentiment detection model
5. **Motivational Response**: Based on the detected sentiment, a personalized motivational message is displayed

## Technical Implementation

### Backend (Flask)

- **Model Loading**: Uses TensorFlow/Keras to load the pre-trained sentiment detection model (`model.h5`)
- **Face Detection**: Uses OpenCV's Haar Cascade classifier (`haarcascade_frontalface_default.xml`)
- **API Endpoint**: `/api/detect-sentiment` accepts base64 encoded images and returns sentiment analysis

### Frontend (Next.js)

- **SentimentDetector Component**: Handles camera access and image capture
- **SentimentPopup Component**: Displays the sentiment result with motivational messages
- **Integration**: Automatically triggers after roadmap generation

## Sentiment Categories

The system detects 7 different emotions:
- **Happy** 😊 - Encourages excitement and enthusiasm
- **Sad** 😢 - Provides comfort and support
- **Neutral** 😐 - Motivates to get started
- **Surprise** 😲 - Celebrates the unexpected
- **Fear** 😨 - Offers reassurance and guidance
- **Angry** 😠 - Channels energy into productive action
- **Disgust** 🤢 - Suggests alternative approaches

## Files Modified/Added

### Backend Files
- `app.py` - Added sentiment detection functions and API endpoint
- `requirements.txt` - Added OpenCV, TensorFlow, and NumPy dependencies
- `test_sentiment.py` - Test script for sentiment detection functionality

### Frontend Files
- `components/SentimentDetector.tsx` - Camera interface and image capture
- `components/SentimentPopup.tsx` - Result display with motivational messages
- `app/diy-generator/page.tsx` - Integration with roadmap generation

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Model Files**: Ensure `model.h5` and `haarcascade_frontalface_default.xml` are in the backend directory

3. **Test the Setup**:
   ```bash
   python test_sentiment.py
   ```

4. **Start the Backend**:
   ```bash
   python app.py
   ```

## API Usage

### Detect Sentiment
```http
POST /api/detect-sentiment
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
}
```

### Response
```json
{
  "success": true,
  "sentiment": "Happy",
  "confidence": 0.85,
  "message": "Your excitement is contagious! This project is going to be amazing! ✨",
  "detected_faces": 1
}
```

## User Experience Flow

1. User fills out project form and clicks "Generate Roadmap"
2. System generates personalized project roadmap
3. Success message appears: "Your personalized project roadmap has been created successfully."
4. After 10 seconds, sentiment detection modal appears
5. User positions face in camera and clicks "Capture Sentiment"
6. 3-second countdown begins
7. Image is captured and sent to backend for analysis
8. Sentiment result popup appears with personalized motivational message
9. User can close popup and continue with their project

## Error Handling

- **Camera Access Denied**: Shows error message and allows user to continue
- **No Face Detected**: Prompts user to position face properly
- **Model Loading Failed**: Gracefully degrades without sentiment detection
- **Network Errors**: Shows appropriate error messages

## Security Considerations

- Camera access requires explicit user permission
- Images are processed locally and not stored
- Base64 encoding ensures secure transmission
- No personal data is logged or stored

## Future Enhancements

- Support for multiple faces in frame
- Real-time sentiment tracking during project development
- Integration with project difficulty adjustment based on sentiment
- Sentiment history tracking for user progress analysis 