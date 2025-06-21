from app.utils.llm import ask_llm

def evaluate(context):
    prompt = f"""Evaluate the completeness of this project:

{context}

Provide your evaluation in this EXACT format:
Score: [X]/5
Explanation: [2-3 sentences about how complete the project is, including any missing features]"""
    return ask_llm(prompt)
