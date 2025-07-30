#!/usr/bin/env python3
"""
Debug script to test vector search directly
"""

import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

from vector_store import VectorStore

def debug_einstein_search():
    """Debug Einstein search specifically"""
    logger.info("🔍 Debugging Einstein search...")
    
    # Initialize vector store
    vector_store = VectorStore()
    
    # Test different queries
    test_queries = [
        "Albert Einstein",
        "Einstein",
        "Albert",
        "Physics",
        "Theory of relativity"
    ]
    
    for query in test_queries:
        logger.info(f"\n📝 Testing query: '{query}'")
        
        # Test with different similarity thresholds
        for threshold in [0.05, 0.08, 0.12, 0.15, 0.20]:
            logger.info(f"   🔍 Threshold {threshold}:")
            try:
                chunks = vector_store.search_similar_chunks(
                    query_text=query,
                    similarity_threshold=threshold,
                    max_chunks=5
                )
                
                if chunks:
                    logger.info(f"      ✅ Found {len(chunks)} chunks")
                    for i, chunk in enumerate(chunks[:2]):  # Show first 2
                        similarity = chunk.get('similarity', 'N/A')
                        content_preview = chunk.get('content', '')[:100] + "..."
                        logger.info(f"         {i+1}. Similarity: {similarity:.3f} | Content: {content_preview}")
                else:
                    logger.info(f"      ❌ No chunks found")
                    
            except Exception as e:
                logger.error(f"      💥 Error: {e}")

def check_database_content():
    """Check what's actually in the database"""
    logger.info("\n🗄️ Checking database content...")
    
    vector_store = VectorStore()
    
    try:
        # Try to get some sample data from the database
        response = vector_store.supabase.table("wiki_chunks").select("entity, content").limit(5).execute()
        
        if response.data:
            logger.info(f"✅ Found {len(response.data)} sample chunks in database:")
            for i, chunk in enumerate(response.data):
                entity = chunk.get('entity', 'Unknown')
                content_preview = chunk.get('content', '')[:100] + "..."
                logger.info(f"   {i+1}. Entity: {entity} | Content: {content_preview}")
        else:
            logger.warning("⚠️ No chunks found in database")
            
    except Exception as e:
        logger.error(f"💥 Database query error: {e}")

if __name__ == "__main__":
    debug_einstein_search()
    check_database_content() 