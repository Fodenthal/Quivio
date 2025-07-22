"""
RAG Service - Data Retrieval Microservice for Trivia Question Generation

This service handles context retrieval using LlamaIndex for various data sources
including Wikipedia and web search to enhance trivia question quality.
"""

import logging
import time
import traceback
import uuid
from datetime import datetime
from typing import Any, Dict, Literal, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("rag-service")

app = FastAPI(
    title="RAG Service",
    description="Data retrieval service for enhanced trivia question generation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware for TypeScript server integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080"],  # Frontend and server ports
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

class ContextRequest(BaseModel):
    """Enhanced request model with validation and optional parameters"""
    topic: str = Field(
        min_length=1, 
        max_length=200, 
        description="The topic to get context for",
        example="The Irish Civil War"
    )
    category: Literal["News", "History", "Media", "Sports", "General"] = Field(
        description="Category to determine the best data source",
        example="History"
    )
    max_context_length: Optional[int] = Field(
        default=1000, 
        ge=100,
        le=5000, 
        description="Maximum characters in context response"
    )
    language: Optional[str] = Field(
        default="en", 
        min_length=2,
        max_length=5,
        description="Language preference for context retrieval"
    )

class ContextResponse(BaseModel):
    """Enhanced response model with metadata and tracing"""
    context: str = Field(description="The retrieved context information")
    source: str = Field(description="Data source used for context retrieval")
    confidence: float = Field(
        ge=0.0, 
        le=1.0, 
        description="Confidence score for context relevance"
    )
    request_id: str = Field(description="Unique identifier for request tracing")
    processing_time_ms: int = Field(description="Processing time in milliseconds")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata about the context retrieval"
    )

class ErrorResponse(BaseModel):
    """Standardized error response format"""
    error: str = Field(description="Error message")
    request_id: str = Field(description="Request identifier for debugging")
    timestamp: str = Field(description="ISO timestamp when error occurred")
    endpoint: str = Field(description="API endpoint where error occurred")

def generate_request_id() -> str:
    """Generate a unique request ID for tracing"""
    timestamp = int(time.time())
    unique_part = str(uuid.uuid4())[:8]
    return f"req_{timestamp}_{unique_part}"

def normalize_topic(topic: str) -> str:
    """Normalize topic string for processing"""
    return topic.strip().title()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware for request logging and timing"""
    start_time = time.time()
    request_id = generate_request_id()
    
    # Store request_id in request state for use in endpoints
    request.state.request_id = request_id
    
    logger.info(f"Request started: {request.method} {request.url.path} [ID: {request_id}]")
    
    try:
        response = await call_next(request)
        process_time = int((time.time() - start_time) * 1000)
        
        logger.info(
            f"Request completed: {request.method} {request.url.path} "
            f"[ID: {request_id}] Status: {response.status_code} Time: {process_time}ms"
        )
        
        # Add request ID to response headers for debugging
        response.headers["X-Request-ID"] = request_id
        
        return response
    except Exception as e:
        process_time = int((time.time() - start_time) * 1000)
        logger.error(
            f"Request failed: {request.method} {request.url.path} "
            f"[ID: {request_id}] Error: {str(e)} Time: {process_time}ms"
        )
        raise

@app.get("/")
async def root():
    """Basic health check endpoint"""
    return {
        "status": "RAG Service is running",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Comprehensive health check for monitoring and dependency validation"""
    start_time = time.time()
    
    health_status = {
        "status": "healthy",
        "service": "rag-service", 
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "checks": {}
    }
    
    # Test LlamaIndex imports
    try:
        from llama_index.core import Document
        from llama_index.readers.wikipedia import WikipediaReader
        from llama_index.readers.web import SimpleWebPageReader
        health_status["checks"]["llamaindex_imports"] = {
            "status": "pass",
            "message": "All LlamaIndex components available"
        }
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["llamaindex_imports"] = {
            "status": "fail",
            "message": f"LlamaIndex import error: {str(e)}"
        }
    
    # Basic memory and performance check
    try:
        import psutil
        memory_usage = psutil.virtual_memory().percent
        health_status["checks"]["system_resources"] = {
            "status": "pass" if memory_usage < 90 else "warn",
            "memory_usage_percent": memory_usage
        }
    except ImportError:
        health_status["checks"]["system_resources"] = {
            "status": "skip",
            "message": "psutil not available for system monitoring"
        }
    
    health_status["response_time_ms"] = int((time.time() - start_time) * 1000)
    
    return health_status

