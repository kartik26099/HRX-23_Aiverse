import time
import logging
import json
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_groq import ChatGroq
from typing import Dict

# Set up logging
logging.basicConfig(filename="jd_summarizer.log", level=logging.INFO)

# Initialize LLM with lazy loading
_llm = None
def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            groq_api_key="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",
            model_name="llama-3.3-70b-versatile"
        )
    return _llm

# Comprehensive LLM prompt for JD summarization
prompt = PromptTemplate(
    template="""
You are an expert JD summarizer. Extract and summarize key requirements from the job description into the following JSON format:

{{
  "skills": "string",
  "experience": "string",
  "education": "string",
  "certifications": "string",
  "projects": "string"
}}

**Rules:**
- Summarize concisely using comma-separated lists for skills and certifications.
- Return "" for fields not explicitly mentioned.
- Skills: Include technical (e.g., Python, React) and non-technical skills (e.g., project management, customer service). Exclude certifications (e.g., PMP, cloud computing) or concepts (e.g., microservices). Normalize variants (e.g., "CRM" to "Customer Relationship Management"). Preserve multi-word skills (e.g., "RESTful APIs", "financial analysis").
- Experience: Specify years (e.g., "3+ years") and infer domain from role or skills (e.g., React → frontend development, SEO → marketing). Use lowercase and avoid underscores.
- Education: Include only degrees (e.g., "Bachelor's degree in Computer Science", "MBA", "JD") or "" if not specified. Include "preferred" qualifications. Exclude verbose text (e.g., "or equivalent", "is required", "qualification").
- Certifications: List specific certifications (e.g., "cloud computing certification", "PMP"). Include if "preferred." Exclude verbose text (e.g., "will be given preference", "certification" for PMP).
- Projects: Capture phrases like "[term] projects" (e.g., "campaign management projects") or "" if not specified. Exclude prefixes (e.g., "experience with").
- Handle both technical and non-technical roles (e.g., software engineer, marketing manager, nurse).
- Only return valid JSON. Do not include explanations or extra text.
- Use natural language understanding to clean and normalize text without relying on external rules or patterns.

**Examples:**
JD: "Looking for a Frontend Developer with 2+ years of experience in React and JavaScript. Bachelor's degree in Computer Science or equivalent required. TypeScript experience is a bonus."
Output: {{"skills": "React, JavaScript, TypeScript", "experience": "2+ years in frontend development", "education": "Bachelor's degree in Computer Science", "certifications": "", "projects": ""}}

JD: "Hiring a Marketing Manager with 5+ years of experience in digital marketing. MBA preferred. Requires skills in SEO and content creation. PMP certification is a plus. Experience with campaign management projects is desired."
Output: {{"skills": "SEO, content creation, Customer Relationship Management, digital marketing", "experience": "5+ years in marketing", "education": "MBA", "certifications": "PMP", "projects": "campaign management projects"}}

JD: {jd}
""",
    input_variables=["jd"]
)

# JSON output parser
parser = JsonOutputParser()

# Create LCEL chain
def create_chain():
    try:
        llm = get_llm()
        return prompt | llm | parser
    except Exception as e:
        logging.error(f"Error creating chain: {e}")
        print(f"Error creating chain: {e}")
        return None

chain = create_chain()

