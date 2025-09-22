import json
import re
from typing import List
from pydantic import BaseModel
from db_setup import SessionLocal, Document, DocumentChunk
from document_processor import generate_embedding, cosine_similarity
import os
from dotenv import load_dotenv
import requests
import time
import google.generativeai as genai

# Load environment variables
load_dotenv()

# OpenRouter setup (same as DIY evaluator)
API_URL = os.getenv("LLM_API_URL", "https://openrouter.ai/api/v1/chat/completions")
API_KEY = os.getenv("LLM_API_KEY", "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")
MODEL_NAME = os.getenv("MODEL_NAME", "meta-llama/llama-3.1-8b-instruct:free")

# Load Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print(f"🔑 Gemini API Key Status: {'✅ Configured' if GEMINI_API_KEY else '❌ Not found'}")
if GEMINI_API_KEY:
    print(f"🔑 Gemini API Key (first 10 chars): {GEMINI_API_KEY[:10]}...")
else:
    print("⚠️ No Gemini API key found - using fallback configuration")

if GEMINI_API_KEY:
    try:
        print(f"🤖 Attempting to configure Gemini AI...")
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        print("✅ Gemini model for topic extraction initialized successfully.")
    except Exception as e:
        print(f"❌ Error configuring Gemini API: {str(e)}")
        gemini_model = None
else:
    gemini_model = None

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:8000",
    "X-Title": "AI Faculty"
}

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    topic: str

def extract_json_from_markdown(text: str) -> str:
    """Extract JSON from markdown code blocks or directly from text."""
    # Look for content between triple backticks
    match = re.search(r'``````', text, re.DOTALL)
    if match:
        return match.group(1).strip()
    
    # Try to find content between square brackets or curly braces
    match = re.search(r'(\[[\s\S]*\])', text, re.DOTALL)
    if match:
        return match.group(1).strip()
    
    # If we find individual JSON objects without array wrapper, add the wrapper
    if text.strip().startswith('{') and text.strip().endswith('}') and '},r\s*{ ' in text:
        return f"[{text}]"
    
    return text.strip()

def parse_llm_json(text: str, max_attempts: int = 3) -> any:
    """Parse JSON from LLM output with multiple fallback strategies."""
    text = extract_json_from_markdown(text)
    
    # First attempt: direct parsing
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Second attempt: try to fix common JSON issues
    try:
        # Replace single quotes with double quotes
        fixed_text = text.replace("'", '"')
        # Fix unescaped newlines in strings
        fixed_text = re.sub(r'"\s*\n\s*"', '" "', fixed_text)
        # Fix trailing commas
        fixed_text = re.sub(r',\s*}', '}', fixed_text)
        fixed_text = re.sub(r',\s*]', ']', fixed_text)
        # If it looks like individual JSON objects without array wrapper
        if fixed_text.strip().startswith('{') and fixed_text.strip().endswith('}') and '},r\s*{ ' in fixed_text:
            fixed_text = f"[{fixed_text}]"
        
        return json.loads(fixed_text)
    except json.JSONDecodeError:
        pass
    
    # Third attempt: use regex to extract JSON objects
    try:
        pattern = r'\[\s*\{.*\}\s*\]'  # Match array of objects
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except (json.JSONDecodeError, AttributeError):
        pass
    
    # If all attempts fail, raise an exception
    raise ValueError("Failed to parse JSON from LLM output")

