import requests
import os
import logging
import json
from flask import jsonify

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# It's recommended to set your GitHub token as an environment variable
# to avoid rate limits and access private repos if needed.
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', None)
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY', 'wxJu9G7KyqjjTfLbjaRRso4utGo9mqDX')
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"

def call_mistral_llm(project_idea):
    prompt = f'''
You are an expert research assistant. Given the research project idea below, suggest at least 5 highly specific, precise research topics (not generic, not vague) that a user could pick for their research. Also, suggest at least 5 research techniques (with a main technique name and a short explanation for each) that would be suitable for this research area.

Return your answer as a JSON object with two keys:
- "precise_topics": a list of at least 5 specific research topics (strings)
- "techniques": a list of objects, each with "main" (the main technique name, e.g. "Time Series Analysis") and "rest" (a short explanation, e.g. " to analyze trends over time")

Example:
{{
  "precise_topics": [
    "Impact of COVID-19 on global supply chains in 2020",
    "COVID-19 vaccine distribution challenges in rural areas",
    ...
  ],
  "techniques": [
    {{"main": "Time Series Analysis", "rest": " to analyze infection rate trends over time"}},
    ...
  ]
}}

Research project idea: "{project_idea}"
'''
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "mistral-medium",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 512
    }
    try:
        response = requests.post(MISTRAL_API_URL, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        # Try to extract JSON from the LLM output
        start = content.find('{')
        end = content.rfind('}') + 1
        if start == -1 or end == -1:
            raise ValueError("No JSON found in LLM response")
        json_str = content[start:end]
        result = json.loads(json_str)
        # Validate structure
        if not isinstance(result.get("precise_topics"), list) or not isinstance(result.get("techniques"), list):
            raise ValueError("LLM response JSON missing required keys")
        return result
    except Exception as e:
        logger.error(f"Mistral LLM API error: {e}")
        # Fallback to rule-based if LLM fails
        return None

def detect_project_type(project_idea):
    """Detect if it's a hardware, research, or software project."""
    project_idea_lower = project_idea.lower()
    
    hardware_keywords = ["arduino", "esp32", "sensor", "iot", "raspberry pi", "microcontroller", "circuit"]
    if any(keyword in project_idea_lower for keyword in hardware_keywords):
        return "hardware"
        
    research_keywords = ["research", "study", "paper", "clinical", "dataset", "experiment", "analysis", "covid"]
    if any(keyword in project_idea_lower for keyword in research_keywords):
        return "research"
        
    return "software"

def search_github_repos(query, limit=4):
    """Search GitHub for relevant repositories."""
    headers = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}
    search_url = "https://api.github.com/search/repositories"
    params = {"q": query, "sort": "stars", "per_page": limit}

    try:
        response = requests.get(search_url, params=params, headers=headers)
        response.raise_for_status()
        repos = response.json().get("items", [])
        
        if not repos:
            return []

        return [{
            "name": repo["full_name"],
            "url": repo["html_url"],
            "description": repo["description"] or "No description provided."
        } for repo in repos]

    except Exception as e:
        logger.error(f"GitHub search error: {e}")
        return []

def get_precise_topics(project_idea):
    idea = project_idea.lower()
    if "covid" in idea:
        return [
            "Impact of COVID-19 on global economy in 2020",
            "COVID-19 vaccine development and distribution",
            "Changes in hospital services during the COVID-19 pandemic",
            "Mental health effects of COVID-19 lockdowns",
            "COVID-19 and remote education challenges"
        ]
    elif "climate" in idea:
        return [
            "Climate change impact on agriculture",
            "Urban air quality trends due to climate change",
            "Climate change and migration patterns",
            "Climate change and biodiversity loss",
            "Climate change policy effectiveness in 2020"
        ]
    else:
        # Always return 5 distinct, relevant suggestions
        return [
            f"Impact of {project_idea} on a specific sector or population",
            f"Case study of {project_idea} in a particular region or year",
            f"Technological advancements related to {project_idea}",
            f"Policy analysis regarding {project_idea}",
            f"Comparative study of {project_idea} before and after 2020"
        ]

