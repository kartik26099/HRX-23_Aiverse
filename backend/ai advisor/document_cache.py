import logging
import uuid
from typing import Dict, Any, List, Optional
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DocumentCache:
    """
    Cache for document storage and retrieval, with segmentation for large documents
    """
    
    def __init__(self, max_segment_size: int = 4000, expiration_hours: int = 24):
        """
        Initialize the document cache
        
        Args:
            max_segment_size: Maximum size of each document segment in characters
            expiration_hours: Hours after which documents expire from cache
        """
        self.documents = {}  # Document storage
        self.max_segment_size = max_segment_size
        self.expiration_seconds = expiration_hours * 3600
    
    def add_document(self, file_name: str, content: str, document_type: str) -> str:
        """
        Add a document to the cache, segmenting if necessary
        
        Args:
            file_name: Original file name
            content: Full text content of the document
            document_type: Type of document (resume, transcript, etc.)
            
        Returns:
            Document ID for future reference
        """
        try:
            # Generate unique document ID
            doc_id = str(uuid.uuid4())
            
            # Split content into segments
            segments = self._segment_content(content)
            segment_count = len(segments)
            
            # Store document metadata
            self.documents[doc_id] = {
                "metadata": {
                    "file_name": file_name,
                    "document_type": document_type,
                    "created_at": time.time(),
                    "segment_count": segment_count,
                    "total_length": len(content)
                },
                "segments": segments
            }
            
            logger.info(f"Added document to cache: {file_name} (ID: {doc_id}, {segment_count} segments)")
            return doc_id
            
        except Exception as e:
            logger.error(f"Error adding document to cache: {str(e)}")
            raise
    
    def get_document_metadata(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Get document metadata
        
        Args:
            doc_id: Document ID
            
        Returns:
            Document metadata or None if not found
        """
        if doc_id not in self.documents:
            return None
            
        # Check if document has expired
        if self._is_expired(doc_id):
            self._remove_expired_document(doc_id)
            return None
            
        return self.documents[doc_id]["metadata"]
    
    def get_document_segment(self, doc_id: str, segment_index: int) -> Optional[str]:
        """
        Get a specific document segment
        
        Args:
            doc_id: Document ID
            segment_index: Index of the segment to retrieve
            
        Returns:
            Segment content or None if not found
        """
        if doc_id not in self.documents:
            return None
            
        # Check if document has expired
        if self._is_expired(doc_id):
            self._remove_expired_document(doc_id)
            return None
            
        segments = self.documents[doc_id]["segments"]
        if 0 <= segment_index < len(segments):
            return segments[segment_index]
        
        return None
    
    def get_document_summary(self, doc_id: str, max_segments: int = 2) -> str:
        """
        Get a summary of the document (first few segments)
        
        Args:
            doc_id: Document ID
            max_segments: Maximum number of segments to include in summary
            
        Returns:
            Summary content or empty string if not found
        """
        if doc_id not in self.documents:
            return ""
            
        # Check if document has expired
        if self._is_expired(doc_id):
            self._remove_expired_document(doc_id)
            return ""
            
        segments = self.documents[doc_id]["segments"]
        metadata = self.documents[doc_id]["metadata"]
        
        # Get the first few segments
        summary_segments = segments[:min(max_segments, len(segments))]
        
        # Add truncation notice if needed
        summary = "\n\n".join(summary_segments)
        if len(segments) > max_segments:
            doc_type = metadata.get("document_type", "document")
            summary += f"\n\n[This is a summary of the {doc_type}. The full document has {len(segments)} sections.]"
        
        return summary
    
    def clear_expired_documents(self) -> int:
        """
        Clear all expired documents from cache
        
        Returns:
            Number of documents removed
        """
        docs_to_remove = []
        
        # Find expired documents
        for doc_id in self.documents:
            if self._is_expired(doc_id):
                docs_to_remove.append(doc_id)
        
        # Remove them
        for doc_id in docs_to_remove:
            self._remove_expired_document(doc_id)
        
        if docs_to_remove:
            logger.info(f"Cleared {len(docs_to_remove)} expired documents from cache")
            
        return len(docs_to_remove)
    
    def _segment_content(self, content: str) -> List[str]:
        """
        Split content into manageable segments
        
        Args:
            content: Full text content
            
        Returns:
            List of content segments
        """
        if not content:
            return [""]
            
        # If content is small enough, return as a single segment
        if len(content) <= self.max_segment_size:
            return [content]
        
        segments = []
        
        # Split by paragraphs first
        paragraphs = content.split("\n\n")
        current_segment = ""
        
        for para in paragraphs:
            # If adding this paragraph would exceed segment size, 
            # start a new segment
            if len(current_segment) + len(para) + 2 > self.max_segment_size:
                if current_segment:
                    segments.append(current_segment)
                
                # If paragraph itself is too large, split it further
                if len(para) > self.max_segment_size:
                    # Split paragraph into smaller chunks
                    para_segments = self._split_large_paragraph(para)
                    segments.extend(para_segments[:-1])  # Add all but the last segment
                    current_segment = para_segments[-1]  # Start new segment with the last chunk
                else:
                    current_segment = para
            else:
                # Add to current segment with paragraph separator if needed
                if current_segment:
                    current_segment += "\n\n" + para
                else:
                    current_segment = para
        
        # Add the last segment if it has content
        if current_segment:
            segments.append(current_segment)
        
        return segments
    
    def _split_large_paragraph(self, paragraph: str) -> List[str]:
        """
        Split a large paragraph into smaller segments
        
        Args:
            paragraph: Large paragraph text
            
        Returns:
            List of smaller paragraph segments
        """
        segments = []
        current_segment = ""
        
        # Split by sentences (approximation)
        sentences = paragraph.replace(". ", ".|").replace("! ", "!|").replace("? ", "?|").split("|")
        
        for sentence in sentences:
            if len(current_segment) + len(sentence) + 1 > self.max_segment_size:
                segments.append(current_segment)
                
                # If sentence itself is too large, split by words
                if len(sentence) > self.max_segment_size:
                    words = sentence.split(" ")
                    sentence_segment = ""
                    
                    for word in words:
                        if len(sentence_segment) + len(word) + 1 > self.max_segment_size:
                            segments.append(sentence_segment)
                            sentence_segment = word
                        else:
                            if sentence_segment:
                                sentence_segment += " " + word
                            else:
                                sentence_segment = word
                    
                    current_segment = sentence_segment
                else:
                    current_segment = sentence
            else:
                if current_segment:
                    current_segment += " " + sentence
                else:
                    current_segment = sentence
        
        # Add the last segment if it has content
        if current_segment:
            segments.append(current_segment)
        
        return segments
    
    def _is_expired(self, doc_id: str) -> bool:
        """
        Check if a document has expired
        
        Args:
            doc_id: Document ID
            
        Returns:
            True if document has expired
        """
        if doc_id not in self.documents:
            return True
            
        created_at = self.documents[doc_id]["metadata"].get("created_at", 0)
        return (time.time() - created_at) > self.expiration_seconds
    
    def _remove_expired_document(self, doc_id: str) -> None:
        """
        Remove an expired document from cache
        
        Args:
            doc_id: Document ID
        """
        if doc_id in self.documents:
            file_name = self.documents[doc_id]["metadata"].get("file_name", "Unknown")
            logger.info(f"Removing expired document from cache: {file_name} (ID: {doc_id})")
            del self.documents[doc_id]

# Create a singleton instance
document_cache = DocumentCache()