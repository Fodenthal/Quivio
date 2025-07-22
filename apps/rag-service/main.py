"""
RAG Service - Data Retrieval Microservice for Trivia Question Generation

This service handles context retrieval using LlamaIndex for various data sources
including Wikipedia and web search to enhance trivia question quality.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
import uvicorn

app = FastAPI(
    title="RAG Service",
    description="Data retrieval service for enhanced trivia question generation",
    version="1.0.0"
)

class ContextRequest(BaseModel):
    topic: str
    category: Literal["News", "History", "Media", "Sports", "General"]

class ContextResponse(BaseModel):
    context: str
    source: str
    confidence: float

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "RAG Service is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Detailed health check for monitoring"""
    return {
        "status": "healthy",
        "service": "rag-service",
        "version": "1.0.0"
    }

@app.post("/get-context")
async def get_context(request: ContextRequest) -> ContextResponse:
    """
    Get relevant context for a topic to enhance question generation
    
    Args:
        request: Contains topic and category for context retrieval
        
    Returns:
        ContextResponse with relevant context, source, and confidence score
    """
    # TODO: Implement LlamaIndex-based context retrieval
    # This is a placeholder that will be implemented in subsequent atomic steps
    
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    
    # Placeholder response - will be replaced with actual RAG implementation
    placeholder_context = f"Context information about {request.topic} will be retrieved from appropriate sources based on category {request.category}."
    
    return ContextResponse(
        context=placeholder_context,
        source="placeholder",
        confidence=0.5
    )

if __name__ == "__main__":
    print("🚀 Starting RAG Service...")
    print("📡 Service will be available at: http://localhost:8001")
    print("📖 API docs available at: http://localhost:8001/docs")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    ) 