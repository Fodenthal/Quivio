#!/usr/bin/env python3
"""
Test script to verify embedding cache functionality
"""

import time
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

from vector_store import VectorStore

def test_embedding_cache():
    """Test embedding cache functionality"""
    logger.info("🧪 Testing embedding cache functionality...")
    
    # Initialize vector store
    vector_store = VectorStore()
    
    # Test text for embedding
    test_text = "Albert Einstein was a German-born theoretical physicist"
    
    logger.info(f"📝 Testing with text: '{test_text}'")
    
    # First call - should be a cache miss
    logger.info("🔄 First call (should be cache MISS)...")
    start_time = time.time()
    embedding1 = vector_store.generate_embedding(test_text)
    time1 = (time.time() - start_time) * 1000
    logger.info(f"   ⏱️  Time: {time1:.2f}ms")
    
    # Second call - should be a cache hit
    logger.info("🔄 Second call (should be cache HIT)...")
    start_time = time.time()
    embedding2 = vector_store.generate_embedding(test_text)
    time2 = (time.time() - start_time) * 1000
    logger.info(f"   ⏱️  Time: {time2:.2f}ms")
    
    # Verify embeddings are identical
    if embedding1 == embedding2:
        logger.info("✅ Embeddings are identical (cache working correctly)")
    else:
        logger.error("❌ Embeddings are different (cache not working)")
    
    # Check cache statistics
    stats = vector_store.get_cache_stats()
    logger.info("📊 Cache Statistics:")
    logger.info(f"   Cache hits: {stats['cache_hits']}")
    logger.info(f"   Cache misses: {stats['cache_misses']}")
    logger.info(f"   Hit rate: {stats['hit_rate_percent']}%")
    logger.info(f"   Cache size: {stats['cache_size']}")
    
    # Performance improvement
    if time1 > 0 and time2 > 0:
        improvement = ((time1 - time2) / time1) * 100
        logger.info(f"🚀 Performance improvement: {improvement:.1f}% faster on cache hit")
    
    # Test with different text
    different_text = "Marie Curie was a Polish-born physicist and chemist"
    logger.info(f"📝 Testing with different text: '{different_text}'")
    
    start_time = time.time()
    embedding3 = vector_store.generate_embedding(different_text)
    time3 = (time.time() - start_time) * 1000
    logger.info(f"   ⏱️  Time: {time3:.2f}ms (should be cache MISS)")
    
    # Final statistics
    final_stats = vector_store.get_cache_stats()
    logger.info("📊 Final Cache Statistics:")
    logger.info(f"   Cache hits: {final_stats['cache_hits']}")
    logger.info(f"   Cache misses: {final_stats['cache_misses']}")
    logger.info(f"   Hit rate: {final_stats['hit_rate_percent']}%")
    logger.info(f"   Cache size: {final_stats['cache_size']}")

if __name__ == "__main__":
    test_embedding_cache() 