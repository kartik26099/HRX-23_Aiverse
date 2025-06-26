from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
import uuid
import json
import logging
import asyncio
from werkzeug.utils import secure_filename
from schemas import ChatMessage
from advisor import career_advisor_response, generate_quiz_from_context
from document_handler import process_document, get_document_segments_for_context
from document_cache import document_cache
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# CORS configuration
CORS(app, origins=[
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",  # Keep for backward compatibility
    "http://127.0.0.1:3000"   # Keep for backward compatibility
])

# BRUTE FORCE CORS - Allow everything
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Global OPTIONS handler
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = app.make_response('')
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response, 200

# In-memory storage for chat sessions
chat_sessions = {}

# Configure upload folder
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'docx', 'doc'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/advisor', methods=['POST'])
def advisor():
    """
    Handle text-based chat messages with document context awareness
    """
    try:
        data = request.get_json()
        message = data.get('message', '')
        history = data.get('history', [])
        session_id = data.get('session_id', str(uuid.uuid4()))
        
        # Convert history to ChatMessage objects
        chat_history = [ChatMessage(role=msg['role'], content=msg['content']) for msg in history]
        
        # Store in session if not already there
        if session_id not in chat_sessions:
            chat_sessions[session_id] = chat_history
        
        # Check if we have a document reference in the history
        doc_id = None
        document_metadata = None
        
        for msg in chat_history:
            if msg.role == "system" and msg.content.startswith("DOCUMENT_REFERENCE:"):
                try:
                    doc_info = json.loads(msg.content.replace("DOCUMENT_REFERENCE:", "").strip())
                    doc_id = doc_info.get("doc_id")
                    if doc_id:
                        document_metadata = document_cache.get_document_metadata(doc_id)
                        break
                except:
                    pass
        
        # Check for document-specific commands
        document_command = None
        segment_indices = None
        
        # Parse common document commands
        if document_metadata and message.lower().strip():
            lower_msg = message.lower().strip()
            
            # Check for summary request
            if any(cmd in lower_msg for cmd in [
                "give me the summary", "summarize", "summary please", "summary",
                "give me a summary", "can you summarize"
            ]):
                document_command = "summary"
            
            # Check for specific segment request (e.g., "show me page 2")
            elif "page" in lower_msg or "section" in lower_msg or "segment" in lower_msg:
                # Extract numbers from the request
                import re
                numbers = re.findall(r'\d+', lower_msg)
                if numbers:
                    segment_indices = [int(num) - 1 for num in numbers]  # Convert to 0-based index
                    document_command = "specific_segments"
            
            # Check for "show me everything" request
            elif any(phrase in lower_msg for phrase in [
                "show me everything", "show all", "show the entire document", 
                "give me the full text", "show me the whole document"
            ]):
                document_command = "full_document"
        
        # Handle document-specific commands
        if document_command and doc_id:
            if document_command == "summary":
                # Get document summary
                document_content = get_document_segments_for_context(doc_id)
                doc_type = document_metadata.get("document_type", "document")
                
                # Create response about the summary
                response = f"Here's a summary of the {doc_type} you uploaded:\n\n{document_content}"
                
            elif document_command == "specific_segments":
                # Get specific segments
                if segment_indices:
                    max_segment = document_metadata.get("segment_count", 1) - 1
                    valid_indices = [idx for idx in segment_indices if 0 <= idx <= max_segment]
                    
                    if valid_indices:
                        document_content = get_document_segments_for_context(doc_id, valid_indices)
                        segments_str = ", ".join(str(idx + 1) for idx in valid_indices)
                        response = f"Here are the requested segments ({segments_str}):\n\n{document_content}"
                    else:
                        response = f"I couldn't find the requested sections. The document has {max_segment + 1} segments (numbered 1-{max_segment + 1})."
                else:
                    response = "I'm not sure which specific sections you're looking for. Could you specify which pages or sections you'd like to see?"
            
            elif document_command == "full_document":
                # Check if document is too large
                segment_count = document_metadata.get("segment_count", 0)
                
                if segment_count > 5:  # Arbitrary threshold for "large document"
                    response = f"The document is quite large ({segment_count} segments). I can show you a summary or specific sections. Which would you prefer?"
                else:
                    # Get all segments for smaller documents
                    all_indices = list(range(segment_count))
                    document_content = get_document_segments_for_context(doc_id, all_indices)
                    response = f"Here's the full content of the document:\n\n{document_content}"
            
            # Add to chat history
            chat_sessions[session_id].append(ChatMessage(role="user", content=message))
            chat_sessions[session_id].append(ChatMessage(role="assistant", content=response))
            
            return jsonify({"response": response, "session_id": session_id})
        
        # For regular chat, get document context to include with the message
        document_context = ""
        if doc_id:
            # Get a summary of the document to include as context
            document_context = get_document_segments_for_context(doc_id)
        
        # Add document context to the user message if available
        enhanced_message = message
        if document_context:
            enhanced_message = f"{message}\n\nContext from uploaded document:\n{document_context}"
        
        # Get response from career advisor - Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(career_advisor_response(enhanced_message, chat_history))
        finally:
            loop.close()
        
        # Update session
        chat_sessions[session_id].append(ChatMessage(role="user", content=message))
        chat_sessions[session_id].append(ChatMessage(role="assistant", content=response))
        
        return jsonify({"response": response, "session_id": session_id})
        
    except Exception as e:
        logger.error(f"Error in advisor endpoint: {str(e)}")
        return jsonify({"response": "I'm sorry, I encountered an error. Please try again.", "error": str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """
    Handle file uploads with document caching
    """
    try:
        # Check if file part exists
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        
        # Check if file selected
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
            
        # Get session ID or create new one
        session_id = request.form.get('session_id', str(uuid.uuid4()))
        
        if file and allowed_file(file.filename):
            # Secure the filename and save to temp location
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{session_id}_{filename}")
            file.save(file_path)
            
            # Process the document and get analysis - Run async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(process_document(file_path, filename))
            finally:
                loop.close()
            
            # Initialize session if doesn't exist
            if session_id not in chat_sessions:
                chat_sessions[session_id] = []
                
            # Add file upload message to history
            chat_sessions[session_id].append(
                ChatMessage(role="user", content=f"I've uploaded a file: {filename}")
            )
            
            # Store document reference in a system message
            doc_reference = {
                "doc_id": result.get("doc_id"),
                "document_type": result.get("document_type", "general"),
                "file_name": filename
            }
            
            chat_sessions[session_id].append(
                ChatMessage(role="system", content=f"DOCUMENT_REFERENCE: {json.dumps(doc_reference)}")
            )
            
            # Create assistant response
            if "error" in result:
                assistant_msg = f"I'm sorry, I had trouble processing your {result.get('document_type', 'file')}. {result.get('error', 'Please try again.')}"
            else:
                # Get document analysis
                analysis = result.get("analysis", "")
                
                # Create a response with the analysis
                doc_type = result.get("document_type", "document")
                assistant_msg = f"I've received your {doc_type} \"{filename}\" and analyzed it. Here's what I found:\n\n{analysis}\n\nYou can ask me specific questions about this {doc_type}, or request to see specific sections."
            
            # Add assistant response to history
            chat_sessions[session_id].append(
                ChatMessage(role="assistant", content=assistant_msg)
            )
            
            # Clean up temp file
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Failed to remove temp file: {str(e)}")
            
            return jsonify({
                "response": assistant_msg,
                "session_id": session_id,
                "document_type": result.get("document_type", "general"),
                "doc_id": result.get("doc_id")
            })
            
        else:
            return jsonify({"error": f"File type not allowed. Supported types: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
            
    except Exception as e:
        logger.error(f"Error in upload endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-quiz', methods=['POST'])
def generate_quiz():
    """
    Generates a quiz based on the chat history or a specified topic.
    """
    try:
        data = request.get_json()
        history = data.get('history', [])
        topic = data.get('topic', 'the current conversation')

        # Convert history to ChatMessage objects for the context
        chat_history = [ChatMessage(role=msg['role'], content=msg['content']) for msg in history]

        # Get the quiz from the advisor logic - Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            quiz_json = loop.run_until_complete(generate_quiz_from_context(topic, chat_history))
        finally:
            loop.close()

        return jsonify(quiz_json)

    except Exception as e:
        logger.error(f"Error in generate_quiz endpoint: {str(e)}")
        return jsonify({"error": f"Failed to generate quiz: {str(e)}"}), 500

@app.route('/api/document/segments', methods=['POST'])
def get_document_segments():
    """
    Get specific document segments
    """
    try:
        data = request.get_json()
        doc_id = data.get('doc_id')
        segment_indices = data.get('segment_indices', [])
        
        if not doc_id:
            return jsonify({"error": "Document ID required"}), 400
            
        content = get_document_segments_for_context(doc_id, segment_indices)
        return jsonify({"content": content})
        
    except Exception as e:
        logger.error(f"Error getting document segments: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/document/metadata', methods=['GET'])
def get_document_metadata():
    """
    Get document metadata
    """
    try:
        doc_id = request.args.get('doc_id')
        
        if not doc_id:
            return jsonify({"error": "Document ID required"}), 400
            
        metadata = document_cache.get_document_metadata(doc_id)
        
        if not metadata:
            return jsonify({"error": "Document not found"}), 404
            
        return jsonify(metadata)
        
    except Exception as e:
        logger.error(f"Error getting document metadata: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/')
def home():
    return {"message": "Career Advisor Chatbot API is running."}

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "AI Advisor",
        "timestamp": datetime.now().isoformat(),
        "active_sessions": len(chat_sessions),
        "port": int(os.getenv('PORT', 4010))
    })

if __name__ == "__main__":
    port = int(os.getenv('PORT', 4010))  # Use PORT env var or default to 4010
    print(f"[ROCKET] AI Advisor Service starting on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)