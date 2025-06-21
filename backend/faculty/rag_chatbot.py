from typing import List, Dict, Optional
from pydantic import BaseModel
from document_processor import generate_embedding, cosine_similarity
from db_setup import SessionLocal, Document, DocumentChunk
import os
from dotenv import load_dotenv
import random
from sentence_transformers import CrossEncoder
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Load environment variables
load_dotenv()

# Groq setup
from groq import Groq
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Initialize reranker
reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatResponse(BaseModel):
    response: str
    sources: List[Dict[str, str]]

def analyze_sentiment(text: str) -> float:
    """Simple sentiment analysis to adapt response tone."""
    # This is a simplified version - consider using a proper sentiment analysis library
    positive_words = ["great", "good", "excellent", "happy", "thanks", "appreciate", "helpful"]
    negative_words = ["bad", "wrong", "terrible", "confused", "frustrating", "useless", "not working"]
    
    text_lower = text.lower()
    positive_score = sum(1 for word in positive_words if word in text_lower)
    negative_score = sum(1 for word in negative_words if word in text_lower)
    
    # Return a score between -1 and 1
    return (positive_score - negative_score) / (positive_score + negative_score + 1)

def get_relevant_chunks(query: str, limit: int = 10, final_limit: int = 5, similarity_threshold: float = 0.6) -> List[Dict[str, str]]:
    """Get relevant document chunks with reranking for improved relevance."""
    # Generate embedding for the query
    query_embedding = generate_embedding(query)
    
    db = SessionLocal()
    try:
        # Get all documents and chunks
        documents = db.query(Document).all()
        all_chunks = []
        
        for doc in documents:
            chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).all()
            for chunk in chunks:
                all_chunks.append({
                    "document_id": doc.id,
                    "document_title": doc.title,
                    "content": chunk.content,
                    "embedding": generate_embedding(chunk.content)
                })
        
        # Calculate similarities
        results = []
        for chunk in all_chunks:
            similarity = cosine_similarity(query_embedding, chunk["embedding"])
            if similarity >= similarity_threshold:
                results.append({
                    "content": chunk["content"],
                    "document_title": chunk["document_title"],
                    "document_id": chunk["document_id"],
                    "similarity": similarity
                })
        
        # Sort by similarity and get top initial results
        results.sort(key=lambda x: x["similarity"], reverse=True)
        initial_results = results[:limit]
        
        # Rerank with cross-encoder if we have results
        if initial_results:
            # Prepare pairs for reranking
            pairs = [(query, chunk["content"]) for chunk in initial_results]
            
            # Get reranking scores
            scores = reranker.predict(pairs)
            
            # Add scores to results
            for i, score in enumerate(scores):
                initial_results[i]["rerank_score"] = float(score)
            
            # Sort by reranking score
            reranked_results = sorted(initial_results, key=lambda x: x["rerank_score"], reverse=True)
            return reranked_results[:final_limit]
        
        return initial_results[:final_limit]
    finally:
        db.close()

async def process_chunk_async(chunk: Dict, query: str, system_message: str) -> Dict:
    """Process a single chunk asynchronously for hierarchical summarization."""
    chunk_content = chunk["content"]
    chunk_prompt = f"""
    Based on the following context and question, provide a concise answer:
    
    Context: {chunk_content}
    
    Question: {query}
    """
    
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": chunk_prompt}
    ]
    
    # Generate response for this chunk
    chat_completion = groq_client.chat.completions.create(
        messages=messages,
        model="llama-3.3-70b-versatile",
    )
    
    chunk_response = chat_completion.choices[0].message.content
    return {
        "chunk_response": chunk_response,
        "document_title": chunk["document_title"],
        "document_id": chunk["document_id"]
    }

async def hierarchical_summarization(query: str, chunks: List[Dict], system_message: str) -> Dict:
    """Process chunks in parallel and then combine the results."""
    # Process all chunks in parallel
    tasks = [process_chunk_async(chunk, query, system_message) for chunk in chunks]
    chunk_results = await asyncio.gather(*tasks)
    
    # Combine the chunk responses
    combined_context = "\n\n".join([result["chunk_response"] for result in chunk_results])
    
    # Final synthesis prompt
    synthesis_prompt = f"""
    Synthesize a comprehensive answer to the question based on these individual answers:
    
    Individual Answers:
    {combined_context}
    
    Question: {query}
    
    Provide a unified, coherent response that integrates all relevant information.
    """
    
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": synthesis_prompt}
    ]
    
    # Generate final synthesized response
    chat_completion = groq_client.chat.completions.create(
        messages=messages,
        model="llama-3.3-70b-versatile",
    )
    
    final_response = chat_completion.choices[0].message.content
    
    # Return the final response and sources
    sources = [{"document_title": result["document_title"], "document_id": result["document_id"]} 
               for result in chunk_results]
    
    return {"response": final_response, "sources": sources}

