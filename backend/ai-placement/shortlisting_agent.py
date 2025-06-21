import os
import sqlite3
import re
import statistics
import time
from langchain_groq import ChatGroq
from langchain.schema import SystemMessage, HumanMessage
import redis
import hashlib
import logging
from typing import List, Dict, Optional
from datetime import datetime
import numpy as np
import json
from mistralai import Mistral

# Set up logging and profiling
logging.basicConfig(filename="shortlist.log", level=logging.INFO)
profiler = logging.getLogger("profiler")
profiler.setLevel(logging.INFO)
fh = logging.FileHandler("profiler.log")
profiler.addHandler(fh)

# Initialize Redis (optional)
try:
    redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)
    redis_client.ping()
except redis.ConnectionError:
    redis_client = None
    logging.warning("Redis unavailable; caching disabled")

# Groq LLM setup
groq_api_key = os.getenv("GROQ_API_KEY", "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")  # Use environment variable
llm = ChatGroq(
    api_key=groq_api_key,
    model_name="llama-3.1-8b-instant"
)

# SQLite setup
def init_db():
    """Initialize SQLite database and create candidate_scores table."""
    conn = sqlite3.connect("hiring_pipeline.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS candidate_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jd_id TEXT,
            candidate_name TEXT,
            score INTEGER,
            gap TEXT,
            skills TEXT,
            experience TEXT,
            certifications TEXT,
            timestamp DATETIME
        )
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_jd_id ON candidate_scores (jd_id)
    """)
    conn.commit()
    conn.close()

def profile(func):
    """Decorator to log execution time."""
    def sync_wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        profiler.info(f"{func.__name__} took {time.time() - start:.4f} seconds")
        return result
    return sync_wrapper

@profile
def save_score(jd_id: str, candidate: Dict, score: int, gap: str):
    """Save candidate score to SQLite."""
    conn = sqlite3.connect("hiring_pipeline.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO candidate_scores (
            jd_id, candidate_name, score, gap, skills, experience, certifications, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        jd_id,
        candidate.get("name", "Unknown"),
        score,
        gap,
        str(candidate.get("skills", "")),
        candidate.get("experience", ""),
        str(candidate.get("certifications", "")),
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()

@profile
def get_historical_scores(jd_id: str) -> List[int]:
    """Retrieve past scores for a JD."""
    conn = sqlite3.connect("hiring_pipeline.db")
    cursor = conn.cursor()
    cursor.execute("SELECT score FROM candidate_scores WHERE jd_id = ?", (jd_id,))
    scores = [row[0] for row in cursor.fetchall()]
    conn.close()
    return scores

@profile
def analyze_scores(scores: List[int]) -> Dict:
    """Analyze historical scores to adjust thresholds."""
    if not scores:
        return {"mean": 50, "median": 50, "std": 10, "suggested_min_score": 50}  # Lowered default suggested_min_score
    
    mean_score = statistics.mean(scores)
    std_score = statistics.stdev(scores) if len(scores) > 1 else 10
    
    # Use mean_score, but cap it at 55 to make it less strict
    suggested_min = min(55, round(mean_score, 2))
    
    logging.info(f"Historical scores: {scores}, Mean: {mean_score}, Std: {std_score}, Suggested Min: {suggested_min}")
    
    return {
        "mean": round(mean_score, 2),
        "median": round(statistics.median(scores), 2),
        "std": round(std_score, 2),
        "suggested_min_score": suggested_min
    }

@profile
def score_candidate(jd_summary: Dict, candidate: Dict, jd_id: str) -> str:
    """Score a candidate using Groq LLM."""
    raw_key = f"{jd_id}:{candidate.get('name', 'Unknown')}"
    cache_key = f"score:{hashlib.md5(raw_key.encode()).hexdigest()}"
    
    # Check Redis cache
    if redis_client and redis_client.exists(cache_key):
        logging.info(f"Returning cached score for {candidate.get('name', 'Unknown')}")
        return redis_client.get(cache_key)

    system_msg = SystemMessage(content="""
You are a smart hiring assistant. Given a job description and a candidate's resume,
evaluate the match and give:
1. A score out of 100
2. Skill gaps
Only reply in this format:
Score: X%
Gap: [list of missing or weak skills]
""")

    human_msg = HumanMessage(content=f"""
### Job Description Summary:
Skills: {jd_summary.get('skills', 'N/A')}
Experience: {jd_summary.get('experience', 'N/A')}
Certifications: {jd_summary.get('certifications', 'N/A')}

