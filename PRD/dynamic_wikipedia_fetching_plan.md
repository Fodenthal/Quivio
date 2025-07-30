# Dynamic Wikipedia Fetching Implementation Plan

## Overview

Currently, the RAG service's `/get-context` endpoint only works for topics that already have embeddings in the `wiki_chunks` database. This plan implements a new capability to dynamically fetch Wikipedia content for any query, even when no embeddings exist in the database.

## Problem Statement

**Current Limitation**: The `/get-context` endpoint returns "No specific context found" for topics not in the database, forcing fallback to basic prompt generation.

**Desired Solution**: Create a new endpoint or enhance existing functionality to:
1. Resolve user queries to Wikipedia article titles
2. Fetch the lead section content from Wikipedia
3. Return the content immediately for Gemini question generation
4. Optionally queue full article ingestion in the background

## Current Infrastructure Analysis

### Existing Components

1. **Title Resolution** (`title_resolver.py`)
   - ✅ `resolve_title()` - Converts fuzzy queries to exact Wikipedia titles
   - ✅ Handles disambiguation (e.g., "Mercury" → "Mercury (planet)")
   - ✅ Caching and error handling

2. **Wikipedia Search** (`wikipedia_search.py`)
   - ✅ `search_wikipedia_titles()` - Fuzzy search via MediaWiki API
   - ✅ `follow_redirect()` - Handles Wikipedia redirects
   - ✅ Rate limiting and error handling

3. **Content Fetching** (`ingest_worker.py`)
   - ✅ `fetch_wikipedia_article()` - Gets article HTML via REST API
   - ✅ `extract_lead_content()` - Extracts intro + first 2 paragraphs
   - ✅ `html_to_text()` - Converts HTML to clean text

4. **Vector Store** (`vector_store.py`)
   - ✅ Embedding generation and caching
   - ✅ Vector similarity search
   - ✅ Database storage

## Implementation Strategy

### Option 1: New Endpoint (Recommended)
Create `/get-context-dynamic` endpoint that:
- Resolves queries to Wikipedia titles
- Fetches lead content immediately
- Returns content for immediate use
- Queues full ingestion in background

### Option 2: Enhanced Existing Endpoint
Modify `/get-context` to:
- Try vector search first
- Fall back to dynamic fetching if no results
- Return combined results

**Recommendation**: Option 1 (new endpoint) to maintain backward compatibility and clear separation of concerns.

## Detailed Implementation Plan

### Phase 1: Core Dynamic Fetching Service

#### 1.1 Create Dynamic Content Service
**File**: `apps/rag-service/dynamic_content.py`

```python
class DynamicContentService:
    def __init__(self):
        self.title_resolver = TitleResolver()
        self.wikipedia_client = MediaWikiSearchClient()
        
    async def get_dynamic_context(self, query: str, max_length: int = 2000) -> Dict:
        """
        Get Wikipedia content dynamically for any query
        
        Returns:
            {
                "content": str,
                "title": str,
                "source": "wikipedia_dynamic",
                "confidence": float,
                "metadata": Dict
            }
        """
```

#### 1.2 Implement Core Methods

**Title Resolution**:
```python
def resolve_query_to_title(self, query: str) -> Optional[str]:
    """Resolve fuzzy query to exact Wikipedia title"""
    return self.title_resolver.resolve_title(query)
```

**Content Fetching**:
```python
def fetch_article_lead(self, title: str) -> Optional[str]:
    """Fetch lead section content from Wikipedia"""
    # Use existing ingest_worker.fetch_wikipedia_article()
    # Use existing ingest_worker.extract_lead_content()
```

**Content Processing**:
```python
def process_content(self, content: str, max_length: int) -> str:
    """Process and truncate content to fit max_length"""
    # Similar to vector_store.get_context_for_topic() logic
```

### Phase 2: API Endpoint Implementation

#### 2.1 New Endpoint
**File**: `apps/rag-service/main.py`

```python
@app.post("/get-context-dynamic")
async def get_dynamic_context(request: ContextRequest) -> ContextResponse:
    """
    Get Wikipedia content dynamically for any query
    
    This endpoint resolves queries to Wikipedia titles and fetches
    content immediately, even if not in the vector database.
    """
```

#### 2.2 Request/Response Models
```python
class DynamicContextRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=200)
    max_context_length: Optional[int] = Field(default=2000, ge=100, le=5000)
    queue_ingestion: Optional[bool] = Field(default=True, description="Queue full article ingestion in background")

class DynamicContextResponse(BaseModel):
    context: str
    title: str
    source: str = "wikipedia_dynamic"
    confidence: float
    request_id: str
    processing_time_ms: int
    metadata: Dict[str, Any]
```

### Phase 3: Background Ingestion Integration

#### 3.1 Queue Full Ingestion
```python
def queue_full_ingestion(self, title: str) -> bool:
    """Queue full article ingestion in background"""
    # Use existing background_tasks.py infrastructure
    # Queue ingest_worker.ingest_article_background()
```

#### 3.2 Background Task Management
- Leverage existing `background_tasks.py` infrastructure
- Queue full article ingestion after returning lead content
- Provide task status tracking

### Phase 4: Caching and Performance

#### 4.1 Lead Content Caching
```python
def cache_lead_content(self, title: str, content: str) -> None:
    """Cache lead content to avoid repeated Wikipedia API calls"""
    # In-memory cache with TTL
    # Redis cache for production
```

