from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from app.utils.video_transcript import get_transcript
from app.utils.image_caption import get_image_caption
from app.agents import (
    relevance_agent,
    completion_agent,
    presentation_agent,
    functionality_agent,
    supervisor_agent
)
import os
import shutil
import re
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/")
def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

def parse_agent_response(response: str) -> tuple[int, str]:
    """Parse agent response to extract score and explanation"""
    try:
        # Extract score from format "Score: X/5"
        score_match = re.search(r'Score:\s*(\d+)/5', response)
        if score_match:
            score = int(score_match.group(1))
        else:
            score = 0
        
        # Extract explanation
        explanation_match = re.search(r'Explanation:\s*(.+)', response, re.DOTALL)
        explanation = explanation_match.group(1).strip() if explanation_match else "No explanation provided"
        
        return score, explanation
    except Exception as e:
        print(f"Error parsing agent response: {e}")
        return 0, "Error parsing response"

def parse_supervisor_report(report: str) -> dict:
    """Parse supervisor report to extract structured data"""
    try:
        # Extract scores
        scores = {}
        score_patterns = {
            'relevance': r'Relevance:\s*(\d+)/5',
            'completion': r'Completion:\s*(\d+)/5', 
            'presentation': r'Presentation:\s*(\d+)/5',
            'functionality': r'Functionality:\s*(\d+)/5'
        }
        
        for key, pattern in score_patterns.items():
            match = re.search(pattern, report)
            scores[key] = int(match.group(1)) if match else 0
        
        # Extract overall score
        overall_match = re.search(r'Overall Score:\s*(\d+)/5', report)
        overall_score = int(overall_match.group(1)) if overall_match else sum(scores.values()) // len(scores)
        
        # Extract improvements
        improvements = []
        improvements_section = re.search(r'Key Improvements Needed:(.*?)(?=Final Feedback:|$)', report, re.DOTALL)
        if improvements_section:
            improvements_text = improvements_section.group(1).strip()
            improvements = [line.strip() for line in improvements_text.split('\n') if line.strip() and line.strip()[0].isdigit()]
            improvements = [imp.split('. ', 1)[1] if '. ' in imp else imp for imp in improvements]
        
        # Extract final feedback
        feedback_match = re.search(r'Final Feedback:\s*(.+)', report, re.DOTALL)
        final_feedback = feedback_match.group(1).strip() if feedback_match else "No feedback provided"
        
        return {
            'scores': scores,
            'overall_score': overall_score,
            'improvements': improvements,
            'final_feedback': final_feedback
        }
    except Exception as e:
        print(f"Error parsing supervisor report: {e}")
        return {
            'scores': {'relevance': 0, 'completion': 0, 'presentation': 0, 'functionality': 0},
            'overall_score': 0,
            'improvements': [],
            'final_feedback': "Error parsing evaluation report"
        }

@app.post("/evaluate")
async def evaluate(
    file: UploadFile = None,
    task: str = Form(...),
    summary: str = Form(...)
):
    try:
        media_caption = ""
        
        if file:
            file_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            print(f"Uploaded filename: {file_path}")
            
            if file.filename.endswith((".mp4", ".mov", ".avi")):
                media_caption = get_transcript(file_path)
            else:
                media_caption = get_image_caption(file_path)

        context = f"Task: {task}\nSummary: {summary}\nMedia: {media_caption}"

        # Get individual agent responses
        relevance_response = relevance_agent.evaluate(context)
        completion_response = completion_agent.evaluate(context)
        presentation_response = presentation_agent.evaluate(context)
        functionality_response = functionality_agent.evaluate(context)

        # Parse individual responses
        relevance_score, relevance_feedback = parse_agent_response(relevance_response)
        completion_score, completion_feedback = parse_agent_response(completion_response)
        presentation_score, presentation_feedback = parse_agent_response(presentation_response)
        functionality_score, functionality_feedback = parse_agent_response(functionality_response)

        # Get final report
        supervisor_report = supervisor_agent.compile_report(
            relevance_response, 
            completion_response, 
            presentation_response, 
            functionality_response
        )
        
        parsed_report = parse_supervisor_report(supervisor_report)

        # Calculate overall score as percentage
        overall_score_percentage = parsed_report['overall_score'] * 20  # Convert from /5 to /100
        
        # Create structured response matching frontend expectations
        response_data = {
            "overallScore": overall_score_percentage,
            "scores": {
                "relevance": relevance_score * 20,
                "completion": completion_score * 20,
                "functionality": functionality_score * 20,
                "presentation": presentation_score * 20
            },
            "feedback": {
                "relevance": relevance_feedback,
                "completion": completion_feedback,
                "functionality": functionality_feedback,
                "presentation": presentation_feedback,
                "overall": parsed_report['final_feedback']
            },
            "improvements": parsed_report['improvements'],
            "nextSteps": [
                "Review the detailed feedback for each category",
                "Focus on the areas with lower scores",
                "Implement the suggested improvements",
                "Consider getting peer feedback on your project",
                "Practice similar projects to improve your skills"
            ],
            "strengths": [
                f"Strong {category} with a score of {score}%" 
                for category, score in parsed_report['scores'].items() 
                if score >= 3  # 3/5 or higher
            ]
        }

        return JSONResponse(content=response_data)
        
    except Exception as e:
        print(f"Error during evaluation: {e}")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "DIY Project Evaluator"}
