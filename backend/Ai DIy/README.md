# AI DIY Project Generator Backend

This backend provides AI-powered project roadmap generation for the DIY Generator frontend.

## Features

- **AI-Powered Roadmap Generation**: Uses Google Gemini AI to create personalized project roadmaps
- **YouTube Integration**: Extracts transcripts from YouTube videos for context
- **Skill Assessment**: Analyzes user descriptions to assess actual skill level
- **Video Recommendations**: Searches and recommends relevant YouTube videos
- **ML Project Support**: Special handling for machine learning projects with dataset recommendations

## Setup

### Prerequisites

- Python 3.8+
- Google Gemini API key
- ScrapingDog API key (for YouTube search)

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
  "user_description": "I have some experience with React and APIs",
  "youtube_url": "https://youtube.com/watch?v=..."
}
```

**Response**:
```json
{
  "success": true,
  "project_data": {
    "project_title": "Weather App Project",
    "estimated_time": "20 hours",
    "difficulty_level": "intermediate",
    "prerequisites": ["Basic JavaScript", "React fundamentals"],
    "tools_and_materials": ["VS Code", "Node.js", "Weather API"],
    "learning_objectives": ["Build responsive UI", "Integrate external APIs"],
    "project_roadmap": "PHASE 1: Setup (30 minutes)...",
    "common_pitfalls_and_troubleshooting": "Common issues...",
    "success_criteria": "Working weather app...",
    "next_steps_and_extensions": "Add more features...",
    "is_ml_project": false
  },
  "keywords": ["weather", "api", "react", "javascript"],
  "videos": [...],
  "assessed_skill_level": "intermediate",
  "knowledge_assessment": "Based on your description..."
}
```

### POST /api/extract-video-id
Extract video ID from YouTube URL.

### POST /api/get-transcript
Get transcript from YouTube video.

### GET /health
Health check endpoint.

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
3. Fill out the form and submit
4. Check the generated roadmap

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend is running and accessible
2. **API Key Errors**: Verify your Gemini and ScrapingDog API keys are set
3. **Port Conflicts**: Change the port in `app.py` if 5000 is occupied

### Debug Mode

The backend runs in debug mode by default. Check the console for detailed logs.

## Dependencies

- Flask: Web framework
- Flask-CORS: Cross-origin resource sharing
- google-generativeai: Google Gemini AI integration
- youtube-transcript-api: YouTube transcript extraction
- requests: HTTP client for API calls 