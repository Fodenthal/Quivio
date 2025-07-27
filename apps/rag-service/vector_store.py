"""
Vector Store Module

Handles embedding generation and vector similarity search operations
using OpenAI embeddings and Supabase pgvector.
"""

import hashlib
import logging
import os
from typing import List, Dict, Optional, Tuple
import numpy as np
from openai import OpenAI
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class VectorStore:
    """
    Manages vector embeddings and similarity search using Supabase + pgvector
    """
    
    def __init__(self):
        """Initialize the vector store with OpenAI and Supabase clients"""
        # Initialize OpenAI client for embeddings
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.openai_client = OpenAI(api_key=openai_api_key)
        
        # Initialize Supabase client
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
        
        self.supabase: Client = create_client(supabase_url, supabase_key)
        
        logger.info("Vector store initialized successfully")
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text using OpenAI's text-embedding-3-small model
        
        Args:
            text: Text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
                encoding_format="float"
            )
            
            embedding = response.data[0].embedding
            logger.debug(f"Generated embedding for text (length: {len(text)} chars)")
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    def search_similar_chunks(
        self,
        query_text: str,
        similarity_threshold: float = 0.12,
        max_chunks: int = 5
    ) -> List[Dict]:
        """
        Search for similar content chunks using vector similarity
        
        Args:
            query_text: Text to search for
            similarity_threshold: Minimum similarity score (0-1)
            max_chunks: Maximum number of chunks to return
            
        Returns:
            List of dictionaries containing chunk data and similarity scores
        """
        try:
            # Generate embedding for the query
            query_embedding = self.generate_embedding(query_text)
            
            # Search using the vector_search function we created
            response = self.supabase.rpc('vector_search', {
                'query_embedding': query_embedding,
                'similarity_threshold': similarity_threshold,
                'match_count': max_chunks
            }).execute()
            
            if response.data:
                logger.info(f"Found {len(response.data)} similar chunks for query: {query_text[:50]}...")
                return response.data
            else:
                logger.info(f"No similar chunks found for query: {query_text[:50]}...")
                return []
                
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []
    
    def store_chunk(
        self,
        entity: str,
        content: str,
        section: Optional[str] = None
    ) -> bool:
        """
        Store a content chunk with its embedding in the vector database
        
        Args:
            entity: The entity/topic this content belongs to (e.g., article title)
            content: The actual text content
            section: Optional section within the entity
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Generate content hash for idempotent writes
            content_hash = hashlib.sha256(content.encode()).hexdigest()
            
            # Generate embedding
            embedding = self.generate_embedding(content)
            
            # Insert into database
            response = self.supabase.table('wiki_chunks').insert({
                'entity': entity,
                'section': section,
                'content': content,
                'embedding': embedding,
                'content_hash': content_hash
            }).execute()
            
            if not response.data:
                logger.warning(f"No data returned when storing chunk for {entity}")
                return False
                
            logger.info(f"Stored chunk for entity: {entity} (section: {section})")
            return True
            
        except Exception as e:
            # Check if it's a duplicate (content_hash conflict)
            if "duplicate key value violates unique constraint" in str(e):
                logger.debug(f"Chunk already exists for {entity} (duplicate content)")
                return True  # Not an error, just already exists
            
            logger.error(f"Failed to store chunk for {entity}: {e}")
            return False
    
    def get_context_for_topic(self, topic: str, max_length: int = 2000) -> Tuple[str, float]:
        """
        Get contextual information for a topic by searching similar chunks
        
        Args:
            topic: The topic to get context for
            max_length: Maximum length of returned context
            
        Returns:
            Tuple of (context_text, confidence_score)
        """
        # Search for similar chunks
        chunks = self.search_similar_chunks(topic, similarity_threshold=0.12, max_chunks=5)
        
        if not chunks:
            return "", 0.0
        
        # Join chunks into context, respecting max_length
        context_parts = []
        total_length = 0
        confidence_scores = []
        
        for chunk in chunks:
            content = chunk['content']
            similarity = chunk['similarity']
            
            # Stop if adding this chunk would exceed max_length
            if total_length + len(content) > max_length:
                break
                
            context_parts.append(content)
            total_length += len(content)
            confidence_scores.append(similarity)
        
        # Calculate average confidence
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
        
        # Join with double newlines for readability
        context = "\n\n".join(context_parts)
        
        return context, avg_confidence 