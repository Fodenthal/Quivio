#!/usr/bin/env python3
"""
Test script to debug get_context_for_topic method
"""

import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

from vector_store import VectorStore

def test_context_generation():
    """Test context generation directly"""
    logger.info("🧪 Testing context generation...")
    
    # Initialize vector store
    vector_store = VectorStore()
    
    # Test topics
    test_topics = [
        "Albert Einstein",
        "Einstein",
        "Theory of relativity"
    ]
    
    for topic in test_topics:
        logger.info(f"\n📝 Testing topic: '{topic}'")
        
        # Test get_context_for_topic directly
        context, confidence = vector_store.get_context_for_topic(topic, max_length=1000)
        
        logger.info(f"   📊 Confidence: {confidence:.3f}")
        logger.info(f"   📏 Context length: {len(context)} characters")
        
        if context:
            logger.info(f"   📄 Context preview: {context[:200]}...")
        else:
            logger.warning("   ❌ No context returned!")
            
        # Also test search_similar_chunks directly
        logger.info(f"   🔍 Direct search results:")
        chunks = vector_store.search_similar_chunks(topic, similarity_threshold=0.12, max_chunks=3)
        
        if chunks:
            logger.info(f"      ✅ Found {len(chunks)} chunks")
            for i, chunk in enumerate(chunks):
                similarity = chunk.get('similarity', 'N/A')
                content_preview = chunk.get('content', '')[:100] + "..."
                logger.info(f"         {i+1}. Similarity: {similarity:.3f} | Content: {content_preview}")
        else:
            logger.warning("      ❌ No chunks found in direct search")

if __name__ == "__main__":
    test_context_generation() 