def extract_topics_from_text(text: str) -> List[str]:
    """Extract topics from text using OpenRouter first, fallback to Gemini if needed."""
    system_prompt = "You are an expert at identifying educational topics in text. Extract 3-5 main topics that would be suitable for quiz generation. Return only a JSON array of topic strings."
    user_prompt = f"""Analyze this text and identify 3-5 main educational topics:\n\n{text[:3000]}\n\nReturn only a JSON array of strings representing the main topics. Example: [\"Topic 1\", \"Topic 2\", \"Topic 3\"]"""

    # Try OpenRouter first
    max_retries = 5
    base_delay = 3
    for attempt in range(max_retries):
        try:
            data = {
                "model": MODEL_NAME,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens":800,
                "response_format": {"type": "json_object"}
            }
            response = requests.post(API_URL, headers=HEADERS, json=data)
            if response.status_code == 429:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    print(f"[extract_topics_from_text] Rate limited, waiting {delay}s before retry {attempt+1}")
                    time.sleep(delay)
                    continue
                else:
                    print("[extract_topics_from_text] All retries failed due to rate limiting. Falling back to Gemini.")
                    break
            response.raise_for_status()
            result = response.json()
            response_text = result["choices"][0]["message"]["content"]
            topics_data = parse_llm_json(response_text)
            if isinstance(topics_data, list) and all(isinstance(t, str) for t in topics_data):
                print("[extract_topics_from_text] Used OpenRouter for topic extraction.")
                return topics_data
            else:
                print("Topic extraction returned invalid format")
                return ["General Knowledge"]
        except Exception as e:
            print(f"[extract_topics_from_text] Attempt {attempt+1}: {str(e)}")
            if attempt == max_retries - 1:
                print("[extract_topics_from_text] All retries failed. Falling back to Gemini.")
            time.sleep(base_delay * (2 ** attempt))

    # Fallback to Gemini if OpenRouter fails
    if gemini_model:
        try:
            gemini_prompt = f"You are an expert at identifying educational topics in text. Extract 3-5 main topics that would be suitable for quiz generation. Return only a JSON array of topic strings.\n\n{text[:3000]}\n\nReturn only a JSON array of strings representing the main topics. Example: [\"Topic 1\", \"Topic 2\", \"Topic 3\"]"
            response = gemini_model.generate_content(gemini_prompt)
            cleaned = response.text.strip().replace("```json", "").replace("```", "")
            topics_data = json.loads(cleaned)
            if isinstance(topics_data, list) and all(isinstance(t, str) for t in topics_data):
                print("[extract_topics_from_text] Used Gemini for topic extraction.")
                return topics_data
            else:
                print("[extract_topics_from_text] Gemini returned invalid format. Returning fallback topic.")
        except Exception as e:
            print(f"[extract_topics_from_text] Gemini error: {str(e)}. Returning fallback topic.")
    return ["General Knowledge"]

def repair_json(text: str) -> str:
    """Attempt to repair malformed JSON."""
    text = extract_json_from_markdown(text)
    # Replace single quotes with double quotes
    text = text.replace("'", '"')
    # Fix trailing commas
    text = re.sub(r',\s*}', '}', text)
    text = re.sub(r',\s*]', ']', text)
    # Fix unescaped newlines in strings
    text = re.sub(r'"\s*\n\s*"', '" "', text)
    # If it looks like individual JSON objects without array wrapper
    if text.strip().startswith('{') and text.strip().endswith('}') and '},r\s*{' in text:
        text = f"[{text}]"
    return text

