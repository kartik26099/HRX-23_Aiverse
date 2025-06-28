# Continuous Emotion Detection System

## Overview

The AI DIY Project Generator now includes a sophisticated continuous emotion detection system that monitors user emotions during project generation and provides intelligent project adjustments based on detected moods.

## Features

### 🎯 Continuous Emotion Monitoring
- **Real-time Detection**: Continuously monitors user emotions through webcam
- **Smart Triggering**: Only shows popup for negative emotions (Fear, Sad, Surprise, Angry)
- **Confidence-based**: Requires minimum confidence threshold (40%) to trigger popup
- **Non-intrusive**: Camera feed only shown for longer detection sessions

### 🎨 Three Action Options
When negative emotions are detected, users are presented with three options:

1. **Change Project** - Generate a completely new project based on mood
2. **Make Changes in This Project** - Modify the current project to better suit the mood
3. **Keep Original** - Continue with the original project

### 🧠 Emotion-Based Project Adjustments

#### Fear
- **Action**: Make project more guided and step-by-step
- **Modification**: Adds detailed guidance and reduces complexity
- **Title Prefix**: "Step-by-Step:"

#### Sad
- **Action**: Make project more fun and engaging
- **Modification**: Focuses on enjoyable aspects and interactive elements
- **Title Prefix**: "Fun & Engaging:"

#### Surprise
- **Action**: Make project more exciting
- **Modification**: Adds exciting features and dynamic elements
- **Title Prefix**: "Exciting:"

#### Angry
- **Action**: Simplify project to reduce frustration
- **Modification**: Reduces complexity and focuses on achievable goals
- **Title Prefix**: "Simplified:"

## Technical Implementation

### Backend Endpoints

#### 1. `/api/detect-emotion-continuous` (POST)
**Purpose**: Detect emotion continuously and determine if popup should be shown

**Request Body**:
```json
{
  "detection_duration": 1
}
```

**Response**:
```json
{
  "success": true,
  "emotion": "Fear",
  "confidence": 0.75,
  "should_show_popup": true,
  "message": "You look worried. Would you like a step-by-step guided project?"
}
```

#### 2. `/api/modify-project-for-mood` (POST)
**Purpose**: Modify existing project based on detected emotion

**Request Body**:
```json
{
  "current_project": {
    "title": "Original Project",
    "projectOverview": "Original description"
  },
  "emotion": "Fear",
  "action": "modify"
}
```

**Response**:
```json
{
  "success": true,
  "project_data": {
    "title": "Step-by-Step: Original Project",
    "projectOverview": "Modified description...",
    "mood_detected": "Fear",
    "mood_adjustment": {
      "message": "You look worried. Would you like a step-by-step guided project?",
      "adjustment": "guided"
    }
  }
}
```

#### 3. `/api/emotion-detector-status` (GET)
**Purpose**: Check if emotion detector is available

**Response**:
```json
{
  "success": true,
  "emotion_detector_available": true,
  "message": "Emotion detector is ready"
}
```

### Frontend Integration

#### State Management
```typescript
// Continuous detection state
const [isEmotionDetectionActive, setIsEmotionDetectionActive] = useState(false)
const [emotionDetectionInterval, setEmotionDetectionInterval] = useState<NodeJS.Timeout | null>(null)
const [currentEmotion, setCurrentEmotion] = useState<string | null>(null)
const [emotionConfidence, setEmotionConfidence] = useState<number | null>(null)

// Popup state
const [showEmotionPopup, setShowEmotionPopup] = useState(false)
const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null)
const [emotionMessage, setEmotionMessage] = useState("")
```

#### Key Functions

1. **`startContinuousEmotionDetection()`**
   - Checks emotion detector availability
   - Starts interval-based detection every 2 seconds
   - Monitors for negative emotions

2. **`stopContinuousEmotionDetection()`**
   - Clears detection interval
   - Resets emotion state
   - Called when popup is shown or manually stopped

