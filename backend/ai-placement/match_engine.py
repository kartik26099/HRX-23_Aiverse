import asyncio
import re
import numpy as np
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from sentence_transformers import SentenceTransformer, util
import spacy
from aiohttp import ClientSession
from functools import lru_cache
import logging
import time
import redis
import hashlib
from typing import Optional

# Set up logging for debugging and profiling
logging.basicConfig(filename="matcher.log", level=logging.WARNING)
profiler = logging.getLogger("profiler")
profiler.setLevel(logging.INFO)
fh = logging.FileHandler("profiler.log")
profiler.addHandler(fh)

# Initialize Redis (optional)
try:
    redis_client = redis.Redis(host="localhost", port=6379, decode_responses=False)
    redis_client.ping()
except redis.ConnectionError:
    redis_client = None
    logging.warning("Redis unavailable; caching disabled")

# Initialize NLP tools (optimized SpaCy pipeline)
nlp = spacy.load("en_core_web_sm", disable=["parser", "lemmatizer"])
embedder = SentenceTransformer("all-MiniLM-L6-v2")

# Initialize Groq LLM (async client)
llm = ChatGroq(
    api_key="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",
    model_name="llama3-8b-8192"
)

# Skill normalization dictionary
SKILL_NORMALIZATION = {
    "ml": "Machine Learning",
    "ai": "Artificial Intelligence",
    "js": "JavaScript",
    "sql": "SQL",
    "aws": "AWS"
}

# Refined prompt for LLM scoring
section_prompt_template = PromptTemplate.from_template("""
You are a recruitment expert scoring similarity between a CV section and a JD section.

Return a score from 0 to 100:
- 100: Perfect match (e.g., identical skills or experience).
- 50: Partial match (e.g., related skills or experience).
- 0: No relevance.

**Rules:**
- Consider synonyms (e.g., "ML" and "Machine Learning" are equivalent).
- Exact matches for skills or degrees score higher.
- Ignore filler words (e.g., "proficient in").

**Examples:**
1. CV: "Python, Java, SQL"
   JD: "Python, JavaScript"
   Score: 80

2. CV: "Marketing and sales"
   JD: "Software engineering"
   Score: 5

3. CV: "BS in Computer Science"
   JD: "Bachelor's in related field"
   Score: 95

CV: {cv_section}
JD: {jd_section}

Return only the score (number). No text.
""")

def profile(func):
    """Decorator to log execution time."""
    async def async_wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)
        profiler.info(f"{func.__name__} took {time.time() - start:.4f} seconds")
        return result
    def sync_wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        profiler.info(f"{func.__name__} took {time.time() - start:.4f} seconds")
        return result
    return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

@lru_cache(maxsize=1000)
@profile
def clean_text(text: str, is_education: bool = False) -> str:
    if isinstance(text, (list, tuple)):
        text = ", ".join(str(t) for t in text if t).strip()
    text = str(text).lower().strip()
    if not text:
        return ""
    doc = nlp(text)
    tokens = []
    for token in doc:
        if token.is_stop and not is_education:  # Keep stop words for education
            continue
        if token.is_punct:
            continue
        token_text = SKILL_NORMALIZATION.get(token.text, token.text)
        tokens.append(token_text)
    if is_education:
        return " ".join(tokens)  # Skip entity extraction
    entities = [ent.text.lower() for ent in doc.ents if ent.label_ in ["ORG", "PRODUCT", "DATE"]]
    return " ".join(tokens + entities)

@profile
def batch_compute_embeddings(texts: list[str]) -> np.ndarray:
    """Compute embeddings in batch with Redis caching."""
    valid_texts = [t for t in texts if t]
    if not valid_texts:
        return np.zeros((len(texts), embedder.get_sentence_embedding_dimension()))
    
    embeddings = []
    texts_to_compute = []
    text_indices = []
    
    # Check Redis cache
    for i, text in enumerate(texts):
        if not text:
            embeddings.append(np.zeros(embedder.get_sentence_embedding_dimension()))
            continue
        key = f"embed:{hashlib.md5(text.encode()).hexdigest()}"
        if redis_client and redis_client.exists(key):
            emb = np.frombuffer(redis_client.get(key))
            embeddings.append(emb)
        else:
            texts_to_compute.append(text)
            text_indices.append(i)
            embeddings.append(None)
    
    # Compute missing embeddings
    if texts_to_compute:
        new_embeddings = embedder.encode(texts_to_compute, convert_to_tensor=True, show_progress_bar=False).cpu().numpy()
        for i, (text, emb) in enumerate(zip(texts_to_compute, new_embeddings)):
            embeddings[text_indices[i]] = emb
            if redis_client:
                key = f"embed:{hashlib.md5(text.encode()).hexdigest()}"
                redis_client.setex(key, 86400, emb.tobytes())  # Cache for 24 hours
    
    return np.array(embeddings)

@profile
async def compute_llm_score(cv_text: str, jd_text: str, session: ClientSession, retries: int = 2) -> float:
    if not cv_text or not jd_text:
        return 5.0
    prompt = section_prompt_template.format(cv_section=cv_text, jd_section=jd_text)
    for attempt in range(retries):
        try:
            async with session.post(
                "https://api.groq.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {llm.api_key}"},
                json={"model": llm.model_name, "messages": [{"role": "user", "content": prompt}]}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    content = data["choices"][0]["message"]["content"]
                    logging.info(f"LLM output for {cv_text[:50]} vs {jd_text[:50]}: {content}")
                    match = re.search(r'\b(?:100(?:\.0+)?|[1-9]?\d(?:\.\d+)?)\b', content)
                    return float(match.group()) if match else 5.0
                logging.warning(f"LLM request failed: Status {response.status}")
        except Exception as e:
            logging.warning(f"LLM attempt {attempt + 1} failed: {e}")
            if attempt == retries - 1:
                return 5.0
        await asyncio.sleep(0.5)
    return 5.0