def generate_questions(topic: str, context: str, n: int) -> List[QuizQuestion]:
    """Generate quiz questions using Gemini as primary, fallback to OpenRouter if needed."""
    if gemini_model:
        try:
            gemini_prompt = f"You are an expert quiz generator. Create {n} multiple-choice questions (with exactly 4 options each) about '{topic}' based on this content:\n\n{context}\n\nRespond ONLY with a JSON array of objects. Each object must have: question, options (array of 4), correct_index (0-3), topic. Example: [{{'question': '...', 'options': ['A','B','C','D'], 'correct_index': 1, 'topic': '{topic}'}}]"
            response = gemini_model.generate_content(gemini_prompt)
            cleaned = response.text.strip().replace("```json", "").replace("```", "")
            questions_data = json.loads(cleaned)
            if isinstance(questions_data, dict):
                questions_data = [questions_data]
            validated_questions = []
            for q in questions_data:
                if (isinstance(q, dict) and 
                    "question" in q and 
                    "options" in q and 
                    "correct_index" in q and 
                    "topic" in q and
                    isinstance(q["options"], list) and
                    len(q["options"]) == 4 and
                    isinstance(q["correct_index"], int) and
                    0 <= q["correct_index"] <= 3):
                    validated_questions.append(QuizQuestion(**q))
            if validated_questions:
                print("[generate_questions] Used Gemini for question generation.")
                return validated_questions
            else:
                print("[generate_questions] Gemini returned invalid format. Falling back to OpenRouter.")
        except Exception as e:
            print(f"[generate_questions] Gemini error: {str(e)}. Falling back to OpenRouter.")

    # Fallback to OpenRouter if Gemini fails
    system_prompt = """You are an expert quiz generator. \nYou create clear, concise multiple-choice questions with exactly 4 options per question.\nAlways ensure:\n1. Questions are directly answerable from the provided context\n2. One and only one option is correct\n3. All options are plausible but distinct\n4. The correct_index is 0-based (0, 1, 2, or 3)\n5. Output is valid RFC8259 compliant JSON with no additional text\n6. Each question has a relevant topic field\n"""
    user_prompt = f"""Generate {n} medium-difficulty multiple-choice questions about '{topic}' based on this content:\n\n    {context}\n\n    Format your response as a JSON array of objects with these exact keys:\n    - question: The question text\n    - options: Array of 4 possible answers\n    - correct_index: Integer index (0-3) of the correct answer\n    - topic: \"{topic}\"\n    """
    max_retries = 5
    base_delay = 3
    for attempt in range(max_retries):
        try:
            data = {
                "model": MODEL_NAME,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 1000,
                "response_format": {"type": "json_object"}
            }
            response = requests.post(API_URL, headers=HEADERS, json=data)
            if response.status_code == 429:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    print(f"[generate_questions] Rate limited, waiting {delay}s before retry {attempt+1}")
                    time.sleep(delay)
                    continue
                else:
                    print("[generate_questions] All retries failed due to rate limiting. Returning fallback question.")
                    break
            response.raise_for_status()
            result = response.json()
            response_text = result["choices"][0]["message"]["content"]
            try:
                extracted_text = extract_json_from_markdown(response_text)
                questions_data = json.loads(extracted_text)
            except json.JSONDecodeError:
                repaired_text = repair_json(response_text)
                questions_data = json.loads(repaired_text)
            if isinstance(questions_data, dict):
                questions_data = [questions_data]
            validated_questions = []
            for q in questions_data:
                if (isinstance(q, dict) and 
                    "question" in q and 
                    "options" in q and 
                    "correct_index" in q and 
                    "topic" in q and
                    isinstance(q["options"], list) and
                    len(q["options"]) == 4 and
                    isinstance(q["correct_index"], int) and
                    0 <= q["correct_index"] <= 3):
                    validated_questions.append(QuizQuestion(**q))
            if validated_questions:
                print("[generate_questions] Used OpenRouter for question generation.")
                return validated_questions
            print(f"[generate_questions] Attempt {attempt+1}: Generated questions failed validation")
        except Exception as e:
            print(f"[generate_questions] Attempt {attempt+1}: {str(e)}")
            if attempt == max_retries - 1:
                print("[generate_questions] All retries failed. Returning fallback question.")
            time.sleep(base_delay * (2 ** attempt))
    # If all attempts failed, return a fallback question
    return [QuizQuestion(
        question=f"What is the main concept of {topic}?",
        options=["Concept A", "Concept B", "Concept C", "Concept D"],
        correct_index=0,
        topic=topic
    )]

