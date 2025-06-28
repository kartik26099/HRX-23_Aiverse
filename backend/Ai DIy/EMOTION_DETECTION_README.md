# Emotion Detection for AI DIY Project Generator

This feature adds facial emotion detection to the AI DIY Project Generator, allowing the system to adjust project recommendations based on the user's emotional state.

## 🎯 Features

- **Real-time Emotion Detection**: Captures user's facial expression using webcam
- **Mood-Based Project Adjustment**: Adjusts project difficulty and style based on detected emotions
- **7 Emotion Categories**: Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise
- **Smart Project Recommendations**: Provides personalized project suggestions based on emotional state

## 🚀 How It Works

1. **Project Generation**: User generates a project as usual
2. **Emotion Capture**: System captures user's facial expression via webcam
3. **Mood Analysis**: Detects emotion and determines appropriate project adjustments
4. **User Confirmation**: Shows popup message asking if user wants adjusted project
5. **Project Adjustment**: If user agrees, generates new project considering their mood

## 📋 Emotion-Based Adjustments

| Emotion | Adjustment | Message | Project Change |
|---------|------------|---------|----------------|
| **Angry** | Simpler | "You look frustrated. Would you like a simpler project to start with?" | Reduces difficulty, adds more guidance |
| **Disgust** | More Challenging | "You seem unimpressed. Would you like a more challenging project?" | Increases difficulty, adds complexity |
| **Fear** | Guided | "You look worried. Would you like a step-by-step guided project?" | Adds detailed guidance, reduces complexity |
| **Happy** | Advanced | "You look excited! Would you like to try a more advanced project?" | Increases difficulty, adds exciting features |
| **Neutral** | Continue | "You seem focused. Would you like to continue with the current project?" | No change, keeps original project |
| **Sad** | Fun & Engaging | "You look a bit down. Would you like a fun and engaging project?" | Makes project more entertaining |
| **Surprise** | Exciting | "You look surprised! Would you like a project that matches your excitement?" | Adds exciting features |

## 🔧 API Endpoints

### 1. Check Emotion Detector Status
```http
GET /api/emotion-detector-status
```
**Response:**
```json
{
  "success": true,
  "emotion_detector_available": true,
  "message": "Emotion detector is ready"
}
```

### 2. Capture Emotion from Camera
```http
POST /api/capture-emotion
Content-Type: application/json

{
  "capture_duration": 3
}
```
**Response:**
```json
{
  "success": true,
  "emotion": "Happy",
  "confidence": 0.85,
  "detection_count": 15,
  "total_detections": 20,
  "mood_adjustment": {
    "message": "You look excited! Would you like to try a more advanced project?",
    "adjustment": "advanced",
    "difficulty_increase": 0.3
  },
  "message": "You look excited! Would you like to try a more advanced project?"
}
```

### 3. Detect Emotion from Image
```http
POST /api/detect-emotion-from-image
Content-Type: application/json

{
  "image_data": "base64_encoded_image_data"
}
```

### 4. Adjust Project for Mood
```http
POST /api/adjust-project-for-mood
Content-Type: application/json

{
  "project_data": {
    "project_title": "Weather App",
    "difficulty_level": "beginner",
    "project_overview": "..."
  },
  "emotion": "Sad"
}
```

### 5. Generate Roadmap with Mood
```http
POST /api/generate-roadmap-with-mood
Content-Type: application/json

{
  "topic": "Weather App",
  "available_time": "2 hours",
  "skill_level": "beginner",
  "category": "software",
  "user_description": "I want to build a simple weather app",
  "emotion": "Happy"
}
```

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Verify Model Files
Ensure these files are present in the `backend/Ai DIy/` directory:
- `model.h5` - Pre-trained emotion detection model
- `haarcascade_frontalface_default.xml` - Face detection cascade

### 3. Start the Server
```bash
cd backend/Ai\ DIy/
python app.py
```

### 4. Test the Feature
```bash
python test_emotion_detection.py
```

## 🎮 Frontend Integration

### Basic Integration Flow

1. **Generate Initial Project**
```javascript
const response = await fetch('/api/generate-roadmap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(projectData)
});
```

2. **Capture User Emotion**
```javascript
const emotionResponse = await fetch('/api/capture-emotion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ capture_duration: 3 })
});

const emotionData = await emotionResponse.json();
```