def rule_based_boost(cv_text: str, jd_text: str, base_score: float) -> float:
    cv_tokens = set(cv_text.split())
    jd_tokens = set(jd_text.split())
    common = cv_tokens.intersection(jd_tokens)
    boost = min(20, len(common) * 10)  # Cap at 20 points for exact matches
    related_pairs = {("java", "javascript"), ("sql", "database")}  # Add more pairs
    for cv_t, jd_t in related_pairs:
        if cv_t in cv_tokens and jd_t in jd_tokens:
            boost += 5  # 5 points for related terms
    return min(100, base_score + min(boost, 30))  # Total boost capped at 30

@profile
async def score_section(key: str, cv_text: str, jd_text: str, weights: dict, use_llm: bool, session: ClientSession, ambiguous_range: tuple = (20, 70)) -> dict:
    cv_clean = clean_text(cv_text)
    jd_clean = clean_text(jd_text)
    if not cv_clean or not jd_clean:
        score = 5.0
    else:
        embeddings = await asyncio.to_thread(batch_compute_embeddings, [cv_clean, jd_clean])
        score = round(max(0, min(100, util.cos_sim(embeddings[0], embeddings[1]).item() * 100)), 2)
    if use_llm and ambiguous_range[0] <= score <= ambiguous_range[1]:
        llm_score = await compute_llm_score(cv_clean, jd_clean, session)
        score = max(score, llm_score)
    score = rule_based_boost(cv_clean, jd_clean, score)
    weighted_score = round((score * weights.get(key, 1.0)) / 100, 2)
    return {f"{key}_score": score, f"{key}_weighted": weighted_score}
async def matcher_agent(parsed_cv: dict, summarized_jd: dict, weights: dict = None, use_llm: bool = False, ambiguous_range: tuple = (40, 60)) -> dict:
    """Optimized matcher agent with Redis caching and dynamic LLM usage."""
    if weights is None:
        weights = {"skills": 40, "experience": 30, "education": 15, "certifications": 10, "projects": 5}
    
    # Normalize weights
    total_weight = sum(weights.values())
    weights = {k: (v / total_weight) * 100 for k, v in weights.items()}
    
    jd_sections = summarized_jd.get("text", {})
    tasks = []
    
    # Pre-clean texts
    texts_to_embed = []
    sections = []
    async with ClientSession() as session:
        for key in weights:
            cv_raw = parsed_cv.get(key, "")
            jd_raw = jd_sections.get(key, "")
            
            # Convert lists to strings before cleaning
            if isinstance(cv_raw, (list, tuple)):
                cv_raw = ", ".join(str(t) for t in cv_raw if t).strip()
            if isinstance(jd_raw, (list, tuple)):
                jd_raw = ", ".join(str(t) for t in jd_raw if t).strip()
                
            cv_clean = clean_text(cv_raw)
            jd_clean = clean_text(jd_raw)
            sections.append((key, cv_clean, jd_clean))
            if not use_llm or (use_llm and ambiguous_range):  # Embeddings needed
                texts_to_embed.extend([cv_clean, jd_clean])
        
        # Batch compute embeddings
        if texts_to_embed:
            embeddings = await asyncio.to_thread(batch_compute_embeddings, texts_to_embed)
            embed_idx = 0
        
        # Score sections
        for key, cv_clean, jd_clean in sections:
            if not cv_clean or not jd_clean:
                score = 5.0
                weighted_score = round((score * weights.get(key, 1.0)) / 100, 2)
                result = {f"{key}_score": score, f"{key}_weighted": weighted_score}
            else:
                tasks.append(score_section(key, cv_clean, jd_clean, weights, use_llm, session, ambiguous_range))
                embed_idx += 2
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Aggregate scores
    scores = {}
    for result in results:
        if isinstance(result, dict):
            scores.update(result)
    
    final_score = sum(scores.get(f"{k}_weighted", 0) for k in weights)
    scores["final_match_score"] = round(final_score, 2)
    scores["explanation"] = (
        f"Final score is a weighted average of semantic similarity across sections, "
        f"using sentence embeddings with rule-based boosts and "
        f"{'dynamic LLM for ambiguous scores' if use_llm else 'no LLM'}."
    )
    
    return scores

def load_fine_tuned_model(model_path: Optional[str] = None) -> SentenceTransformer:
    """Load a fine-tuned SentenceTransformer model (placeholder)."""
    if model_path:
        try:
            return SentenceTransformer(model_path)
        except Exception as e:
            logging.warning(f"Failed to load fine-tuned model: {e}")
    return SentenceTransformer("multi-qa-MiniLM-L6-cos-v1")

if __name__ == "__main__":
    # Example usage
    parsed_cv = {
    "skills": ["Python", "Java", "SQL", "REST APIs"],
    "experience": "Developed scalable backend systems using Python and Java, including REST APIs and database integration with SQL.",
    "education": "Bachelor of Science in Computer Science, graduated 2020"
    }
    summarized_jd = {
        "text": {
            "skills": ["Python", "JavaScript", "REST APIs"],
            "experience": "Build scalable backend systems with Python or JavaScript, including REST APIs and cloud deployment.",
            "education": "Bachelor's degree in Computer Science or related field"
        }
    }
    weights = {"skills": 40, "experience": 30, "education": 30}
    
    result = asyncio.run(matcher_agent(parsed_cv, summarized_jd, weights, use_llm=True))
    print(result)