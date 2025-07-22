# RAG Service

A Python microservice for intelligent data retrieval using LlamaIndex to enhance trivia question generation.

## Overview

This service acts as a specialized data retrieval layer that sources relevant context from various sources (Wikipedia, web search, etc.) to improve the quality and accuracy of AI-generated trivia questions.

## Architecture

- **FastAPI**: Web framework for the REST API
- **LlamaIndex**: Framework for data loading and retrieval 
- **Multi-Source Strategy**: 
  - Wikipedia for historical/media topics
  - Web search for current events/sports
  - Intelligent source selection based on topic category

## Setup

### 1. Install Dependencies

```bash
cd apps/rag-service
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file:

```bash
# Optional: API keys for enhanced search capabilities
# GOOGLE_SEARCH_API_KEY=your_key_here
# GOOGLE_SEARCH_ENGINE_ID=your_engine_id_here
```

### 3. Run the Service

```bash
python3 main.py
```

The service will start on `http://localhost:8001`

## API Endpoints

### Health Check
- `GET /` - Basic status
- `GET /health` - Detailed health information

### Context Retrieval
- `POST /get-context` - Main endpoint for context retrieval

**Request:**
```json
{
    "topic": "The Irish Civil War", 
    "category": "History"
}
```

**Response:**
```json
{
    "context": "Relevant historical context about the Irish Civil War...",
    "source": "wikipedia",
    "confidence": 0.85
}
```

## Development

### API Documentation
Visit `http://localhost:8001/docs` for interactive API documentation.

### Testing
```bash
# Test the service is running
curl http://localhost:8001/health

# Test context retrieval
curl -X POST http://localhost:8001/get-context \
  -H "Content-Type: application/json" \
  -d '{"topic": "World War II", "category": "History"}'
```

## Integration

This service is designed to be called by the main TypeScript server (`apps/server`) as part of the question generation pipeline. The TypeScript server handles:

- Topic categorization
- HTTP requests to this service  
- Final prompt construction
- Gemini API calls for question generation

## Future Enhancements

- [ ] Implement actual LlamaIndex data loading
- [ ] Add caching layer (Redis)
- [ ] Support for additional data sources
- [ ] Context quality scoring
- [ ] Rate limiting and error handling 