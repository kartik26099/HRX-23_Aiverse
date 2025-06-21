# DIY Project Evaluator

An AI-powered project evaluation system that provides comprehensive feedback on DIY projects using multiple specialized agents.

## Features

- **Multi-Agent Evaluation**: Uses specialized AI agents for different aspects of project evaluation
- **File Upload Support**: Accepts videos, images, and documents for analysis
- **Structured Feedback**: Provides detailed scores and feedback across multiple categories
- **RESTful API**: Clean API endpoints for easy integration
- **Modern Frontend**: Beautiful React/Next.js interface

## Evaluation Categories

1. **Relevance**: How well the project aligns with stated goals
2. **Completion**: Extent to which the project meets requirements
3. **Presentation**: Visual design and user experience quality
4. **Functionality**: Technical implementation and performance

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 18+ (for frontend)
- FFmpeg (for video processing)

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend/diy_project_evaluator
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the `diy_project_evaluator` directory:
   ```env
   PORT=8000
   # Add any API keys or configuration as needed
   ```

5. **Start the server:**
   ```bash
   python start_server.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the frontend directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

## API Endpoints

### POST /evaluate
Evaluates a project based on provided information.

**Request:**
- `task` (string, required): Description of what was supposed to be built
- `summary` (string, required): Description of what was actually built
- `file` (file, optional): Project file (video, image, or document)

**Response:**
```json
{
  "overallScore": 78,
  "scores": {
    "relevance": 75,
    "completion": 85,
    "functionality": 80,
    "presentation": 72
  },
  "feedback": {
    "relevance": "Detailed feedback...",
    "completion": "Detailed feedback...",
    "functionality": "Detailed feedback...",
    "presentation": "Detailed feedback...",
    "overall": "Overall assessment..."
  },
  "improvements": ["Improvement 1", "Improvement 2"],
  "nextSteps": ["Next step 1", "Next step 2"],
  "strengths": ["Strength 1", "Strength 2"]
}
```

### GET /health
Health check endpoint.

## Usage

1. Open the frontend application in your browser (usually `http://localhost:3000`)
2. Navigate to the DIY Evaluator page
3. Fill in the task description and project summary
4. Optionally upload a project file (video, image, or document)
5. Click "Evaluate Project" to get AI-powered feedback
6. Review the detailed evaluation results

## Architecture

The system uses a multi-agent architecture:

- **Relevance Agent**: Evaluates project alignment with goals
- **Completion Agent**: Assesses requirement fulfillment
- **Presentation Agent**: Reviews visual design and UX
- **Functionality Agent**: Analyzes technical implementation
- **Supervisor Agent**: Compiles final report from all agents

## File Processing

- **Videos**: Uses Whisper for speech-to-text transcription
- **Images**: Uses image captioning for content analysis
- **Documents**: Text extraction and analysis

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Install FFmpeg on your system
   - Windows: Download from https://ffmpeg.org/download.html
   - macOS: `brew install ffmpeg`
   - Ubuntu: `sudo apt install ffmpeg`

2. **Port already in use**: Change the port in the `.env` file or kill the process using the port

3. **CORS errors**: Ensure the frontend URL is added to the CORS origins in `main.py`

4. **File upload issues**: Check file size limits and supported formats

### Logs

Check the console output for detailed error messages and debugging information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 