@app.post("/get-context", response_model=ContextResponse, responses={
    400: {"model": ErrorResponse, "description": "Bad Request - Invalid input"},
    422: {"model": ErrorResponse, "description": "Validation Error"},
    500: {"model": ErrorResponse, "description": "Internal Server Error"}
})
async def get_context(request: ContextRequest, http_request: Request) -> ContextResponse:
    """
    Get relevant context for a topic to enhance question generation
    
    This endpoint will use LlamaIndex to retrieve contextually relevant information
    from various sources (Wikipedia, web search) based on the topic category.
    
    Args:
        request: Contains topic, category, and optional parameters
        
    Returns:
        ContextResponse with retrieved context, source info, and metadata
        
    Raises:
        HTTPException: For validation errors or processing failures
    """
    start_time = time.time()
    request_id = getattr(http_request.state, 'request_id', generate_request_id())
    
    try:
        # Input validation and normalization
        normalized_topic = normalize_topic(request.topic)
        
        logger.info(
            f"Processing context request [ID: {request_id}]: "
            f"Topic='{normalized_topic}' Category={request.category}"
        )
        
        # TODO: This will be replaced with actual LlamaIndex implementation in Step 4
        # For now, return enhanced placeholder response with proper structure
        
        # Simulate different responses based on category
        source_mapping = {
            "History": "wikipedia",
            "Media": "wikipedia", 
            "News": "web_search",
            "Sports": "web_search",
            "General": "wikipedia"
        }
        
        simulated_source = source_mapping.get(request.category, "placeholder")
        
        # Generate contextual placeholder content
        placeholder_context = (
            f"Enhanced context for '{normalized_topic}' (Category: {request.category}). "
            f"This information will be retrieved from {simulated_source} using LlamaIndex. "
            f"Content will be limited to {request.max_context_length} characters and "
            f"provided in {request.language} language when available."
        )
        
        # Respect max_context_length parameter
        if len(placeholder_context) > request.max_context_length:
            placeholder_context = placeholder_context[:request.max_context_length-3] + "..."
        
        processing_time = int((time.time() - start_time) * 1000)
        
        response = ContextResponse(
            context=placeholder_context,
            source=simulated_source,
            confidence=0.75,  # Higher confidence for enhanced placeholder
            request_id=request_id,
            processing_time_ms=processing_time,
            metadata={
                "topic_normalized": normalized_topic,
                "category_processed": request.category,
                "language_requested": request.language,
                "max_length_requested": request.max_context_length,
                "actual_length": len(placeholder_context)
            }
        )
        
        logger.info(
            f"Context request completed [ID: {request_id}]: "
            f"Source={response.source} Length={len(response.context)} Time={processing_time}ms"
        )
        
        return response
        
    except ValueError as e:
        # Handle validation-related errors
        error_response = ErrorResponse(
            error=f"Validation error: {str(e)}",
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat() + "Z",
            endpoint="/get-context"
        )
        logger.error(f"Validation error [ID: {request_id}]: {str(e)}")
        raise HTTPException(status_code=400, detail=error_response.dict())
        
    except Exception as e:
        # Handle unexpected errors
        processing_time = int((time.time() - start_time) * 1000)
        error_response = ErrorResponse(
            error=f"Internal processing error: {str(e)}",
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat() + "Z",
            endpoint="/get-context"
        )
        
        logger.error(
            f"Internal error [ID: {request_id}]: {str(e)} Time={processing_time}ms\n"
            f"Traceback: {traceback.format_exc()}"
        )
        raise HTTPException(status_code=500, detail=error_response.dict())

if __name__ == "__main__":
    print("🚀 Starting RAG Service...")
    print("📡 Service will be available at: http://localhost:8001")  
    print("📖 API docs available at: http://localhost:8001/docs")
    print("🔍 Health check available at: http://localhost:8001/health")
    print("💡 Example request:")
    print('   curl -X POST http://localhost:8001/get-context \\')
    print('     -H "Content-Type: application/json" \\')
    print('     -d \'{"topic": "World War II", "category": "History"}\'')
    print()
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    ) 