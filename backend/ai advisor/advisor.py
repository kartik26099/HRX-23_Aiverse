from openrouter_client import openrouter_client
from config import MODEL_NAME
from schemas import ChatMessage
from typing import List, Optional, Dict
from document_cache import document_cache
from document_handler import get_document_segments_for_context
import logging
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def career_advisor_response(
    message: str, 
    history: Optional[List[ChatMessage]] = None,
    doc_id: Optional[str] = None
) -> str:
    """
    Generate a career advisor response based on user message, conversation history,
    and document context if available.
    
    Args:
        message: The current user message
        history: Optional list of previous chat messages
        doc_id: Optional document ID to retrieve context from cache
        
    Returns:
        String containing the AI response
    """
    try:
        # Get document context if available
        document_context = ""
        document_metadata = None
        
        if doc_id:
            document_metadata = document_cache.get_document_metadata(doc_id)
            if document_metadata:
                # Get document summary or relevant segments for context
                document_context = get_document_segments_for_context(doc_id)
                logger.info(f"Retrieved document context for doc_id: {doc_id}, length: {len(document_context)}")
        
        # System message with enhanced instructions based on document presence
        system_content = "You are a helpful, friendly, and expert career advisor. Ask questions, give personalized advice, and guide the user to reflect on their interests and strengths."
        
        # Add document awareness to system message if document exists
        if document_metadata:
            doc_type = document_metadata.get("document_type", "document")
            file_name = document_metadata.get("file_name", "uploaded document")
            system_content += f" The user has uploaded a {doc_type} file named '{file_name}' which you can reference in your responses."
        
        system_message = {
            "role": "system", 
            "content": system_content
        }
        
        conversation = [system_message]
        
        # Add conversation history if it exists
        if history:
            # Convert ChatMessage objects to dict format expected by API
            for msg in history:
                # Skip system messages that contain document references
                if msg.role == "system" and msg.content.startswith("DOCUMENT_REFERENCE:"):
                    continue
                    
                # Ensure role is one of the valid values: 'system', 'user', or 'assistant'
                role = msg.role
                if role not in ['system', 'user', 'assistant']:
                    # Default to 'user' if from user, otherwise 'assistant'
                    role = 'user' if 'user' in role.lower() else 'assistant'
                
                conversation.append({"role": role, "content": msg.content})
        
        # Enhance user message with document context if available
        enhanced_message = message
        if document_context:
            enhanced_message = f"{message}\n\nContext from the uploaded {document_metadata.get('document_type', 'document')}:\n{document_context}"
        
        # Add the enhanced user message
        conversation.append({"role": "user", "content": enhanced_message})
        
        logger.info(f"Sending request to OpenRouter with {len(conversation)} messages")
        
        # Add repetition penalties to the model parameters
        completion = openrouter_client.chat.completions.create(
            messages=conversation,
            model=MODEL_NAME,
            temperature=0.7,
            frequency_penalty=0.7,
            presence_penalty=0.6,
            max_tokens=500
        )
        
        response = completion.choices[0].message.content.strip()
        logger.info(f"Received response from OpenRouter: {response[:50]}...")
        return response
        
    except Exception as e:
        logger.error(f"Error getting response from OpenRouter API: {str(e)}")
        return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later."

async def generate_quiz_from_context(topic: str, history: List[ChatMessage]) -> dict:
    """
    Generates a multiple-choice quiz based on the conversation history.
    """
    try:
        # Prepare the conversation history for the prompt
        formatted_history = "\\n".join([f"{msg.role}: {msg.content}" for msg in history])

        # Create a prompt to generate the quiz
        prompt = f"""
        Based on the following conversation about "{topic}", please generate a 5-question multiple-choice quiz.
        The quiz should test the key concepts discussed.

        Conversation History:
        ---
        {formatted_history}
        ---

        Respond with ONLY a valid JSON object. Do not add any text or markdown formatting outside the JSON.
        The JSON object should have a single key "questions" which is an array of question objects.
        Each question object should have:
        - "question": The question text (string).
        - "options": An array of 4 strings.
        - "answer": The string of the correct option.
        - "explanation": A brief explanation for the correct answer (string).

        Example Format:
        {{
            "questions": [
                {{
                    "question": "What is the capital of France?",
                    "options": ["London", "Berlin", "Paris", "Madrid"],
                    "answer": "Paris",
                    "explanation": "Paris has been the capital of France for centuries."
                }}
            ]
        }}
        """

        chat_completion = openrouter_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant that creates quizzes based on conversations."},
                {"role": "user", "content": prompt},
            ],
            model=MODEL_NAME,
            temperature=0.7,
            response_format={"type": "json_object"},
        )

        response_content = chat_completion.choices[0].message.content
        quiz_json = json.loads(response_content)
        return quiz_json

    except json.JSONDecodeError as e:
        logger.error(f"Failed to decode JSON from quiz response: {e}")
        return {"error": "The model returned a malformed quiz. Please try again."}
    except Exception as e:
        logger.error(f"Error generating quiz from OpenRouter API: {str(e)}")
        return {"error": "I encountered an error while trying to create the quiz."}