import os
import logging
from datetime import datetime
import requests
import urllib.parse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def google_search_link(query):
    return f"https://www.google.com/search?q={urllib.parse.quote(query)}"

def youtube_search_link(query):
    return f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}"

def generate_roadmap(topic, skill_level="beginner"):
    """Generate a learning roadmap for a given topic"""
    try:
        topic = topic.strip()
        if not topic:
            return {"error": "Topic is required"}

        # Step-by-step research workflow
        steps = [
            {
                "title": "Understand the Basics",
                "description": f"Learn the fundamental concepts and terminology related to {topic}.",
                "resources": [
                    {"title": f"Google: Introduction to {topic}", "url": google_search_link(f"introduction to {topic}"), "snippet": f"Search for beginner-friendly articles and definitions about {topic}."},
                    {"title": f"YouTube: {topic} for Beginners", "url": youtube_search_link(f"{topic} for beginners"), "snippet": f"Watch beginner videos on {topic}."}
                ]
            },
            {
                "title": "Literature Review",
                "description": f"Survey existing research papers, articles, and books on {topic}.",
                "resources": [
                    {"title": f"Google Scholar: {topic}", "url": f"https://scholar.google.com/scholar?q={urllib.parse.quote(topic)}", "snippet": f"Find scholarly articles and papers on {topic}."},
                    {"title": f"YouTube: How to do a Literature Review", "url": youtube_search_link("how to do a literature review"), "snippet": "Video guides on conducting a literature review."}
                ]
            },
            {
                "title": "Define Research Questions & Objectives",
                "description": f"Formulate clear research questions and objectives for your study on {topic}.",
                "resources": [
                    {"title": "Google: How to write research questions", "url": google_search_link("how to write research questions"), "snippet": "Guides and examples for writing research questions."},
                    {"title": "YouTube: Research Objectives", "url": youtube_search_link("research objectives"), "snippet": "Videos explaining how to set research objectives."}
                ]
            },
            {
                "title": "Choose Research Methods",
                "description": f"Select appropriate research methods (qualitative, quantitative, mixed) for {topic}.",
                "resources": [
                    {"title": "Google: Research methods for {topic}", "url": google_search_link(f"research methods for {topic}"), "snippet": f"Find suitable research methods for {topic}."},
                    {"title": "YouTube: Types of Research Methods", "url": youtube_search_link("types of research methods"), "snippet": "Overview of research methodologies."}
                ]
            },
            {
                "title": "Data Collection",
                "description": f"Gather data using surveys, experiments, datasets, or other sources relevant to {topic}.",
                "resources": [
                    {"title": f"Kaggle: {topic} datasets", "url": f"https://www.kaggle.com/search?q={urllib.parse.quote(topic)}", "snippet": f"Find datasets related to {topic}."},
                    {"title": "YouTube: Data Collection Techniques", "url": youtube_search_link("data collection techniques"), "snippet": "Learn about data collection methods."}
                ]
            },
            {
                "title": "Data Analysis",
                "description": f"Analyze the collected data using appropriate tools and techniques.",
                "resources": [
                    {"title": f"Google: Data analysis for {topic}", "url": google_search_link(f"data analysis for {topic}"), "snippet": f"Learn how to analyze data for {topic}."},
                    {"title": "YouTube: Data Analysis Tutorial", "url": youtube_search_link("data analysis tutorial"), "snippet": "Step-by-step video tutorials on data analysis."}
                ]
            },
            {
                "title": "Interpret Results & Draw Conclusions",
                "description": f"Interpret your findings and draw meaningful conclusions about {topic}.",
                "resources": [
                    {"title": "Google: How to interpret research results", "url": google_search_link("how to interpret research results"), "snippet": "Guides on interpreting research findings."},
                    {"title": "YouTube: Drawing Conclusions in Research", "url": youtube_search_link("drawing conclusions in research"), "snippet": "Videos on making sense of research results."}
                ]
            },
            {
                "title": "Write & Present Your Research",
                "description": f"Write your research paper or report and prepare to present your findings.",
                "resources": [
                    {"title": "Google: How to write a research paper", "url": google_search_link("how to write a research paper"), "snippet": "Guides and templates for writing research papers."},
                    {"title": "YouTube: How to Present Research", "url": youtube_search_link("how to present research"), "snippet": "Tips for presenting research effectively."}
                ]
            },
            {
                "title": "Publish or Share Your Work",
                "description": f"Submit your research to journals, conferences, or share it online.",
                "resources": [
                    {"title": "Google: Where to publish research", "url": google_search_link("where to publish research"), "snippet": "Find suitable journals and platforms for publishing."},
                    {"title": "YouTube: How to Publish a Research Paper", "url": youtube_search_link("how to publish a research paper"), "snippet": "Step-by-step video guides on publishing research."}
                ]
            }
        ]

        roadmap = {
            "title": f"AI Research Roadmap for {topic}",
            "description": f"A step-by-step workflow to guide you through conducting research on {topic}.",
            "timeline": "Flexible (typically 2-6 months)",
            "modules": [
                {
                    "title": step["title"],
                    "description": step["description"],
                    "weeks": "See resources",
                    "tasks": [
                        {
                            "title": step["title"],
                            "description": step["description"],
                            "type": "Learning",
                            "resources": step["resources"]
                        }
                    ]
                } for step in steps
            ]
        }

        return roadmap

    except Exception as e:
        logger.error(f"Error generating roadmap: {e}")
        return {"error": "Could not generate roadmap"}

if __name__ == "__main__":
    # Test the roadmap generator
    topic = input("Enter the topic for your learning roadmap: ")
    skill_level = input("Enter your skill level (beginner/intermediate/advanced): ").lower()
    
    result = generate_roadmap(topic, skill_level)
    if result["success"]:
        print("\nGenerated Roadmap:")
        roadmap = result["roadmap"]
        print(f"\nTopic: {roadmap['title']}")
        print(f"Skill Level: {skill_level}")
        print("\nModules:")
        for module in roadmap["modules"]:
            print(f"\n{module['title']}:")
            print(f"Description: {module['description']}")
            print("Resources:")
            for resource in module["tasks"][0]["resources"]:
                print(f"- {resource['title']}: {resource['snippet']}")
        print("\nRecommendations:")
        for rec in roadmap["recommendations"]:
            print(f"- {rec}")
    else:
        print(f"Error: {result.get('error', 'Unknown error occurred')}")