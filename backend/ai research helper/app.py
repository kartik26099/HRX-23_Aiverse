from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import traceback

# Import core logic from your scripts
# (Assuming they are refactored to be importable)
from research_supporter import get_chat_response
from roadmap_generator import generate_roadmap_logic

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",  # Keep for backward compatibility
    "http://127.0.0.1:3000"   # Keep for backward compatibility
])

# Test route
@app.route('/test', methods=['GET'])
def test():
    return jsonify({"message": "AI Research Helper server is running!"}), 200

# Chat endpoint
@app.route('/chat', methods=['POST'])
def handle_chat():
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return jsonify({"error": "Missing 'query' in request body"}), 400
        
        query = data['query']
        history = data.get('history', []) # History is optional
        
        # Get response from the research supporter logic
        response_data = get_chat_response(query, history)
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"Error in /chat endpoint: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# Roadmap endpoint
@app.route('/generate-roadmap', methods=['POST'])
def handle_roadmap():
    try:
        data = request.get_json()
        required_fields = ['topic', 'detail_level', 'timeline', 'user_expertise']
        if not all(field in data for field in required_fields):
            missing = [field for field in required_fields if field not in data]
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        # Get roadmap from the generator logic
        roadmap_data = generate_roadmap_logic(
            data['topic'],
            data['detail_level'],
            data['timeline'],
            data['user_expertise']
        )
        
        return jsonify(roadmap_data)

    except Exception as e:
        print(f"Error in /generate-roadmap endpoint: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    # Use a different port to avoid conflicts, e.g., 5005
    port = int(os.environ.get("PORT", 5005))
    app.run(host='0.0.0.0', port=port, debug=True) 