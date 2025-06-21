from app.utils.llm import ask_llm

def evaluate(context):
    prompt = f"""Evaluate the relevance of this project to its stated goals:

{context}

Provide your evaluation in this EXACT format:
Score: [X]/5
Explanation: [2-3 sentences about how well the project aligns with its goals]"""
    return ask_llm(prompt)
