from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional
import traceback
import asyncio

# Import our modules
from db_setup import SessionLocal, Document, DocumentChunk, Base, engine
from document_processor import process_document
from quiz_generator import QuizQuestion, generate_quiz_for_document, generate_detailed_explanation
from rag_chatbot import ChatMessage, ChatResponse, chat_with_documents

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False  # Maintain the order of JSON keys in responses
app.config['MAX_CONTENT_LENGTH'] = 15 * 1024 * 1024  # 15MB file size limit

# Add CORS support - simplified to allow all origins with more permissive settings
CORS(app, origins=["http://localhost:3001", "http://localhost:5173", "http://localhost:8080", "http://localhost:3000"], 
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
    
    # Don't delete documents on startup - let them persist
    print("Database initialized. Documents will persist across restarts.")

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
        title = request.form.get('title', file.filename)
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        # Check file size (15MB limit)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()  # Get file size
        file.seek(0)  # Reset to beginning
        
        max_size = 15 * 1024 * 1024  # 15MB in bytes
        if file_size > max_size:
            return jsonify({"error": f"File size ({file_size / (1024*1024):.1f}MB) exceeds the 15MB limit"}), 400
        
        # Process the document
        document_id = process_document(file, file.filename, title)
        
        return jsonify({
            "message": "Document processed successfully", 
            "document_id": document_id,
            "title": title
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
        return jsonify([{
            "id": doc.id, 
            "title": doc.title,
            "summary": doc.summary,
            "topics": doc.topics,
            "created_at": doc.created_at.isoformat() if hasattr(doc, 'created_at') and doc.created_at else None
        } for doc in documents])
    finally:
        db.close()

# Get detailed document information endpoint
@app.route('/documents/detailed', methods=['GET'])
def get_documents_detailed():
    db = get_db()
    try:
        documents = db.query(Document).all()
        detailed_docs = []
        for doc in documents:
            # Count chunks for this document
            chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
            detailed_docs.append({
                "id": doc.id,
                "title": doc.title,
                "summary": doc.summary,
                "topics": doc.topics,
                "chunk_count": chunk_count,
                "uploaded_at": doc.created_at.isoformat() if hasattr(doc, 'created_at') and doc.created_at else None
            })
        return jsonify(detailed_docs)
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

# Evaluate quiz endpoint with detailed explanations
@app.route('/evaluate-quiz', methods=['POST'])
def evaluate_quiz():
    print("=== EVALUATE QUIZ ENDPOINT CALLED ===")
    data = request.json
    print(f"Received data: {data}")
    
    if not data:
        print("No data provided")
        return jsonify({"error": "No data provided"}), 400
    
    quiz = data.get('quiz', [])
    answers = data.get('answers', {})
    doc_id = data.get('doc_id')
    
    print(f"Quiz length: {len(quiz)}")
    print(f"Answers: {answers}")
    print(f"Document ID: {doc_id}")
    
    # Convert string keys to integers if needed
    answers = {int(k): v for k, v in answers.items()}
    
    topic_stats = {}
    correct = 0
    detailed_results = []
    
    print("Starting evaluation loop...")
    for idx, q in enumerate(quiz):
        print(f"Processing question {idx}: {q.get('question', 'No question')[:50]}...")
        user_ans = answers.get(idx)
        q_correct_index = q.get('correct_index')
        is_correct = user_ans is not None and user_ans == q_correct_index
        
        print(f"User answer: {user_ans}, Correct index: {q_correct_index}, Is correct: {is_correct}")
        
        if is_correct:
            correct += 1
            topic = q.get('topic')
            topic_stats[topic] = topic_stats.get(topic, 0) + 1
        
        # Generate detailed explanation for each question
        print(f"Generating explanation for question {idx}...")
        explanation = generate_detailed_explanation(
            question=q.get('question'),
            correct_answer=q.get('options', [])[q_correct_index] if q_correct_index is not None else "",
            user_answer=q.get('options', [])[user_ans] if user_ans is not None else "Not answered",
            is_correct=is_correct,
            topic=q.get('topic'),
            doc_id=doc_id
        )
        print(f"Explanation generated: {explanation[:100]}...")
        
        detailed_results.append({
            "question_index": idx,
            "question": q.get('question'),
            "user_answer": q.get('options', [])[user_ans] if user_ans is not None else "Not answered",
            "correct_answer": q.get('options', [])[q_correct_index] if q_correct_index is not None else "",
            "is_correct": is_correct,
            "explanation": explanation,
            "topic": q.get('topic')
        })
    
    total = len(quiz)
    analysis = {}
    
    print(f"Evaluation complete. Correct: {correct}/{total}")
    
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
            
            analysis[topic] = {
                "status": status,
                "accuracy": accuracy,
                "correct": topic_correct,
                "total": topic_total
            }
    
    # Generate overall performance insights
    overall_insights = generate_performance_insights(analysis, correct, total)
    
    result = {
        "score": correct, 
        "total": total, 
        "percentage": (correct / total * 100) if total > 0 else 0,
        "topic_analysis": analysis,
        "detailed_results": detailed_results,
        "overall_insights": overall_insights
    }
    
    print(f"Returning result: {result}")
    print("=== EVALUATE QUIZ ENDPOINT FINISHED ===")
    
    return jsonify(result)

def generate_performance_insights(topic_analysis: Dict, correct: int, total: int) -> Dict:
    """Generate overall performance insights and recommendations."""
    percentage = (correct / total * 100) if total > 0 else 0
    
    # Determine overall performance level
    if percentage >= 90:
        performance_level = "Excellent"
        message = "Outstanding performance! You have a strong grasp of the material."
    elif percentage >= 80:
        performance_level = "Good"
        message = "Good work! You understand most of the concepts well."
    elif percentage >= 70:
        performance_level = "Satisfactory"
        message = "Satisfactory performance. There's room for improvement in some areas."
    elif percentage >= 60:
        performance_level = "Needs Improvement"
        message = "You need to review the material more thoroughly."
    else:
        performance_level = "Requires Attention"
        message = "Significant improvement needed. Consider reviewing the material completely."
    
    # Identify areas for improvement
    weak_areas = [topic for topic, data in topic_analysis.items() if data['status'] == 'needs practice']
    strong_areas = [topic for topic, data in topic_analysis.items() if data['status'] == 'strong']
    
    recommendations = []
    if weak_areas:
        recommendations.append(f"Focus on reviewing: {', '.join(weak_areas)}")
    if strong_areas:
        recommendations.append(f"Strong areas: {', '.join(strong_areas)}")
    
    return {
        "performance_level": performance_level,
        "message": message,
        "recommendations": recommendations,
        "weak_areas": weak_areas,
        "strong_areas": strong_areas
    }

# Chat endpoint
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message')
        conversation_history = data.get('conversation_history', [])
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400
        
        # Check if there are any documents in the database
        db = get_db()
        try:
            documents = db.query(Document).all()
            if not documents:
                return jsonify({
                    "response": "I don't have any documents to reference. Please upload a document first so I can help you with questions about it.",
                    "sources": []
                })
        finally:
            db.close()
        
        # Convert the list of dictionaries to ChatMessage objects
        if conversation_history:
            conversation_history = [ChatMessage(**msg) for msg in conversation_history]
        
        # Since Flask is synchronous but the chat function is async,
        # we need to run the async function in a synchronous context
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
    return jsonify({"message": "Learning Platform API with Flask and OpenRouter"})

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "AI Faculty Backend",
        "timestamp": "2024-01-01T00:00:00Z"
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 4002))  # Use PORT env var or default to 4002
    print(f"Starting AI Faculty Backend on port {port}...")
    print(f"Health check available at: http://localhost:{port}/health")
    app.run(debug=True, host='0.0.0.0', port=port)