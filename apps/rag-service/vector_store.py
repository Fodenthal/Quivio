"""
Vector Store Module

Handles embedding generation and vector similarity search operations
using OpenAI embeddings and Supabase pgvector.
"""

import hashlib
import logging
import os
import time
from typing import Dict, List, Optional, Tuple

from openai import OpenAI
from supabase import Client, create_client

logger = logging.getLogger(__name__)


class VectorStore:
    """
    Manages vector embeddings and similarity search using Supabase + pgvector
    """

    def __init__(self) -> None:
        """Initialize the vector store with OpenAI and Supabase clients"""
        # Initialize OpenAI client for embeddings
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")

        self.openai_client = OpenAI(api_key=openai_api_key)

        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required",
            )

        # Create client with simple configuration
        self.supabase: Client = create_client(supabase_url, supabase_key)

        # Initialize embedding cache with TTL
        self._embedding_cache: Dict[str, Tuple[List[float], float]] = {}
        self._cache_ttl = 3600  # 1 hour TTL for embeddings
        self._cache_hits = 0
        self._cache_misses = 0

        logger.info("Vector store initialized successfully with embedding cache")

    def _get_cache_key(self, text: str) -> str:
        """Generate a cache key for the given text"""
        return hashlib.sha256(text.encode()).hexdigest()

    def _is_cache_valid(self, timestamp: float) -> bool:
        """Check if a cached item is still valid based on TTL"""
        return time.time() - timestamp < self._cache_ttl

    def _clean_expired_cache(self) -> None:
        """Remove expired entries from the cache"""
        current_time = time.time()
        expired_keys = [
            key for key, (_, timestamp) in self._embedding_cache.items()
            if current_time - timestamp >= self._cache_ttl
        ]
        for key in expired_keys:
            del self._embedding_cache[key]
        
        if expired_keys:
            logger.debug(f"Cleaned {len(expired_keys)} expired cache entries")

    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache performance statistics"""
        self._clean_expired_cache()
        total_requests = self._cache_hits + self._cache_misses
        hit_rate = (self._cache_hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "cache_hits": self._cache_hits,
            "cache_misses": self._cache_misses,
            "hit_rate_percent": round(hit_rate, 2),
            "cache_size": len(self._embedding_cache)
        }

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text using OpenAI's text-embedding-3-small model
        Uses caching to avoid repeated API calls for the same text

        Args:
            text: Text to embed

        Returns:
            List of floats representing the embedding vector
        """
        # Clean expired cache entries periodically
        if len(self._embedding_cache) > 100:  # Clean when cache gets large
            self._clean_expired_cache()

        # Generate cache key for the text
        cache_key = self._get_cache_key(text)
        current_time = time.time()

        # Check if we have a valid cached embedding
        if cache_key in self._embedding_cache:
            cached_embedding, timestamp = self._embedding_cache[cache_key]
            if self._is_cache_valid(timestamp):
                self._cache_hits += 1
                logger.debug(f"Cache HIT: Using cached embedding for text (length: {len(text)} chars)")
                return cached_embedding
            else:
                # Remove expired entry
                del self._embedding_cache[cache_key]

        # Cache miss - generate new embedding
        self._cache_misses += 1
        logger.debug(f"Cache MISS: Generating new embedding for text (length: {len(text)} chars)")
        
        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
                encoding_format="float",
            )

            embedding = response.data[0].embedding
            
            # Cache the new embedding
            self._embedding_cache[cache_key] = (embedding, current_time)
            
            logger.debug(f"Generated and cached embedding for text (length: {len(text)} chars)")
            return embedding

        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise

    def search_similar_chunks(
        self,
        query_text: str,
        similarity_threshold: float = 0.12,
        max_chunks: int = 5,
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
            response = self.supabase.rpc(
                "vector_search",
                {
                    "query_embedding": query_embedding,
                    "similarity_threshold": similarity_threshold,
                    "match_count": max_chunks,
                },
            ).execute()

            if response.data:
                logger.info(
                    f"Found {len(response.data)} similar chunks for query: {query_text[:50]}...",
                )
                return response.data
            logger.info(f"No similar chunks found for query: {query_text[:50]}...")
            return []

        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []

    def store_chunk(self, entity: str, content: str, section: Optional[str] = None) -> bool:
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
            response = (
                self.supabase.table("wiki_chunks")
                .insert(
                    {
                        "entity": entity,
                        "section": section,
                        "content": content,
                        "embedding": embedding,
                        "content_hash": content_hash,
                    },
                )
                .execute()
            )

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
            content = chunk["content"]
            similarity = chunk["similarity"]

            # Stop if adding this chunk would exceed max_length
            if total_length + len(content) > max_length:
                break

            context_parts.append(content)
            total_length += len(content)
            confidence_scores.append(similarity)

        # Calculate average confidence
        avg_confidence = (
            sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
        )

        # Join with double newlines for readability
        context = "\n\n".join(context_parts)

        return context, avg_confidence
