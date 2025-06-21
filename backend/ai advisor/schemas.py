from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatMessage(BaseModel):
    """
    Message in a chat conversation
    """
    role: str  # 'system', 'user', or 'assistant'
    content: str

class DocumentMetadata(BaseModel):
    """
    Metadata for a document
    """
    file_name: str
    document_type: str
    created_at: float
    segment_count: int
    total_length: int

class DocumentInfo(BaseModel):
    """
    Information about a cached document
    """
    doc_id: str
    metadata: DocumentMetadata

class DocumentSegmentRequest(BaseModel):
    """
    Request for document segments
    """
    doc_id: str
    segment_indices: Optional[List[int]] = None

class DocumentAnalysisResult(BaseModel):
    """
    Result of document analysis
    """
    document_type: str
    file_name: str
    doc_id: str
    content_length: int
    analysis: str
    error: Optional[str] = None

class ChatRequest(BaseModel):
    """
    Request for chat response
    """
    message: str
    history: Optional[List[Dict[str, str]]] = None
    session_id: Optional[str] = None
    doc_id: Optional[str] = None