#### 4.2 Performance Optimization
- Cache resolved titles (already implemented in TitleResolver)
- Cache lead content for 1 hour
- Implement request deduplication

### Phase 5: Error Handling and Fallbacks

#### 5.1 Graceful Degradation
```python
def get_dynamic_context_with_fallback(self, query: str) -> Dict:
    """
    Get dynamic context with multiple fallback strategies:
    1. Try exact title resolution
    2. Try fuzzy search
    3. Try disambiguation
    4. Return error with suggestions
    """
```

#### 5.2 Error Response Format
```python
class DynamicContextError(BaseModel):
    error: str
    suggestions: List[str]  # Alternative queries to try
    request_id: str
    timestamp: str
```

## API Design

### Endpoint: `POST /get-context-dynamic`

**Request**:
```json
{
    "topic": "Einstein",
    "max_context_length": 2000,
    "queue_ingestion": true
}
```

**Success Response**:
```json
{
    "context": "Albert Einstein (14 March 1879 – 18 April 1955) was a German-born theoretical physicist...",
    "title": "Albert Einstein",
    "source": "wikipedia_dynamic",
    "confidence": 0.95,
    "request_id": "req_1234567890_abc123",
    "processing_time_ms": 1250,
    "metadata": {
        "title_resolution_strategy": "exact_match",
        "content_length": 1897,
        "background_ingestion_queued": true,
        "cache_hit": false
    }
}
```

**Error Response**:
```json
{
    "error": "Could not resolve 'xyz123' to a Wikipedia article",
    "suggestions": ["Einstein", "Physics", "Theory of relativity"],
    "request_id": "req_1234567890_abc123",
    "timestamp": "2025-07-30T00:00:00Z"
}
```

## Implementation Steps

### Step 1: Create Dynamic Content Service
1. Create `dynamic_content.py` with core service class
2. Implement title resolution integration
3. Implement content fetching using existing infrastructure
4. Add content processing and truncation logic

### Step 2: Add API Endpoint
1. Add new endpoint to `main.py`
2. Create request/response models
3. Implement error handling and validation
4. Add comprehensive logging

### Step 3: Integrate Background Ingestion
1. Integrate with existing `background_tasks.py`
2. Queue full article ingestion after lead content
3. Add task status tracking
4. Implement deduplication

### Step 4: Add Caching Layer
1. Implement lead content caching
2. Add cache invalidation logic
3. Add cache statistics to health endpoint
4. Optimize for performance

### Step 5: Testing and Validation
1. Unit tests for dynamic content service
2. Integration tests for API endpoint
3. Performance testing with various queries
4. Error handling validation

## Performance Considerations

### Expected Performance
- **Title Resolution**: 200-500ms (cached: 10-50ms)
- **Content Fetching**: 500-1000ms (cached: 10-50ms)
- **Total Response Time**: 700-1500ms (cached: 20-100ms)

### Optimization Strategies
1. **Caching**: Cache resolved titles and lead content
2. **Parallel Processing**: Resolve title and check cache in parallel
3. **Background Ingestion**: Queue full ingestion asynchronously
4. **Request Deduplication**: Handle concurrent requests for same topic

## Monitoring and Observability

### Metrics to Track
- Response times (title resolution, content fetching, total)
- Cache hit rates
- Success/failure rates by query type
- Background ingestion queue status
- Wikipedia API rate limiting

### Health Checks
- Title resolution service availability
- Wikipedia API connectivity
- Background task queue health
- Cache performance metrics

## Security Considerations

### Rate Limiting
- Implement per-client rate limiting
- Respect Wikipedia API rate limits
- Add request throttling for expensive operations

### Input Validation
- Sanitize user queries
- Validate title resolution results
- Prevent malicious Wikipedia API calls

### Error Handling
- Don't expose internal Wikipedia API errors
- Provide safe fallback responses
- Log errors for debugging without exposing details

## Future Enhancements

### Phase 6: Advanced Features
1. **Multi-language Support**: Support non-English Wikipedia
2. **Content Enrichment**: Add related articles and cross-references
3. **Smart Caching**: Implement LRU cache with intelligent eviction
4. **Content Quality**: Add content quality scoring and filtering

### Phase 7: Integration Options
1. **Enhanced `/get-context`**: Add fallback to dynamic fetching
2. **Hybrid Search**: Combine vector search with dynamic content
3. **Content Merging**: Merge cached and dynamic content intelligently

## Success Metrics

### Primary Metrics
- **Response Time**: < 2 seconds for uncached requests
- **Success Rate**: > 90% for valid Wikipedia queries
- **Cache Hit Rate**: > 50% for repeated queries
- **Error Rate**: < 5% for network/API errors

### Secondary Metrics
- **Background Ingestion Success**: > 95% of queued tasks complete
- **Wikipedia API Efficiency**: < 100 requests per minute
- **User Satisfaction**: Reduced fallback to basic prompts

## Conclusion

This implementation plan provides a comprehensive solution for dynamic Wikipedia content fetching while leveraging existing infrastructure. The new `/get-context-dynamic` endpoint will significantly improve the RAG service's coverage and reduce dependency on pre-ingested content, while maintaining performance through intelligent caching and background processing. 