def generate_improved_query(original_query: str, conversation_history: List[ChatMessage]) -> str:
    """Generate an improved query based on the original query and conversation history."""
    # Extract recent conversation context
    recent_context = "\n".join([f"{msg.role}: {msg.content}" 
                               for msg in conversation_history[-3:] if conversation_history])
    
    system_message = """You are an expert at understanding user intent. 
    Your task is to rewrite the user's query to make it more specific and searchable."""
    
    prompt = f"""
    Based on this conversation history:
    {recent_context}
    
    Rewrite this query to make it more specific and searchable: "{original_query}"
    
    Return only the rewritten query without explanation or additional text.
    """
    
    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": prompt}
    ]
    
    # Generate improved query
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
        )
        
        improved_query = chat_completion.choices[0].message.content.strip()
        # Remove quotes if present
        improved_query = improved_query.strip('"\'')
        return improved_query
    except Exception as e:
        print(f"Error generating improved query: {str(e)}")
        return original_query

def add_human_touch(response: str) -> str:
    """Add human-like touches to the response."""
    # List of cognitive pauses and filler phrases
    cognitive_pauses = [
        "Let me think about this... ", 
        "Hmm, that's an interesting question. ", 
        "Let's see... ", 
        "Based on what I know, "
    ]
    
    # List of conclusion phrases
    conclusion_phrases = [
        "Hope that helps!",
        "Does that answer your question?",
        "Let me know if you need any clarification.",
        "Is there anything else you'd like to know about this?"
    ]
    
    # Randomly decide whether to add a cognitive pause at the beginning
    if random.random() < 0.7:  # 70% chance
        response = random.choice(cognitive_pauses) + response
    
    # Randomly decide whether to add a conclusion phrase
    if random.random() < 0.5:  # 50% chance
        response = response + " " + random.choice(conclusion_phrases)
    
    return response

async def chat_with_documents(message: str, conversation_history: List[ChatMessage] = None) -> ChatResponse:
    """Chat with documents using RAG approach."""
    if conversation_history is None:
        conversation_history = []
    # Analyze sentiment to adapt response tone
    sentiment = analyze_sentiment(message)
    
    # Generate improved query based on conversation history
    improved_query = generate_improved_query(message, conversation_history)
    print(f"Original query: {message}")
    print(f"Improved query: {improved_query}")
    
    # Get relevant chunks using the improved query
    relevant_chunks = get_relevant_chunks(improved_query)
    
    # Prepare system message with tone adaptation based on sentiment
    system_message = """You are a helpful, conversational assistant that answers questions based on the provided document context.
    Use natural language with occasional pauses and varied sentence structures.
    If the context doesn't contain relevant information, express uncertainty naturally.
    Be conversational yet precise, responding as a knowledgeable human would.
    answer like a friendly college professor would answer if it was asked a doubt
    """
    
    # Adjust tone based on sentiment
    if sentiment < -0.3:
        system_message += "\nThe user seems concerned or frustrated. Respond with empathy and reassurance."
    elif sentiment > 0.5:
        system_message += "\nThe user seems enthusiastic. Match their positive energy in your response."
    
    # Use hierarchical summarization for processing chunks
    try:
        result = await hierarchical_summarization(message, relevant_chunks, system_message)
        
        # Add human-like touches to the response
        enhanced_response = add_human_touch(result["response"])
        
        return ChatResponse(response=enhanced_response, sources=result["sources"])
    except Exception as e:
        # Fallback to traditional approach if async processing fails
        print(f"Error in hierarchical summarization: {str(e)}")
        
        # Prepare context from chunks
        context = "\n\n".join([chunk["content"] for chunk in relevant_chunks])
        
        # Prepare prompt with context and chain-of-thought guidance
        prompt = f"""
        Answer the following question based on this context:
        
        Context: {context}
        
        Question: {message}
        
        Think through your response step by step
        """
        
        # Prepare conversation history for the API
        messages = [{"role": "system", "content": system_message}]
        
        # Add conversation history (limited to last 5 messages)
        for msg in conversation_history[-5:]:
            messages.append({"role": msg.role, "content": msg.content})
        
        # Add the current prompt
        messages.append({"role": "user", "content": prompt})
        
        # Generate response using Groq LLM
        chat_completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
        )
        
        response = chat_completion.choices[0].message.content
        
        # Add human-like touches
        enhanced_response = add_human_touch(response)
        
        # Prepare sources information
        sources = []
        for chunk in relevant_chunks:
            sources.append({
                "document_title": chunk["document_title"],
                "document_id": str(chunk["document_id"])
            })
        
        return ChatResponse(response=enhanced_response, sources=sources)