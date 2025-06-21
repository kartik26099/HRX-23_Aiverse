from app.utils.llm import ask_llm

def evaluate(context):
    prompt = f"""Evaluate the functionality of this project:

{context}

Provide your evaluation in this EXACT format:
Score: [X]/5
Explanation: [2-3 sentences about how well the core features work and their reliability]"""
    return ask_llm(prompt)
