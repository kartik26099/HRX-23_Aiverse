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
    print("Gemini model for roadmap generation initialized successfully.")
except Exception as e:
    print(f"Error configuring Gemini API for roadmap generation: {str(e)}")
    model = None

# --- Core Roadmap Logic ---
def generate_roadmap_logic(topic: str, detail_level: str, timeline: str, user_expertise: str) -> dict:
    """
    Generates a research roadmap based on user inputs.
    """
    if not model:
        return {"error": "AI model is not configured. Please check API keys."}

    try:
        prompt = f"""
        You are an expert research mentor. Create a personalized and detailed research roadmap on the topic: "{topic}".

        **User Profile:**
        - **Current Expertise:** "{user_expertise}"
        - **Desired Timeline:** {timeline}
        - **Desired Detail Level:** {detail_level}

        **Instructions:**
        1.  **Personalize the Content:** Tailor the tasks and descriptions based on the user's expertise. For a beginner, explain foundational concepts. For an expert, focus on advanced methodologies and novel research gaps.
        2.  **Structure the Output:** Respond ONLY with a valid JSON object following this exact structure. Do not add any text or markdown formatting outside the JSON.
        
        **JSON Structure:**
        {{
            "title": "Personalized Research Roadmap: {topic}",
            "description": "A {detail_level} roadmap for researching {topic}, tailored for a user with '{user_expertise}' knowledge and a {timeline} timeline.",
            "timeline": "{timeline}",
            "modules": [
                {{
                    "title": "Module 1: Foundational Understanding & Literature Review",
                    "description": "A description of the first phase of research, personalized to the user's level.",
                    "weeks": "1-2",
                    "tasks": [
                        {{
                            "title": "Task 1.1: Deep Dive into Core Concepts",
                            "description": "Review seminal papers and foundational theories. For a beginner, this means understanding the basic terminology. For an expert, this means revisiting classic papers in the context of modern advancements.",
                            "type": "Reading"
                        }},
                        {{
                            "title": "Task 1.2: Identify Research Gaps",
                            "description": "Analyze existing literature to find unanswered questions or areas that need more investigation. This is a critical step for defining a novel research contribution.",
                            "type": "Analysis"
                        }}
                    ]
                }},
                {{
                    "title": "Module 2: Methodology and Experimentation",
                    "description": "A description of the second phase of research.",
                    "weeks": "3-5",
                    "tasks": [
                        {{
                            "title": "Task 1: Develop Research Questions",
                            "description": "Formulate clear and concise research questions.",
                            "type": "Writing"
                        }},
                        {{
                            "title": "Task 2: Design Experiment",
                            "description": "Design an experimental setup to test the hypotheses.",
                            "type": "Design"
                        }}
                    ]
                }}
            ]
        }}
        """
        response = model.generate_content(prompt)
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        roadmap_json = json.loads(cleaned_response)
        
        # Enhance with scholarly articles
        enhanced_roadmap = add_scholar_articles_to_roadmap(roadmap_json)
        return enhanced_roadmap

    except Exception as e:
        print(f"Error in generate_roadmap_logic: {str(e)}")
        traceback.print_exc()
        return {"error": f"Failed to generate roadmap: {str(e)}"}

def add_scholar_articles_to_roadmap(roadmap: dict) -> dict:
    """
    Enriches each roadmap task with relevant scholarly articles using ScrapingDog.
    """
    if not SCRAPINGDOG_API_KEY:
        print("Warning: SCRAPINGDOG_API_KEY is not set. Skipping resource fetching.")
        return roadmap

    try:
        for module in roadmap.get("modules", []):
            for task in module.get("tasks", []):
                query = f"{task['title']} {roadmap['title']}"
                search_results = get_scholar_articles(query, num_results=3)
                task["resources"] = search_results
        return roadmap
    except Exception as e:
        print(f"Error adding resources to roadmap: {str(e)}")
        return roadmap # Return original roadmap on error

def get_scholar_articles(query: str, num_results: int) -> list:
    """
    Fetches scholarly articles for a given query using ScrapingDog's Google Scholar API.
    """
    if not SCRAPINGDOG_API_KEY:
        print("Warning: SCRAPINGDOG_API_KEY is not set. Skipping resource fetching.")
        return []

    try:
        url = "https://api.scrapingdog.com/google_scholar"
        params = {"api_key": SCRAPINGDOG_API_KEY, "q": query, "num": num_results}
        response = requests.get(url, params=params)
        response.raise_for_status()
        results = response.json()
        
        articles = []
        for result in results.get("scholar_results", []):
            articles.append({
                "title": result.get("title"),
                "url": result.get("title_link"),
                "snippet": result.get("publication_info", {}).get("summary", "No summary available."),
            })
        return articles
    except Exception as e:
        print(f"Could not fetch scholarly articles for query '{query}': {e}")
        return []

# This part is removed so it's not a standalone app anymore.
# The logic is now imported into the main app.py
#
# if __name__ == '__main__':
#     # ... (standalone server code for testing) ...