def generate_detailed_explanation(question: str, correct_answer: str, user_answer: str, is_correct: bool, topic: str, doc_id: int = None) -> str:
    """Generate detailed explanation for quiz questions using OpenRouter."""
    
    # Get document context if available
    context = ""
    if doc_id:
        try:
            db = SessionLocal()
            document = db.query(Document).filter(Document.id == doc_id).first()
            if document:
                # Get relevant chunks for context
                chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).limit(3).all()
                context = "\n".join([chunk.content for chunk in chunks])
        except Exception as e:
            print(f"Error getting document context: {str(e)}")
        finally:
            db.close()
    
    system_prompt = """You are an expert educator providing clear, structured explanations for quiz questions.
    
    Your explanations must be well-formatted and user-friendly with the following structure:
    
    1. **Answer Status**: Start with "✅ Correct!" or "❌ Incorrect" 
    2. **Quick Summary**: One sentence explaining if they got it right or wrong
    3. **Detailed Explanation**: Clear explanation of why the answer is correct/incorrect
    4. **Key Points**: 2-3 bullet points highlighting important concepts
    5. **Learning Tip**: A helpful tip for understanding the topic better
    
    IMPORTANT: Do NOT use markdown formatting like **bold** or ## headers. 
    Just use plain text with clear sections separated by line breaks.
    Keep explanations concise but educational. Be encouraging and constructive.
    """
    
    user_prompt = f"""Question: {question}
Topic: {topic}
Correct Answer: {correct_answer}
User's Answer: {user_answer}
Is Correct: {'Yes' if is_correct else 'No'}

{f'Document Context: {context[:1000]}' if context else ''}

Please provide a well-structured explanation following the format specified in the system prompt."""

    # Try multiple times with exponential backoff for rate limiting
    max_retries = 3
    base_delay = 2
    
    for attempt in range(max_retries):
        try:
            data = {
                "model": MODEL_NAME,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 500
            }
            
            response = requests.post(API_URL, headers=HEADERS, json=data)
            
            # Handle rate limiting
            if response.status_code == 429:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)  # Exponential backoff
                    print(f"Rate limited, waiting {delay} seconds before retry {attempt + 1}")
                    time.sleep(delay)
                    continue
                else:
                    # If all retries failed, return a fallback explanation
                    return generate_fallback_explanation(question, correct_answer, user_answer, is_correct, topic)
            
            response.raise_for_status()
            result = response.json()
            
            explanation = result["choices"][0]["message"]["content"].strip()
            
            # Clean up the explanation to remove extra markdown formatting
            explanation = clean_explanation_formatting(explanation)
            
            # Ensure the explanation has proper structure
            if not explanation.startswith(('✅', '❌')):
                # If the AI didn't follow the format, create a structured version
                return create_structured_explanation(question, correct_answer, user_answer, is_correct, topic, explanation)
            
            return explanation
            
        except Exception as e:
            print(f"Error generating explanation (attempt {attempt + 1}): {str(e)}")
            if attempt == max_retries - 1:
                return generate_fallback_explanation(question, correct_answer, user_answer, is_correct, topic)
            time.sleep(base_delay * (2 ** attempt))

def clean_explanation_formatting(text: str) -> str:
    """Clean up explanation formatting to remove extra markdown and ensure clean output."""
    
    # Remove extra asterisks from bold text (convert **text** to text)
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    
    # Remove markdown headers (convert ## Header to Header)
    text = re.sub(r'^##\s*', '', text, flags=re.MULTILINE)
    
    # Remove extra bullet point formatting
    text = re.sub(r'^\*\s*', '• ', text, flags=re.MULTILINE)
    
    # Remove any remaining markdown code blocks
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
    text = re.sub(r'`.*?`', '', text)
    
    # Clean up extra whitespace
    text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
    text = text.strip()
    
    return text

def create_structured_explanation(question: str, correct_answer: str, user_answer: str, is_correct: bool, topic: str, raw_explanation: str) -> str:
    """Create a structured explanation from raw AI output."""
    
    status_icon = "✅" if is_correct else "❌"
    status_text = "Correct!" if is_correct else "Incorrect"
    
    if is_correct:
        summary = f"Great job! You correctly identified that {correct_answer} is the right answer."
        key_points = [
            f"Understanding {topic} concepts is crucial for success",
            f"The correct answer demonstrates proper knowledge of the subject",
            f"Keep up the excellent work in this area"
        ]
        learning_tip = f"To strengthen your knowledge of {topic}, try applying these concepts to real-world scenarios."
    else:
        summary = f"The correct answer is {correct_answer}. Your answer '{user_answer}' was not correct."
        key_points = [
            f"Review the fundamental concepts of {topic}",
            f"Pay attention to the specific details in the question",
            f"Consider how different options relate to the topic"
        ]
        learning_tip = f"To improve your understanding of {topic}, focus on the core principles and practice with similar questions."
    
    structured_explanation = f"""{status_icon} {status_text}

Summary: {summary}

Detailed Explanation:
{raw_explanation}

Key Points:
{chr(10).join([f"• {point}" for point in key_points])}

Learning Tip: {learning_tip}"""
    
    return structured_explanation

