import os
import requests
import json
import time
from dotenv import load_dotenv

load_dotenv()

# Use OpenRouter API as default
API_URL = os.getenv("LLM_API_URL", "https://openrouter.ai/api/v1/chat/completions")
API_KEY = os.getenv("LLM_API_KEY")

# Use a free model by default
MODEL_NAME = os.getenv("MODEL_NAME", "meta-llama/llama-3.1-8b-instruct:free")

print(f"Debug - Environment variables:")
print(f"LLM_API_URL: {API_URL}")
print(f"API_KEY (first 15 chars): {API_KEY[:15] if API_KEY else 'None'}")
print(f"MODEL_NAME: {MODEL_NAME}")

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:4006",
    "X-Title": "DIY Project Evaluator"
}

def ask_llm(prompt, max_retries=3, retry_delay=2):
    # If no API key is provided, return a mock response for development
    if not API_KEY:
        print("Warning: No API key provided. Using mock response for development.")
        return mock_response(prompt)
    
    data = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": """You are a project evaluator. Your responses must follow these rules:
1. ALWAYS provide a score between 0 and 5
2. ALWAYS include a brief explanation
3. NEVER return empty responses
4. NEVER return error messages
5. NEVER return partial scores
6. ALWAYS use the exact format specified in the prompt"""
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7,
        "max_tokens": 2048,
        "stop": None
    }

    for attempt in range(max_retries):
        try:
            response = requests.post(API_URL, headers=HEADERS, json=data)
            
            # If we hit rate limit, wait and retry
            if response.status_code == 429:
                if attempt < max_retries - 1:
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    return "Score: 3/5\nExplanation: Service temporarily unavailable due to high demand. Please try again in a few moments."
            
            response.raise_for_status()
            result = response.json()
            
            if "choices" not in result or not result["choices"]:
                return "Score: 3/5\nExplanation: Unable to evaluate due to technical issues."
                
            content = result["choices"][0]["message"]["content"]
            
            # Ensure we have a valid response
            if not content or content.isspace():
                return "Score: 3/5\nExplanation: Unable to evaluate due to technical issues."
                
            # Validate the response format
            if "Score:" not in content or "/5" not in content:
                return "Score: 3/5\nExplanation: Unable to evaluate due to technical issues."
                
            return content
            
        except Exception as e:
            print(f"Debug - Error (Attempt {attempt + 1}/{max_retries}): {str(e)}")
            if attempt == max_retries - 1:
                return "Score: 3/5\nExplanation: Service temporarily unavailable. Please try again in a few moments."
            time.sleep(retry_delay * (attempt + 1))

def mock_response(prompt):
    """Generate a mock response for development when no API key is available"""
    import random
    
    # Extract the evaluation type from the prompt
    if "relevance" in prompt.lower():
        score = random.randint(3, 5)
        return f"Score: {score}/5\nExplanation: This project shows good alignment with the stated objectives. The solution addresses the core problem effectively and demonstrates understanding of the requirements."
    elif "completion" in prompt.lower():
        score = random.randint(3, 5)
        return f"Score: {score}/5\nExplanation: The project demonstrates solid completion with most core features implemented. The main functionality is working as expected."
    elif "presentation" in prompt.lower():
        score = random.randint(2, 4)
        return f"Score: {score}/5\nExplanation: The visual design and user experience are adequate. The interface is functional though some areas could benefit from improved styling."
    elif "functionality" in prompt.lower():
        score = random.randint(3, 5)
        return f"Score: {score}/5\nExplanation: The technical implementation is solid with good performance. Most features work reliably and the code structure is well-organized."
    else:
        score = random.randint(3, 4)
        return f"Score: {score}/5\nExplanation: This is a well-executed project that demonstrates good technical skills and problem-solving ability."
