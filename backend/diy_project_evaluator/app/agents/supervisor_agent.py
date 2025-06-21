from app.utils.llm import ask_llm

def compile_report(relevance, completion, presentation, functionality):
    # Ensure we have valid scores
    if not all([relevance, completion, presentation, functionality]):
        return "Error: Missing evaluation scores. Please ensure all evaluations are complete."

    prompt = f"""You are a strict evaluator. Compile a final report using these scores:

Relevance: {relevance}
Completion: {completion}
Presentation: {presentation}
Functionality: {functionality}

STRICT RULES:
1. Output ONLY the evaluation in this exact format
2. NO text before or after the format
3. NO asterisks, bold text, or special characters
4. NO introductory phrases
5. NO additional sections
6. NO examples or notes
7. NO "Let me know" or similar phrases

REQUIRED FORMAT:
1. Relevance: [Score]/5 - [One sentence summary]
2. Completion: [Score]/5 - [One sentence summary]
3. Presentation: [Score]/5 - [One sentence summary]
4. Functionality: [Score]/5 - [One sentence summary]

Overall Score: [Average]/5

Key Improvements Needed:
1. [Most critical improvement needed]
2. [Second most important improvement]
3. [Third most important improvement]

Final Feedback: [4-5 sentences providing detailed analysis of strengths, weaknesses, and specific recommendations for improvement]"""
    return ask_llm(prompt)