# Performance monitoring decorator
def profile(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start
        logging.info(f"{func.__name__} took {duration:.4f} seconds")
        return result
    return wrapper

@profile
def summarize_jd(jd_text: str) -> Dict[str, str]:
    print(f"summarize_jd received: '{jd_text}'")
    
    # Handle None or invalid input
    if jd_text is None:
        logging.warning("Empty input (None)")
        return {
            "skills": "",
            "experience": "",
            "education": "",
            "certifications": "",
            "projects": ""
        }
    
    # Handle non-string input
    if not isinstance(jd_text, str):
        logging.warning(f"Invalid input type: {type(jd_text)}")
        return {
            "skills": "",
            "experience": "",
            "education": "",
            "certifications": "",
            "projects": ""
        }
    
    # Handle empty string or whitespace-only string
    if not jd_text.strip():
        logging.warning("Empty string or whitespace-only input")
        return {
            "skills": "",
            "experience": "",
            "education": "",
            "certifications": "",
            "projects": ""
        }
    
    retries = 2
    best_output = None
    
    # Default output in case all attempts fail
    default_output = {
        "skills": "",
        "experience": "",
        "education": "",
        "certifications": "",
        "projects": ""
    }
    
    # Check if chain is available
    if chain is None:
        logging.error("LLM chain is not available")
        return default_output
    
    for attempt in range(retries):
        try:
            print(f"Attempt {attempt + 1} to invoke LLM")
            
            # Create a simpler backup approach in case the chain fails
            if attempt > 0:
                print("Using direct LLM call as fallback")
                llm = get_llm()
                prompt_text = f"Extract key information from this job description:\n\n{jd_text}\n\nFormat as JSON with these keys: skills, experience, education, certifications, projects."
                raw_result = llm.invoke(prompt_text)
                
                try:
                    import re
                    json_match = re.search(r'\{.*\}', raw_result.content, re.DOTALL)
                    if json_match:
                        extracted_json = json_match.group(0)
                        print(f"Extracted JSON: {extracted_json}")
                        parsed_result = json.loads(extracted_json)
                        result = {
                            "skills": parsed_result.get("skills", "").replace("N/A", ""),
                            "experience": parsed_result.get("experience", "").replace("N/A", ""),
                            "education": parsed_result.get("education", "").replace("N/A", ""),
                            "certifications": parsed_result.get("certifications", "").replace("N/A", ""),
                            "projects": parsed_result.get("projects", "").replace("N/A", "")
                        }
                    else:
                        print("No JSON found in response")
                        continue
                except Exception as parse_error:
                    print(f"JSON parsing error: {parse_error}")
                    continue
            else:
                result = chain.invoke({"jd": jd_text})
            
            print(f"Raw LLM output (attempt {attempt + 1}): {result}")
            logging.info(f"Raw LLM output (attempt {attempt + 1}): {result}")
            
            # Validate the result is a dictionary with expected keys
            if isinstance(result, dict) and all(key in result for key in default_output.keys()):
                print(f"Valid result found on attempt {attempt + 1}")
                best_output = {
                    "skills": result.get("skills", "").replace("N/A", ""),
                    "experience": result.get("experience", "").replace("N/A", ""),
                    "education": result.get("education", "").replace("N/A", ""),
                    "certifications": result.get("certifications", "").replace("N/A", ""),
                    "projects": result.get("projects", "").replace("N/A", "")
                }
                break
            else:
                print(f"Invalid result structure on attempt {attempt + 1}: {type(result)}")
                
                if isinstance(result, str):
                    try:
                        parsed = json.loads(result)
                        if isinstance(parsed, dict) and any(key in parsed for key in default_output.keys()):
                            best_output = {
                                "skills": parsed.get("skills", "").replace("N/A", ""),
                                "experience": parsed.get("experience", "").replace("N/A", ""),
                                "education": parsed.get("education", "").replace("N/A", ""),
                                "certifications": parsed.get("certifications", "").replace("N/A", ""),
                                "projects": parsed.get("projects", "").replace("N/A", "")
                            }
                            break
                    except:
                        pass
                        
        except Exception as e:
            logging.warning(f"Error on attempt {attempt + 1}: {e}")
            print(f"Error on attempt {attempt + 1}: {str(e)}")
    
    if not best_output:
        logging.warning("LLM failed to produce valid output, using default")
        best_output = default_output
    
    print(f"Final best_output: {best_output}")
    return best_output

def test_jd_summarization():
    test_jds = [
        {
            "title": "Frontend Developer Role Open",
            "text": """
            We're looking for a passionate Frontend Developer with 2+ years of experience in React and JavaScript.
            A Bachelor's degree in Computer Science or equivalent is required. Experience with TypeScript and Figma is a bonus.
            Prior experience with remote teams is preferred.
            """
        },
        {
            "title": "Opening: Backend Engineer with Django Experience",
            "text": """
            InnovateSoft is hiring a Backend Engineer with 4+ years of experience in Django and RESTful APIs.
            A strong foundation in PostgreSQL and Docker is essential. Experience with microservices architecture is a plus.
            Candidates with certifications in cloud computing will be given preference.
            """
        },
        {
            "title": "We're Hiring: Product Manager",
            "text": """
            Join us as a Product Manager to lead cross-functional teams and deliver impactful digital products.
            Minimum 5 years of product management experience required. MBA or equivalent qualification is preferred.
            Familiarity with Agile methodologies, Jira, and stakeholder management is important.
            """
        },
        {
            "title": "Marketing Manager Position",
            "text": """
            We are hiring a Marketing Manager with 5+ years of experience in digital marketing.
            Skills in SEO, content creation, and CRM are required. MBA is preferred.
            PMP certification is a plus. Experience with campaign management projects is desired.
            """
        },
        {
            "title": "Test JD Direct",
            "text": "This is a direct test job description with minimal details."
        }
    ]
    
    for jd in test_jds:
        jd_text = jd["text"].strip()
        summary = summarize_jd(jd_text)
        print(f"\n[SUMMARY for {jd['title']}]:")
        for key, value in summary.items():
            print(f"  - {key}: {value}")

if __name__ == "__main__":
    test_jd_summarization()