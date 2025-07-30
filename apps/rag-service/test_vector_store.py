import time
import logging
from dotenv import load_dotenv
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Ensure the correct path to vector_store
try:
    from vector_store import VectorStore
    logger.info("Successfully imported VectorStore.")
except ImportError as e:
    logger.error(f"Failed to import VectorStore: {e}")
    exit(1)

def benchmark_vector_store():
    """
    Initializes the VectorStore and benchmarks the context retrieval.
    """
    logger.info("Starting VectorStore benchmark...")

    # 1. Benchmark VectorStore Initialization
    logger.info("Initializing VectorStore...")
    init_start_time = time.time()
    try:
        vector_store_instance = VectorStore()
        init_end_time = time.time()
        init_duration = (init_end_time - init_start_time) * 1000
        logger.info(f"VectorStore initialized in: {init_duration:.2f} ms")
    except Exception as e:
        logger.error(f"Failed to initialize VectorStore: {e}")
        return

    # 2. Benchmark Context Retrieval
    topic = "Albert Einstein"
    logger.info(f"Getting context for topic: '{topic}'")
    search_start_time = time.time()
    try:
        context, confidence = vector_store_instance.get_context_for_topic(topic)
        search_end_time = time.time()
        search_duration = (search_end_time - search_start_time) * 1000
        logger.info(f"Context retrieval finished in: {search_duration:.2f} ms")

        # 3. Print Results
        logger.info(f"Confidence score: {confidence}")
        if context:
            logger.info(f"Retrieved context (first 100 chars): {context[:100]}...")
            logger.info(f"Context length: {len(context)}")
        else:
            logger.warning("No context was retrieved.")

    except Exception as e:
        logger.error(f"An error occurred during context retrieval: {e}")

    total_duration = (time.time() - init_start_time) * 1000
    logger.info(f"Total benchmark duration: {total_duration:.2f} ms")


if __name__ == "__main__":
    benchmark_vector_store()