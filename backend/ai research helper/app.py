from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from tool_finder import suggest_tools
from roadmap_generator import generate_roadmap

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3000",  # Keep for backward compatibility
    "http://127.0.0.1:3000"   # Keep for backward compatibility
])

@app.route('/api/suggest-tools', methods=['POST'])
def suggest_tools_endpoint():
    """Endpoint for the Tool Finder functionality"""
    try:
        data = request.get_json()
        project_idea = data.get('project_idea')
        
        if not project_idea:
            return jsonify({"error": "Project idea is required"}), 400
            
        result = suggest_tools(project_idea)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in suggest-tools endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-roadmap', methods=['POST'])
def generate_roadmap_endpoint():
    """Endpoint for the roadmap generator functionality"""
    try:
        data = request.get_json()
        topic = data.get('topic')
        skill_level = data.get('skill_level', 'beginner')
        
        if not topic:
            return jsonify({"error": "Topic is required"}), 400
            
        roadmap = generate_roadmap(topic, skill_level)
        return jsonify(roadmap)
        
    except Exception as e:
        logger.error(f"Error in generate-roadmap endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 4003))
    app.run(host='0.0.0.0', port=port, debug=True)