3. **`handleEmotionPopupResponse(action)`**
   - Handles three action types: 'change', 'modify', 'keep'
   - Calls appropriate backend endpoints
   - Updates project state accordingly

4. **`modifyCurrentProject(emotion)`**
   - Sends current project to backend for modification
   - Updates project with mood-based changes
   - Preserves original project structure

## User Experience Flow

1. **Project Generation**: User generates initial project
2. **Continuous Monitoring**: System starts monitoring emotions
3. **Emotion Detection**: Camera captures emotions every 2 seconds
4. **Negative Emotion Trigger**: When Fear, Sad, Surprise, or Angry detected with >40% confidence
5. **Popup Display**: Shows three action options
6. **User Choice**: User selects desired action
7. **Project Update**: System modifies or regenerates project accordingly

## Visual Indicators

### Emotion Detection Status Bar
- Shows when emotion detection is active
- Displays current emotion and confidence
- Provides manual stop button

### Popup Design
- Amber warning color scheme for negative emotions
- Clear action buttons with loading states
- Emotion and confidence display
- Responsive design for all screen sizes

## Configuration

### Emotion Thresholds
```python
# Negative emotions that trigger popup
negative_emotions = ['Fear', 'Sad', 'Surprise', 'Angry']

# Minimum confidence required
confidence_threshold = 0.4

# Detection interval (seconds)
detection_interval = 2

# Camera capture duration (seconds)
capture_duration = 1
```

### Camera Settings
```python
# Camera resolution
width = 640
height = 480

# Face detection parameters
scale_factor = 1.1
min_neighbors = 4

# Emotion model input size
input_size = (48, 48)
```

## Testing

Run the test script to verify all endpoints work correctly:

```bash
cd backend/Ai\ DIy
python test_continuous_emotion.py
```

The test script checks:
- Emotion detector availability
- Continuous emotion detection
- Project modification functionality

## Error Handling

### Camera Access Issues
- Graceful fallback if camera unavailable
- User-friendly error messages
- Option to continue without emotion detection

### Network Issues
- Retry logic for failed API calls
- Timeout handling
- Fallback to original project

### Model Loading Issues
- Automatic fallback if emotion model unavailable
- Clear error messages
- System continues without emotion features

## Performance Considerations

### Optimization
- Short detection intervals (1 second) for responsiveness
- Efficient face detection with OpenCV
- Minimal UI updates to prevent lag

### Resource Management
- Automatic cleanup of camera resources
- Interval clearing on component unmount
- Memory-efficient emotion processing

## Security & Privacy

### Camera Permissions
- Explicit user consent required
- Clear permission request messages
- Option to disable emotion detection

### Data Handling
- No emotion data stored permanently
- Local processing only
- No external API calls for emotion data

## Future Enhancements

### Planned Features
- Emotion history tracking
- Personalized emotion thresholds
- Advanced mood-based project recommendations
- Emotion-based learning path adjustments

### Technical Improvements
- WebRTC for better camera performance
- Machine learning model optimization
- Real-time emotion visualization
- Multi-user emotion detection

## Troubleshooting

### Common Issues

1. **Camera not working**
   - Check browser permissions
   - Ensure camera is not in use by other applications
   - Try refreshing the page

2. **Emotion detection not triggering**
   - Ensure good lighting
   - Face should be clearly visible
   - Check confidence threshold settings

3. **Popup not showing**
   - Verify negative emotion detection
   - Check confidence levels
   - Ensure emotion detector is available

### Debug Mode
Enable debug logging by setting environment variable:
```bash
export EMOTION_DEBUG=true
```

This will provide detailed logs for troubleshooting emotion detection issues.

## Support

For issues or questions about the continuous emotion detection system:

1. Check the troubleshooting section above
2. Review the test script output
3. Check browser console for frontend errors
4. Review backend logs for API errors

The system is designed to gracefully handle errors and provide clear feedback to users when issues occur. 