from app.utils.image_caption import get_image_caption
from app.utils.llm import ask_llm

def evaluate(context):
    prompt = f"""Evaluate the presentation quality of this project:

{context}

Provide your evaluation in this EXACT format:
Score: [X]/5
Explanation: [2-3 sentences about the quality of documentation, UI, and overall presentation]"""
    return ask_llm(prompt)
