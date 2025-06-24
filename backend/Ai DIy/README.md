# AI DIY Project Generator Backend

This backend provides AI-powered project roadmap generation for the DIY Generator frontend.

## Features

- **AI-Powered Roadmap Generation**: Uses Google Gemini AI to create personalized project roadmaps
- **YouTube Integration**: Extracts transcripts from YouTube videos for context
- **Skill Assessment**: Analyzes user descriptions to assess actual skill level
- **Video Recommendations**: Searches and recommends relevant YouTube videos
- **ML Project Support**: Special handling for machine learning projects with dataset recommendations
- **Hardware Project Support**: Amazon integration for hardware component purchase links
- **Amazon Scraping**: Automatically finds and provides purchase links for hardware components

## Setup

### Prerequisites

- Python 3.8+
- Google Gemini API key
- ScrapingDog API key (for YouTube search and Amazon scraping)

### Installation

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables**:
   ```bash
   # Required
   export GEMINI_API_KEY="your_gemini_api_key_here"
   export SCRAPINGDOG_API_KEY="your_scrapingdog_api_key_here"
   
   # Optional (for frontend integration)
   export NEXT_PUBLIC_BACKEND_URL="http://localhost:5000"
   ```

3. **Start the backend**:
   ```bash
   python start.py
   ```

   Or directly:
   ```bash
   python app.py
   ```

## API Endpoints

### POST /api/generate-roadmap
Generate a complete project roadmap based on user input.

**Request Body**:
```json
{
  "topic": "Build a Weather App",
  "available_time": "20 hours",
  "skill_level": "intermediate",
  "category": "hardware",
  "user_description": "I have some experience with Arduino",
  "youtube_url": "https://youtube.com/watch?v=..."
}
```

**Response**:
```json
{
  "success": true,
  "project_data": {
    "project_title": "Arduino Weather Station",
    "estimated_time": "20 hours",
    "difficulty_level": "intermediate",
    "prerequisites": ["Basic Arduino", "Electronics fundamentals"],
    "tools_and_materials": ["Arduino Uno", "Breadboard", "Sensors"],
    "learning_objectives": ["Build sensor circuits", "Read sensor data"],
    "project_roadmap": "PHASE 1: Setup (30 minutes)...",
    "common_pitfalls_and_troubleshooting": "Common issues...",
    "success_criteria": "Working weather station...",
    "next_steps_and_extensions": "Add more sensors...",
    "is_ml_project": false
  },
  "keywords": ["arduino", "sensors", "weather", "electronics"],
  "videos": [...],
  "assessed_skill_level": "intermediate",
  "knowledge_assessment": "Based on your description...",
  "hardware_resources": {
    "hardware_components": {
      "circuit_diagrams": ["Basic breadboard setup"],
      "components": [
        {
          "name": "Arduino Uno (main microcontroller)",
          "amazon_data": {
            "title": "Arduino Uno R3",
            "price": "$23.99",
            "rating": "4.5",
            "reviews": "2,500+ reviews",
            "url": "https://amazon.com/...",
            "image": "https://...",
            "availability": "In Stock"
          }
        }
      ],
      "libraries": ["Arduino IDE", "Sensor libraries"],
      "description": "Essential components for Arduino projects"
    }
  }
}
```

### POST /api/extract-video-id
Extract video ID from YouTube URL.

### POST /api/get-transcript
Get transcript from YouTube video.

### GET /health
Health check endpoint.

## Hardware Project Features

### Amazon Integration
For hardware projects, the system automatically:
- Suggests relevant hardware components
- Searches Amazon for each component
- Provides purchase links with pricing and availability
- Shows product ratings and reviews
- Displays product images

### Component Information
Each hardware component includes:
- Component name and description
- Amazon product title
- Current price
- Customer rating (1-5 stars)
- Number of reviews
- Stock availability
- Direct purchase link

## Frontend Integration

The frontend is configured to connect to this backend via the `NEXT_PUBLIC_BACKEND_URL` environment variable.

### Frontend Environment Setup

Add to your frontend `.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## Development

### Running in Development Mode

```bash
# Backend
cd backend/Ai\ DIy/
python start.py

# Frontend (in another terminal)
cd frontend/
npm run dev
```

### Testing the Integration

1. Start both backend and frontend
2. Navigate to `/diy-generator` in your frontend
3. Select "Hardware" as the project category
4. Fill out the form and submit
5. Check the generated roadmap with Amazon purchase links

### Testing Amazon Scraping

Run the test script to verify Amazon scraping functionality:
```bash
python test_amazon_scraping.py
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend is running and accessible
2. **API Key Errors**: Verify your Gemini and ScrapingDog API keys are set
3. **Port Conflicts**: Change the port in `app.py` if 5000 is occupied
4. **Amazon Scraping Issues**: Check ScrapingDog API key and rate limits

### Debug Mode

The backend runs in debug mode by default. Check the console for detailed logs.

## Dependencies

- Flask: Web framework
- Flask-CORS: Cross-origin resource sharing
- google-generativeai: Google Gemini AI integration
- youtube-transcript-api: YouTube transcript extraction
- requests: HTTP client for API calls 