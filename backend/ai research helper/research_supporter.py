import os
import json
import traceback
from dotenv import load_dotenv
import google.generativeai as genai
import requests

load_dotenv()

# --- Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SCRAPINGDOG_API_KEY = os.getenv("SCRAPINGDOG_API_KEY")

# --- Gemini Model Initialization ---
try:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in the environment variables.")
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    print("Gemini model initialized successfully.")
except Exception as e:
    print(f"Error configuring Gemini API: {str(e)}")
    model = None

# --- Core Chat Logic ---
def get_chat_response(query: str, history: list) -> dict:
    """
    Generates a chat response using the Gemini model, augmented with web search results.
    """
    if not model:
        return {
            "answer": "The AI model is not configured correctly. Please check the API keys.",
            "key_takeaways": [],
            "follow_up_questions": [],
            "references": [],
        }

    # Get search results to augment the prompt
    search_results = get_scholar_search_results(query)

    try:
        prompt = f"""
        You are an expert AI Research Assistant. Your user is asking for help with their research.
        Based on their query, the provided scholarly search results, and the conversation history, give a comprehensive and helpful response.
        
        Conversation History (for context):
        {history}
        
        User's query: "{query}"
        
        Relevant scholarly articles from the web:
        {search_results}
        
        Please structure your response in the following JSON format. Do not include any text, markdown, or code block formatting outside of the JSON object.
        {{
            "answer": "Your detailed and helpful answer to the user's query goes here. It should be comprehensive, well-structured, and directly address their question. Use Markdown within this string for formatting if needed (e.g., lists, bolding).",
            "key_takeaways": [
                "A key point or summary of the most important information.",
                "Another critical insight or piece of data.",
                "A third important takeaway."
            ],
            "follow_up_questions": [
                "A relevant follow-up question the user might have.",
                "Another insightful question to guide their research.",
                "A third question to prompt deeper thinking."
            ],
            "references": [
                {{
                    "title": "Title of the first scholarly article you referenced",
                    "url": "URL of the article"
                }},
                {{
                    "title": "Title of the second scholarly article you referenced",
                    "url": "URL of the article"
                }}
            ]
        }}
        """
        
        response = model.generate_content(prompt)
        
        # Clean and parse the JSON response
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        response_json = json.loads(cleaned_response)
        
        return response_json

    except Exception as e:
        print(f"Error in get_chat_response: {str(e)}")
        traceback.print_exc()
        # Return a structured error
        return {
            "answer": f"I encountered an error while processing your request. The model returned an invalid format. Please try again. Error: {str(e)}",
            "key_takeaways": [],
            "follow_up_questions": [],
            "references": [],
        }

def get_scholar_search_results(query: str, num_results: int = 5) -> str:
    """
    Fetches search results from ScrapingDog's Google Scholar API for a given query.
    """
    if not SCRAPINGDOG_API_KEY:
        print("Warning: SCRAPINGDOG_API_KEY is not set. Skipping web search.")
        return "Web search is disabled. No API key provided."

    try:
        url = "https://api.scrapingdog.com/google_scholar"
        params = {"api_key": SCRAPINGDOG_API_KEY, "q": query, "num": num_results}
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        results = response.json()
        
        # Format the results into a string for the prompt
        formatted_results = []
        for i, result in enumerate(results.get("scholar_results", [])):
            formatted_results.append(
                f"Result {i+1}: {result.get('title')}\\n"
                f"Link: {result.get('title_link')}\\n"
                f"Snippet: {result.get('publication_info', {}).get('summary', 'No summary available.')}\\n"
            )
        
        return "\\n---\\n".join(formatted_results) if formatted_results else "No scholarly articles found."
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching scholarly search results: {str(e)}")
        return f"Error fetching scholarly search results: {str(e)}"
    except Exception as e:
        print(f"An unexpected error occurred during scholarly search: {str(e)}")
        return f"An unexpected error occurred during scholarly search: {str(e)}"

# This part is removed so it's not a standalone app anymore.
# The logic is now imported into the main app.py
#
# if __name__ == '__main__':
#     from flask import Flask, request, jsonify
#     from flask_cors import CORS
#     app = Flask(__name__)
#     CORS(app)
#
#     @app.route('/chat', methods=['POST'])
#     def chat_endpoint():
#         data = request.get_json()
#         query = data.get('query')
#         history = data.get('history', [])
#         if not query:
#             return jsonify({"error": "Query is required"}), 400
#         response = get_chat_response(query, history)
#         return jsonify(response)
#
#     app.run(host='0.0.0.0', port=5003, debug=True)