def generate_fallback_explanation(question: str, correct_answer: str, user_answer: str, is_correct: bool, topic: str) -> str:
    """Generate a fallback explanation when API calls fail."""
    
    status_icon = "✅" if is_correct else "❌"
    status_text = "Correct!" if is_correct else "Incorrect"
    
    if is_correct:
        summary = f"Excellent! You correctly answered: {correct_answer}"
        explanation = f"You demonstrated a good understanding of {topic}. The correct answer shows that you have grasped the key concepts."
        key_points = [
            f"Understanding {topic} is essential for success",
            f"Your answer demonstrates proper knowledge",
            f"Keep practicing to strengthen your skills"
        ]
        learning_tip = f"To excel further in {topic}, try applying these concepts to practical scenarios."
    else:
        summary = f"The correct answer is: {correct_answer}"
        explanation = f"Your answer '{user_answer}' was not correct. The correct answer is {correct_answer}. This question tests your understanding of {topic}."
        key_points = [
            f"Review the core concepts of {topic}",
            f"Pay attention to question details",
            f"Practice with similar questions to improve"
        ]
        learning_tip = f"Focus on the fundamental principles of {topic} and how they apply to different scenarios."
    
    fallback_explanation = f"""{status_icon} {status_text}

Summary: {summary}

Detailed Explanation:
{explanation}

Key Points:
{chr(10).join([f"• {point}" for point in key_points])}

Learning Tip: {learning_tip}"""
    
    return fallback_explanation

def generate_quiz_for_document(doc_id: int, max_questions_per_topic: int = 2) -> List[QuizQuestion]:
    """Generate a quiz for a document with improved error handling."""
    print(f"Starting quiz generation for document ID: {doc_id}")
    db = SessionLocal()
    
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        print(f"Document found: {doc is not None}")
        
        if not doc:
            print("Document not found, returning empty list")
            return []
        
        # Extract topics from the document content
        print(f"Extracting topics from document content (first 100 chars): {doc.content[:100]}")
        topics = extract_topics_from_text(doc.content)
        print(f"Extracted topics: {topics}")
        
        chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).all()
        print(f"Found {len(chunks)} chunks for document")
        
        chunk_contents = [chunk.content for chunk in chunks]
        quiz = []
        
        for topic in topics:
            print(f"Processing topic: {topic}")
            topic_embedding = generate_embedding(topic)
            
            # Find relevant chunks for this topic
            chunk_embeddings = [generate_embedding(chunk) for chunk in chunk_contents]
            similarities = []
            
            for i, chunk_emb in enumerate(chunk_embeddings):
                similarity = cosine_similarity(topic_embedding, chunk_emb)
                similarities.append((similarity, i))
            
            similarities.sort(reverse=True)
            top_chunks = [chunk_contents[idx] for _, idx in similarities[:3]]
            context = " ".join(top_chunks)
            print(f"Created context with {len(context)} characters")
            
            # Generate questions for this topic
            topic_questions = generate_questions(topic, context, max_questions_per_topic)
            print(f"Generated {len(topic_questions)} questions for topic {topic}")
            
            quiz.extend(topic_questions)
        
        max_questions = max_questions_per_topic * len(topics)
        print(f"Final quiz has {len(quiz)} questions (max allowed: {max_questions})")
        
        return quiz[:max_questions]
        
    except Exception as e:
        print(f"Error in generate_quiz_for_document: {str(e)}")
        import traceback
        traceback.print_exc()
        return []
        
    finally:
        db.close()