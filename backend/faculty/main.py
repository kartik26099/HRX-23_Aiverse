from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional
import traceback

# Import our modules
from db_setup import SessionLocal, Document, DocumentChunk, Base, engine
from document_processor import process_document
from quiz_generator import QuizQuestion, generate_quiz_for_document
from rag_chatbot import ChatMessage, ChatResponse, chat_with_documents

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False  # Maintain the order of JSON keys in responses

# Add CORS support - simplified to allow all origins with more permissive settings
CORS(app, origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     supports_credentials=True)

# Create a function to get database session (similar to FastAPI's dependency)
def get_db():
    db = SessionLocal()
    try:
        return db
    except Exception as e:
        db.close()
        raise e

# Function to close db when request is done
@app.teardown_appcontext
def close_db(exception=None):
    db = getattr(app, '_database', None)
    if db is not None:
        db.close()

# Ensure database is set up
# Use Flask 2.0+ approach with app context instead of before_first_request
def setup_database():
    # Create SQL tables
    Base.metadata.create_all(bind=engine)

    # Delete all documents and related chunks at startup
    db = SessionLocal()
    try:
        db.query(DocumentChunk).delete()
        db.query(Document).delete()
        db.commit()
        print("All documents and chunks deleted at startup.")
    finally:
        db.close()

# Call setup_database with app context
with app.app_context():
    setup_database()

# Document upload endpoint
@app.route('/upload-document', methods=['POST'])
def upload_document():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        title = request.form.get('title')
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        if not title:
            return jsonify({"error": "Title is required"}), 400
        
        # Process the document
        document_id = process_document(file, file.filename, title)
        
        return jsonify({
            "message": "Document processed successfully", 
            "document_id": document_id
        })
    except Exception as e:
        print(f"Error in upload_document: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"Error processing document: {str(e)}"}), 500

# Get all documents endpoint
@app.route('/documents', methods=['GET'])
def get_documents():
    db = get_db()
    try:
        documents = db.query(Document).all()
        return jsonify([{"id": doc.id, "title": doc.title} for doc in documents])
    finally:
        db.close()

# Generate quiz endpoint
@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    data = request.json
    doc_id = data.get('doc_id')
    
    if not doc_id:
        return jsonify({"error": "Document ID is required"}), 400
    
    print(f"Received quiz generation request for document ID: {doc_id}")
    quiz = generate_quiz_for_document(doc_id)
    
    if not quiz:
        return jsonify({"error": "Could not generate quiz for this document."}), 404
    
    return jsonify({"quiz": [q.__dict__ for q in quiz]})

# Evaluate quiz endpoint
@app.route('/evaluate-quiz', methods=['POST'])
def evaluate_quiz():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    quiz = data.get('quiz', [])
    answers = data.get('answers', {})
    
    # Convert string keys to integers if needed
    answers = {int(k): v for k, v in answers.items()}
    
    topic_stats = {}
    correct = 0
    
    for idx, q in enumerate(quiz):
        user_ans = answers.get(idx)
        q_correct_index = q.get('correct_index')
        
        if user_ans is not None and user_ans == q_correct_index:
            correct += 1
            topic = q.get('topic')
            topic_stats[topic] = topic_stats.get(topic, 0) + 1
    
    total = len(quiz)
    analysis = {}
    
    for q in quiz:
        topic = q.get('topic')
        if topic not in analysis:
            topic_correct = topic_stats.get(topic, 0)
            topic_total = sum(1 for tq in quiz if tq.get('topic') == topic)
            accuracy = topic_correct / topic_total if topic_total > 0 else 0
            
            if accuracy >= 0.75:
                status = "strong"
            elif accuracy <= 0.5:
                status = "needs practice"
            else:
                status = "satisfactory"
            
            analysis[topic] = status
    
    return jsonify({"score": correct, "total": total, "topic_analysis": analysis})

# Chat endpoint
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message')
        conversation_history = data.get('conversation_history', [])
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400
        
        # Convert the list of dictionaries to ChatMessage objects
        if conversation_history:
            conversation_history = [ChatMessage(**msg) for msg in conversation_history]
        
        # Since Flask is synchronous but the chat function is async,
        # we need to run the async function in a synchronous context
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        response = loop.run_until_complete(chat_with_documents(user_message, conversation_history))
        loop.close()
        
        # Convert ChatResponse to dict for JSON serialization
        response_dict = {
            "response": response.response,
            "sources": response.sources
        }
            
        return jsonify(response_dict)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Error processing chat: {str(e)}"}), 500

@app.route('/')
def index():
    return jsonify({"message": "Learning Platform API with Flask and Groq"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)