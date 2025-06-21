from flask import Flask, request, jsonify
import os
import json
import logging
import asyncio
from werkzeug.utils import secure_filename

# Import functions from the provided modules
from jd_summarizer_agent import summarize_jd
from resume_parser import MistralResumeParser
from match_engine import matcher_agent
from shortlisting_agent import shortlist_candidates, load_parsed_resumes

# Configure logging
logging.basicConfig(
    filename="talent_api.log",
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx', 'doc', 'txt'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'resumes'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'jds'), exist_ok=True)

# Initialize Resume Parser
mistral_api_key = os.getenv("MISTRAL_API_KEY", "wxJu9G7KyqjjTfLbjaRRso4utGo9mqDX")
resume_parser = MistralResumeParser(api_key=mistral_api_key)

# Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    return jsonify({
        "status": "success",
        "message": "Talent API is running",
        "endpoints": [
            "/api/summarize-jd",
            "/api/parse-resume",
            "/api/match-resume",
            "/api/shortlist-candidates"
        ]
    })

@app.route('/api/summarize-jd', methods=['POST'])
def api_summarize_jd():
    """
    Endpoint to summarize a job description
    
    Request: 
    - jd_text: Job description text (string)
    
    Response:
    - JSON object with skills, experience, education, certifications, projects fields
    """
    try:
        if not request.is_json:
            return jsonify({"status": "error", "message": "Request must be JSON"}), 400
        
        data = request.get_json()
        jd_text = data.get('jd_text')
        
        if not jd_text:
            return jsonify({"status": "error", "message": "No job description provided"}), 400
            
        # Save JD to file for tracking
        jd_id = f"jd_{len(os.listdir(os.path.join(app.config['UPLOAD_FOLDER'], 'jds'))) + 1}"
        jd_file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'jds', f"{jd_id}.txt")
        with open(jd_file_path, 'w') as f:
            f.write(jd_text)
        
        # Process the job description
        summary = summarize_jd(jd_text)
        
        return jsonify({
            "status": "success",
            "jd_id": jd_id,
            "summary": summary
        })
        
    except Exception as e:
        logger.error(f"Error summarizing JD: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/parse-resume', methods=['POST'])
def api_parse_resume():
    """
    Endpoint to parse a resume file
    
    Request:
    - resume file (multipart/form-data)
    
    Response:
    - JSON object with parsed resume data
    """
    try:
        # Check if a file was uploaded
        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "No file provided"}), 400
            
        file = request.files['file']
        
        # Check if the file is valid
        if file.filename == '':
            return jsonify({"status": "error", "message": "No file selected"}), 400
            
        if not allowed_file(file.filename):
            return jsonify({"status": "error", "message": f"File type not allowed. Allowed types: {', '.join(app.config['ALLOWED_EXTENSIONS'])}"}), 400
        
        # Save the uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'resumes', filename)
        file.save(filepath)
        
        # Parse the resume
        parsed_data = resume_parser.parse_resume(filepath)
        
        return jsonify({
            "status": "success",
            "data": parsed_data
        })
        
    except Exception as e:
        logger.error(f"Error parsing resume: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/match-resume', methods=['POST'])
def api_match_resume():
    """
    Endpoint to match a resume against a job description
    
    Request:
    - parsed_cv: Parsed resume data (JSON)
    - summarized_jd: Summarized job description (JSON)
    - weights: Optional weights for scoring (JSON)
    - use_llm: Whether to use LLM for scoring (boolean)
    
    Response:
    - JSON object with match scores
    """
    try:
        if not request.is_json:
            return jsonify({"status": "error", "message": "Request must be JSON"}), 400
            
        data = request.get_json()
        parsed_cv = data.get('parsed_cv')
        summarized_jd = data.get('summarized_jd')
        weights = data.get('weights')
        use_llm = data.get('use_llm', False)
        
        if not parsed_cv:
            return jsonify({"status": "error", "message": "No resume data provided"}), 400
            
        if not summarized_jd:
            return jsonify({"status": "error", "message": "No job description provided"}), 400
        
        # Format the JD summary for the matcher
        jd_for_matcher = {"text": summarized_jd}
        
        # Use asyncio to run the async matcher function
        result = asyncio.run(matcher_agent(parsed_cv, jd_for_matcher, weights, use_llm))
        
        return jsonify({
            "status": "success",
            "match_result": result
        })
        
    except Exception as e:
        logger.error(f"Error matching resume: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/shortlist-candidates', methods=['POST'])
def api_shortlist_candidates():
    """
    Endpoint to shortlist candidates for a job description
    
    Request:
    - jd_summary: Summarized job description (JSON)
    - resume_paths: List of paths to resume files (array)
    - filters: Filters for shortlisting (JSON)
    - jd_id: Job description ID (string)
    
    Response:
    - JSON object with shortlisted candidates
    """
    try:
        if not request.is_json:
            return jsonify({"status": "error", "message": "Request must be JSON"}), 400
            
        data = request.get_json()
        jd_summary = data.get('jd_summary')
        resume_paths = data.get('resume_paths')
        filters = data.get('filters', {
            "min_score": 50,
            "require_cert": False,
            "top_n": 10
        })
        jd_id = data.get('jd_id', f"jd_{len(os.listdir(os.path.join(app.config['UPLOAD_FOLDER'], 'jds'))) + 1}")
        
        if not jd_summary:
            return jsonify({"status": "error", "message": "No job description summary provided"}), 400
            
        if not resume_paths:
            return jsonify({"status": "error", "message": "No resume paths provided"}), 400
        
        # Load parsed resumes
        candidates = load_parsed_resumes(resume_paths)
        
        if not candidates:
            return jsonify({
                "status": "error", 
                "message": "No candidates parsed from resumes", 
                "leaderboard": []
            })
        
        # Shortlist candidates
        leaderboard = shortlist_candidates(jd_summary, candidates, filters, jd_id)
        
        return jsonify({
            "status": "success",
            "message": "Candidates evaluated successfully",
            "leaderboard": leaderboard
        })
        
    except Exception as e:
        logger.error(f"Error shortlisting candidates: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/upload-multiple-resumes', methods=['POST'])
def api_upload_multiple_resumes():
    """
    Endpoint to upload multiple resume files
    
    Request:
    - files: Multiple resume files (multipart/form-data)
    
    Response:
    - JSON object with file paths
    """
    try:
        # Check if files were uploaded
        if 'files' not in request.files:
            return jsonify({"status": "error", "message": "No files provided"}), 400
            
        files = request.files.getlist('files')
        
        if not files or len(files) == 0:
            return jsonify({"status": "error", "message": "No files selected"}), 400
        
        # Save each uploaded file
        file_paths = []
        for file in files:
            if file.filename == '':
                continue
                
            if not allowed_file(file.filename):
                continue
            
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'resumes', filename)
            file.save(filepath)
            file_paths.append(filepath)
        
        if not file_paths:
            return jsonify({"status": "error", "message": "No valid files uploaded"}), 400
        
        return jsonify({
            "status": "success",
            "message": f"{len(file_paths)} files uploaded successfully",
            "file_paths": file_paths
        })
        
    except Exception as e:
        logger.error(f"Error uploading multiple resumes: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/batch-process', methods=['POST'])
def api_batch_process():
    """
    Endpoint to batch process a JD and multiple resumes
    
    Request:
    - jd_text: Job description text (string)
    - resume_paths: List of paths to resume files (array)
    - filters: Filters for shortlisting (JSON)
    
    Response:
    - JSON object with shortlisted candidates
    """
    try:
        if not request.is_json:
            return jsonify({"status": "error", "message": "Request must be JSON"}), 400
            
        data = request.get_json()
        jd_text = data.get('jd_text')
        resume_paths = data.get('resume_paths')
        filters = data.get('filters', {
            "min_score": 50,
            "require_cert": False,
            "top_n": 10
        })
        
        if not jd_text:
            return jsonify({"status": "error", "message": "No job description provided"}), 400
            
        if not resume_paths:
            return jsonify({"status": "error", "message": "No resume paths provided"}), 400
        
        # 1. Summarize the JD
        jd_id = f"jd_{len(os.listdir(os.path.join(app.config['UPLOAD_FOLDER'], 'jds'))) + 1}"
        jd_file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'jds', f"{jd_id}.txt")
        
        with open(jd_file_path, 'w') as f:
            f.write(jd_text)
            
        jd_summary = summarize_jd(jd_text)
        
        # 2. Load parsed resumes
        candidates = load_parsed_resumes(resume_paths)
        
        if not candidates:
            return jsonify({
                "status": "error", 
                "message": "No candidates parsed from resumes", 
                "jd_summary": jd_summary,
                "leaderboard": []
            })
        
        # 3. Shortlist candidates
        leaderboard = shortlist_candidates(jd_summary, candidates, filters, jd_id)
        
        return jsonify({
            "status": "success",
            "message": "Batch processing completed successfully",
            "jd_id": jd_id,
            "jd_summary": jd_summary,
            "leaderboard": leaderboard
        })
        
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)