def get_data_links(project_idea):
    q = project_idea.replace(' ', '+')
    return [
        {"name": "Kaggle Datasets", "url": f"https://www.kaggle.com/search?q={q}", "description": "Search datasets on Kaggle."},
        {"name": "Google Dataset Search", "url": f"https://datasetsearch.research.google.com/search?query={q}", "description": "Search datasets on Google."},
        {"name": "PubMed Papers", "url": f"https://pubmed.ncbi.nlm.nih.gov/?term={q}", "description": "Search biomedical papers on PubMed."},
    ]

def get_technique_youtube_url(technique_name):
    # Map of technique names to specific YouTube video URLs (beginner-friendly)
    technique_videos = {
        "Machine Learning": "https://www.youtube.com/watch?v=Gv9_4yMHFhI",
        "Time Series Analysis": "https://www.youtube.com/watch?v=8j8Ib5h5t9A",
        "Regression Analysis": "https://www.youtube.com/watch?v=ZkjP5RJLQF4",
        "Data Visualization": "https://www.youtube.com/watch?v=2LhoCfjm8R4",
        "Survey Analysis": "https://www.youtube.com/watch?v=2g9lsbJBPEs",
        "Statistical Analysis": "https://www.youtube.com/watch?v=Vfo5le26IhY",
        "Survey Research": "https://www.youtube.com/watch?v=2g9lsbJBPEs",
        "Qualitative Analysis": "https://www.youtube.com/watch?v=3SmOq6gENPM",
        "Content Analysis": "https://www.youtube.com/watch?v=2g9lsbJBPEs",
        "Case Study Method": "https://www.youtube.com/watch?v=5rD0F3BqQ1Y",
    }
    # Fallback to YouTube search
    return technique_videos.get(technique_name, f"https://www.youtube.com/results?search_query={technique_name.replace(' ', '+')}+for+beginners")