### Candidate Resume:
Name: {candidate.get('name', 'Unknown')}
Skills: {candidate.get('skills', 'N/A')}
Experience: {candidate.get('experience', 'N/A')}
Certifications: {candidate.get('certifications', 'N/A')}
""")

    try:
        response = llm.invoke([system_msg, human_msg])
        result = response.content.strip()
        # Cache result
        if redis_client:
            redis_client.setex(cache_key, 86400, result)
        return result
    except Exception as e:
        logging.error(f"LLM scoring failed for {candidate.get('name', 'Unknown')}: {e}")
        return f"Score: 0%\nGap: [Error: {str(e)}]"

@profile
def shortlist_candidates(jd_summary: Dict, candidates: List[Dict], filters: Dict, jd_id: str) -> List[Dict]:
    """Shortlist candidates with historical score analysis."""
    init_db()
    
    # Analyze historical scores
    historical_scores = get_historical_scores(jd_id)
    score_analysis = analyze_scores(historical_scores)
    dynamic_min_score = max(filters.get("min_score", 0), score_analysis["suggested_min_score"])
    logging.info(f"Score Analysis for JD {jd_id}: {score_analysis}, Dynamic Min Score: {dynamic_min_score}")

    leaderboard = []
    results = [score_candidate(jd_summary, candidate, jd_id) for candidate in candidates]
    
    for candidate, output in zip(candidates, results):
        if isinstance(output, Exception):
            logging.error(f"Scoring failed for {candidate.get('name', 'Unknown')}: {output}")
            output = f"Score: 0%\nGap: [Error: {str(output)}]"

        print(f"\n🔍 Evaluating {candidate.get('name', 'Unknown')}...\n{output}")

        # Parse results
        try:
            score_match = re.search(r"Score:\s*(\d+)%", output)
            gap_match = re.search(r"Gap:\s*\[(.*?)\]", output)
            
            if score_match and gap_match:
                score = int(score_match.group(1))
                gap = gap_match.group(1)
            else:
                # Handle alternative gap format (e.g., Arsalaan's output with "- " list)
                score_match = re.search(r"Score:\s*(\d+)%", output)
                gap_lines = re.findall(r"-\s*(.*?)(?=\n|$)", output)
                if score_match and gap_lines:
                    score = int(score_match.group(1))
                    gap = ", ".join([item.strip() for item in gap_lines])
                else:
                    raise ValueError("Failed to parse score or gap from output")
        except Exception as e:
            logging.error(f"Parsing error for {candidate.get('name', 'Unknown')}: {e}, Output: {output}")
            score = 0
            gap = "Parse error - check output format"

        # Save to database
        save_score(jd_id, candidate, score, gap)

        # Apply filters
        if score < dynamic_min_score:
            logging.info(f"Skipping {candidate.get('name', 'Unknown')} due to score ({score}) below dynamic minimum ({dynamic_min_score})")
            continue

        # Check for required certifications
        required_cert = jd_summary.get("certifications", [])[0] if jd_summary.get("certifications") else None
        has_cert = False
        if required_cert:
            # Check if candidate has the certification in their parsed data
            if candidate.get("certifications") and required_cert in candidate.get("certifications"):
                has_cert = True
            # If not in parsed data, check if the LLM's gap output indicates the certification is present
            elif f"{required_cert}" in output.lower() and "missing" not in output.lower():
                has_cert = True

        if filters.get("require_cert") and required_cert and not has_cert:
            logging.info(f"Skipping {candidate.get('name', 'Unknown')} due to missing required certification: {required_cert}")
            continue

        leaderboard.append({
            "name": candidate.get("name", "Unknown"),
            "score": score,
            "gap": gap,
            "skills": candidate.get("skills", []),
            "experience": candidate.get("experience", ""),
            "certifications": candidate.get("certifications", [])
        })

    # Sort leaderboard by score in descending order
    leaderboard.sort(key=lambda x: x["score"], reverse=True)
    logging.info(f"Leaderboard before truncation: {leaderboard}")
    return leaderboard[:filters.get("top_n", len(leaderboard))]

@profile
def load_parsed_resumes(resume_paths: List[str]) -> List[Dict]:
    """Load parsed resumes from files using MistralResumeParser."""
    from resume_parser import MistralResumeParser  # Import here to avoid circular imports

    # Initialize MistralResumeParser with API key
    mistral_api_key = os.getenv("MISTRAL_API_KEY", "wxJu9G7KyqjjTfLbjaRRso4utGo9mqDX")
    resume_parser = MistralResumeParser(api_key=mistral_api_key)

    candidates = []
    for path in resume_paths:
        try:
            # Verify file exists
            if not os.path.exists(path):
                logging.error(f"Resume file not found: {path}")
                continue

            parsed_data = resume_parser.parse_resume(path)
            if "error" in parsed_data:
                logging.warning(f"No data parsed from resume: {path}, Error: {parsed_data['error']}")
                continue

            # Log the parsed data for debugging
            logging.info(f"Parsed data for {path}: {parsed_data}")

            # Combine experience details into a single string for compatibility
            experience_str = ""
            for exp in parsed_data.get("experience", []):
                desc = exp.get("description", "")
                dates = exp.get("dates", "")
                company = exp.get("company", "")
                title = exp.get("title", "")
                experience_str += f"{title} at {company} ({dates}): {desc}\n"

            candidates.append({
                "name": parsed_data.get("name", "Unknown"),
                "skills": parsed_data.get("skills", []),
                "experience": experience_str.strip(),
                "certifications": parsed_data.get("certifications", [])
            })
        except Exception as e:
            logging.error(f"Failed to parse resume {path}: {e}")
    return candidates

# Example usage
if __name__ == "__main__":
    init_db()
    jd_summary = {
        "skills": ["Python", "JavaScript", "AWS"],
        "experience": "3+ years in software engineering",
        "certifications": []
    }
    resume_paths = ["./resumes/Naman Shah resume.pdf", "./resumes/Arsalaan Resume V2.pdf"]
    filters = {
        "min_score": 50,  # Lowered to make it less strict
        "require_cert": True,
        "top_n": 10
    }
    jd_id = "JD001"

    try:
        candidates = load_parsed_resumes(resume_paths)
        if not candidates:
            result = {"status": "error", "message": "No candidates parsed from resumes", "leaderboard": []}
        else:
            leaderboard = shortlist_candidates(jd_summary, candidates, filters, jd_id)
            result = {
                "status": "success",
                "message": "Candidates evaluated successfully",
                "leaderboard": leaderboard
            }
        print(json.dumps(result, indent=2))
    except Exception as e:
        logging.error(f"Main execution failed: {e}")
        result = {"status": "error", "message": f"Error: {str(e)}", "leaderboard": []}
        print(json.dumps(result, indent=2))