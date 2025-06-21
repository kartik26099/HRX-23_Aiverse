import json
import re
from typing import List
from pydantic import BaseModel
from db_setup import SessionLocal, Document, DocumentChunk
from document_processor import generate_embedding, cosine_similarity
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Groq setup
from groq import Groq
groq_client = Groq(api_key="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")

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
    """Extract topics from text using Groq with improved prompting."""
    system_prompt = """You are an expert at identifying educational topics in text.
    Extract 3-5 main topics that would be suitable for quiz generation.
    Return only a JSON array of topic strings."""
    
    user_prompt = f"""Analyze this text and identify 3-5 main educational topics:

{text[:3000]}

Return only a JSON array of strings representing the main topics.
Example: ["Topic 1", "Topic 2", "Topic 3"]"""
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        
        response_text = chat_completion.choices[0].message.content
        topics_data = parse_llm_json(response_text)
        
        if isinstance(topics_data, list) and all(isinstance(t, str) for t in topics_data):
            return topics_data
        else:
            print("Topic extraction returned invalid format")
            return ["General Knowledge"]
            
    except Exception as e:
        print(f"Error extracting topics: {str(e)}")
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
    """Generate quiz questions using Groq LLM with improved prompting for JSON output."""
    system_prompt = """You are an expert quiz generator. 
    You create clear, concise multiple-choice questions with exactly 4 options per question.
    Always ensure:
    1. Questions are directly answerable from the provided context
    2. One and only one option is correct
    3. All options are plausible but distinct
    4. The correct_index is 0-based (0, 1, 2, or 3)
    5. Output is valid RFC8259 compliant JSON with no additional text
    6. Each question has a relevant topic field
    
    """

    user_prompt = f"""Generate {n} medium-difficulty multiple-choice questions about '{topic}' based on this content:

    {context}

    Format your response as a JSON array of objects with these exact keys:
    - question: The question text
    - options: Array of 4 possible answers
    - correct_index: Integer index (0-3) of the correct answer
    - topic: "{topic}"

    """

    for attempt in range(3):  # Try up to 3 times
        try:
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama-3.3-70b-versatile",
                response_format={"type": "json_object"}  # Enforce JSON output
            )
            
            response_text = chat_completion.choices[0].message.content
            # Attempt to parse JSON with repair mechanisms
            try:
                extracted_text = extract_json_from_markdown(response_text)
                questions_data = json.loads(extracted_text)
            except json.JSONDecodeError:
                repaired_text = repair_json(response_text)
                questions_data = json.loads(repaired_text)
            
            # If we got a dict instead of a list, wrap it in a list
            if isinstance(questions_data, dict):
                questions_data = [questions_data]
            
            # Validate the structure of each question
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
                return validated_questions
            
            # If we got here, validation failed
            print(f"Attempt {attempt+1}: Generated questions failed validation")
            
        except json.JSONDecodeError as jde:
            print(f"Attempt {attempt+1} JSON parsing error: {str(jde)}")
        except Exception as e:
            error_str = str(e)
            print(f"Attempt {attempt+1} error: {error_str}")
            # Check if it's a 400 error with failed_generation content
            if "400" in error_str and "failed_generation" in error_str:
                try:
                    # Extract the failed_generation part from the error message
                    start_idx = error_str.find("'failed_generation':") + len("'failed_generation':")
                    end_idx = error_str.rfind("}")
                    if start_idx > len("'failed_generation':") and end_idx > start_idx:
                        failed_gen_text = error_str[start_idx:end_idx+1].strip().strip("'").strip()
                        # Attempt to parse the failed_generation as JSON
                        failed_gen_data = json.loads(failed_gen_text) if failed_gen_text else {}
                        # Check if it contains usable question data
                        if isinstance(failed_gen_data, list):
                            questions_data = failed_gen_data
                        elif isinstance(failed_gen_data, dict) and any(key in failed_gen_data for key in ["question", "options"]):
                            questions_data = [failed_gen_data]
                        else:
                            # If no direct question data, look for nested structures
                            questions_data = []
                            for key, value in failed_gen_data.items():
                                if isinstance(value, list) and len(value) > 0 and isinstance(value[0], dict):
                                    questions_data.extend(value)
                        
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
                            print(f"Extracted {len(validated_questions)} questions from failed_generation in error response")
                            return validated_questions
                        
                        print(f"Attempt {attempt+1}: No valid questions found in failed_generation")
                except json.JSONDecodeError as jde2:
                    print(f"Attempt {attempt+1}: Failed to parse failed_generation content - {str(jde2)}")
                except Exception as e2:
                    print(f"Attempt {attempt+1}: Error processing failed_generation - {str(e2)}")
    
    print("All attempts to generate questions failed")
    return []


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