def get_techniques(project_idea):
    # Map of technique names to specific YouTube video URLs (beginner-friendly)
    technique_videos = {
        "Machine Learning": "https://www.youtube.com/watch?v=Gv9_4yMHFhI",  # 3Blue1Brown - What is a neural network?
        "Time Series Analysis": "https://www.youtube.com/watch?v=8j8Ib5h5t9A",  # StatQuest - Time Series Analysis
        "Regression Analysis": "https://www.youtube.com/watch?v=ZkjP5RJLQF4",  # StatQuest - Linear Regression
        "Data Visualization": "https://www.youtube.com/watch?v=2LhoCfjm8R4",  # Data School - Data Visualization in Python
        "Survey Analysis": "https://www.youtube.com/watch?v=2g9lsbJBPEs",  # Survey Analysis for Beginners
        "Statistical Analysis": "https://www.youtube.com/watch?v=Vfo5le26IhY",  # StatQuest - Statistics for Beginners
        "Survey Research": "https://www.youtube.com/watch?v=2g9lsbJBPEs",  # Survey Analysis for Beginners
        "Qualitative Analysis": "https://www.youtube.com/watch?v=3SmOq6gENPM",  # Qualitative Data Analysis for Beginners
        "Content Analysis": "https://www.youtube.com/watch?v=2g9lsbJBPEs",  # Survey Analysis for Beginners (fallback)
        "Case Study Method": "https://www.youtube.com/watch?v=5rD0F3BqQ1Y",  # Case Study Research Method
    }
    idea = project_idea.lower()
    techniques = []
    if "covid" in idea or "economy" in idea:
        techniques = [
            {
                "main": "Machine Learning",
                "main_url": technique_videos.get("Machine Learning", "https://www.youtube.com/results?search_query=machine+learning+for+beginners"),
                "rest": " for predicting economic impact or case trends"
            },
            {
                "main": "Time Series Analysis",
                "main_url": technique_videos.get("Time Series Analysis", "https://www.youtube.com/results?search_query=time+series+analysis+for+beginners"),
                "rest": " to analyze trends over time"
            },
            {
                "main": "Regression Analysis",
                "main_url": technique_videos.get("Regression Analysis", "https://www.youtube.com/results?search_query=regression+analysis+for+beginners"),
                "rest": " for modeling relationships between variables"
            },
            {
                "main": "Data Visualization",
                "main_url": technique_videos.get("Data Visualization", "https://www.youtube.com/results?search_query=data+visualization+for+beginners"),
                "rest": " to present findings clearly"
            },
            {
                "main": "Survey Analysis",
                "main_url": technique_videos.get("Survey Analysis", "https://www.youtube.com/results?search_query=survey+analysis+for+beginners"),
                "rest": " for understanding public opinion or behavior"
            }
        ]
    else:
        techniques = [
            {
                "main": "Statistical Analysis",
                "main_url": technique_videos.get("Statistical Analysis", "https://www.youtube.com/results?search_query=statistical+analysis+for+beginners"),
                "rest": " for hypothesis testing and data exploration"
            },
            {
                "main": "Survey Research",
                "main_url": technique_videos.get("Survey Research", "https://www.youtube.com/results?search_query=survey+research+methodology+for+beginners"),
                "rest": " to collect primary data"
            },
            {
                "main": "Qualitative Analysis",
                "main_url": technique_videos.get("Qualitative Analysis", "https://www.youtube.com/results?search_query=qualitative+analysis+for+beginners"),
                "rest": " for in-depth understanding of non-numeric data"
            },
            {
                "main": "Content Analysis",
                "main_url": technique_videos.get("Content Analysis", "https://www.youtube.com/results?search_query=content+analysis+for+beginners"),
                "rest": " for analyzing text, images, or media"
            },
            {
                "main": "Case Study Method",
                "main_url": technique_videos.get("Case Study Method", "https://www.youtube.com/results?search_query=case+study+method+for+beginners"),
                "rest": " for detailed investigation of a single instance"
            }
        ]
    return techniques

def get_tool_suggestions(project_idea):
    """Generate structured suggestions based on the project idea."""
    project_type = detect_project_type(project_idea)
    
    if project_type == "research":
        llm_result = call_mistral_llm(project_idea)
        if llm_result:
            # Add YouTube links to each technique
            techniques = []
            for t in llm_result["techniques"]:
                techniques.append({
                    "main": t["main"],
                    "main_url": get_technique_youtube_url(t["main"]),
                    "rest": t["rest"]
                })
            return {
                "success": True,
                "project_type": "research",
                "tools": {
                    "precise_topics": llm_result["precise_topics"],
                    "data_links": get_data_links(project_idea),
                    "techniques": techniques
                }
            }
        else:
            # fallback to rule-based (old logic)
            return {
                "success": True,
                "project_type": "research",
                "tools": {
                    "precise_topics": [
                        f"Impact of {project_idea} on a specific sector or population",
                        f"Case study of {project_idea} in a particular region or year",
                        f"Technological advancements related to {project_idea}",
                        f"Policy analysis regarding {project_idea}",
                        f"Comparative study of {project_idea} before and after 2020"
                    ],
                    "data_links": get_data_links(project_idea),
                    "techniques": [
                        {
                            "main": "Machine Learning",
                            "main_url": get_technique_youtube_url("Machine Learning"),
                            "rest": " for predicting economic impact or case trends"
                        },
                        {
                            "main": "Time Series Analysis",
                            "main_url": get_technique_youtube_url("Time Series Analysis"),
                            "rest": " to analyze trends over time"
                        },
                        {
                            "main": "Regression Analysis",
                            "main_url": get_technique_youtube_url("Regression Analysis"),
                            "rest": " for modeling relationships between variables"
                        },
                        {
                            "main": "Data Visualization",
                            "main_url": get_technique_youtube_url("Data Visualization"),
                            "rest": " to present findings clearly"
                        },
                        {
                            "main": "Survey Analysis",
                            "main_url": get_technique_youtube_url("Survey Analysis"),
                            "rest": " for understanding public opinion or behavior"
                        }
                    ]
                }
            }
    
    # Placeholder for hardware and software to maintain functionality
    elif project_type == "hardware":
        return {
            "success": True,
            "project_type": "hardware",
            "tools": {
                "precise_topics": [f"Specific hardware aspect of {project_idea}"],
                "data_links": get_data_links(project_idea),
                "techniques": [
                    {"main": "Circuit Simulation", "main_url": get_technique_youtube_url("Circuit Simulation"), "rest": " for testing hardware designs"}
                ]
            }
        }
        
    else: # Software
        return {
            "success": True,
            "project_type": "software",
            "tools": {
                "precise_topics": [f"Specific software aspect of {project_idea}"],
                "data_links": get_data_links(project_idea),
                "techniques": [
                    {"main": "Agile Development", "main_url": get_technique_youtube_url("Agile Development"), "rest": " for iterative software creation"}
                ]
            }
        }