3. **Show Mood Adjustment Popup**
```javascript
if (emotionData.success) {
  const userAgrees = confirm(emotionData.message);
  
  if (userAgrees) {
    // Generate adjusted project
    const adjustedResponse = await fetch('/api/generate-roadmap-with-mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...projectData,
        emotion: emotionData.emotion
      })
    });
  }
}
```

### React Component Example

```jsx
import React, { useState } from 'react';

const EmotionAwareProjectGenerator = () => {
  const [projectData, setProjectData] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const generateProject = async (formData) => {
    // Generate initial project
    const response = await fetch('/api/generate-roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    setProjectData(data.project_data);
    
    // Capture emotion after project generation
    await captureEmotion();
  };

  const captureEmotion = async () => {
    setIsCapturing(true);
    
    try {
      const response = await fetch('/api/capture-emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capture_duration: 3 })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEmotion(data.emotion);
        
        // Show mood adjustment popup
        const userAgrees = confirm(data.message);
        
        if (userAgrees) {
          await generateAdjustedProject(data.emotion);
        }
      }
    } catch (error) {
      console.error('Error capturing emotion:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const generateAdjustedProject = async (detectedEmotion) => {
    const response = await fetch('/api/generate-roadmap-with-mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...projectData,
        emotion: detectedEmotion
      })
    });
    
    const data = await response.json();
    setProjectData(data.project_data);
  };

  return (
    <div>
      {/* Your project generation form */}
      
      {isCapturing && (
        <div className="emotion-capture-overlay">
          <p>Capturing your emotion... Please look at the camera.</p>
        </div>
      )}
      
      {emotion && (
        <div className="emotion-detected">
          <p>Detected emotion: {emotion}</p>
        </div>
      )}
      
      {/* Display project data */}
    </div>
  );
};

export default EmotionAwareProjectGenerator;
```

## 🔍 Troubleshooting

### Common Issues

1. **Emotion Detector Not Available**
   - Check if all dependencies are installed
   - Verify model files are present
   - Ensure server is running on port 4009

2. **Camera Access Issues**
   - Grant camera permissions to the application
   - Check if camera is being used by another application
   - Try refreshing the page

3. **Low Detection Confidence**
   - Ensure good lighting
   - Face the camera directly
   - Remove glasses or hats if possible
   - Try different facial expressions

4. **Model Loading Errors**
   - Verify `model.h5` file is not corrupted
   - Check TensorFlow version compatibility
   - Ensure sufficient memory is available

### Debug Mode

Enable debug logging by setting the log level in `app.py`:
```python
logging.basicConfig(level=logging.DEBUG)
```

## 📊 Performance Considerations

- **Capture Duration**: 3 seconds is optimal for emotion detection
- **Confidence Threshold**: 0.3 minimum confidence for reliable detection
- **Memory Usage**: Model requires ~50MB RAM
- **Processing Time**: ~100ms per frame for emotion detection

## 🔒 Privacy & Security

- **Local Processing**: All emotion detection happens locally
- **No Data Storage**: Facial images are not stored or transmitted
- **User Consent**: Always ask for camera permission
- **Opt-out Option**: Users can skip emotion detection

## 🎨 Customization

### Adding New Emotions

1. Update `emotion_labels` in `emotion_detector.py`
2. Add mood adjustments in `mood_adjustments` dictionary
3. Retrain the model with new emotion categories

### Custom Mood Messages

Modify the `mood_adjustments` dictionary in `emotion_detector.py`:
```python
self.mood_adjustments = {
    'Your_Emotion': {
        'message': 'Your custom message here',
        'adjustment': 'your_adjustment_type',
        'difficulty_change': 0.2
    }
}
```

## 📈 Future Enhancements

- [ ] Real-time emotion tracking during project development
- [ ] Emotion-based learning path recommendations
- [ ] Mood history tracking for personalized experiences
- [ ] Integration with other AI services for enhanced emotion analysis
- [ ] Support for multiple faces in group settings

## 🤝 Contributing

To contribute to the emotion detection feature:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For issues or questions about the emotion detection feature:

1. Check the troubleshooting section
2. Review the API documentation
3. Run the test script to verify functionality
4. Create an issue with detailed error information 