def suggest_tools(project_idea):
    """Main function to suggest tools for a project idea."""
    if not project_idea:
        return {"success": False, "error": "Project idea cannot be empty."}
    
    try:
        # Always use Mistral LLM for all project types
        llm_result = call_mistral_llm(project_idea)
        if llm_result:
            # Add YouTube links to each technique
            techniques = []
            for t in llm_result["techniques"]:
                techniques.append({
                    "main": t["main"],
                    "main_url": get_technique_youtube_url(t["main"]),
                    "rest": t["rest"]
                })
            return {
                "success": True,
                "project_type": detect_project_type(project_idea),
                "tools": {
                    "precise_topics": llm_result["precise_topics"],
                    "data_links": get_data_links(project_idea),
                    "techniques": techniques
                }
            }
        else:
            # fallback to rule-based (old logic)
            return {
                "success": True,
                "project_type": detect_project_type(project_idea),
                "tools": {
                    "precise_topics": [
                        f"Impact of {project_idea} on a specific sector or population",
                        f"Case study of {project_idea} in a particular region or year",
                        f"Technological advancements related to {project_idea}",
                        f"Policy analysis regarding {project_idea}",
                        f"Comparative study of {project_idea} before and after 2020"
                    ],
                    "data_links": get_data_links(project_idea),
                    "techniques": [
                        {
                            "main": "Machine Learning",
                            "main_url": get_technique_youtube_url("Machine Learning"),
                            "rest": " for predicting economic impact or case trends"
                        },
                        {
                            "main": "Time Series Analysis",
                            "main_url": get_technique_youtube_url("Time Series Analysis"),
                            "rest": " to analyze trends over time"
                        },
                        {
                            "main": "Regression Analysis",
                            "main_url": get_technique_youtube_url("Regression Analysis"),
                            "rest": " for modeling relationships between variables"
                        },
                        {
                            "main": "Data Visualization",
                            "main_url": get_technique_youtube_url("Data Visualization"),
                            "rest": " to present findings clearly"
                        },
                        {
                            "main": "Survey Analysis",
                            "main_url": get_technique_youtube_url("Survey Analysis"),
                            "rest": " for understanding public opinion or behavior"
                        }
                    ]
                }
            }
    except Exception as e:
        logger.error(f"Error in tool suggestion logic: {str(e)}")
        return {"success": False, "error": "An unexpected error occurred."}

# For direct testing
if __name__ == "__main__":
    idea = input("Enter your project idea: ").strip()
    result = suggest_tools(idea)
    
    if result["success"]:
        print(f"\n--- Suggestions for your {result['project_type']} project ---")
        for category, items in result["tools"].items():
            print(f"\n## {category}:")
            if isinstance(items, list):
                for item in items:
                    print(f"- {item.get('name')}: {item.get('description', '')} ({item.get('url', '#')})")
            else:
                print(items)
    else:
        print(f"\nError: {result['error']}")