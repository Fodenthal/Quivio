# Quivio Vector Store v1 – Minimal Integration Plan

> **Goal**  Serve accurate Wikipedia‑grounded trivia with sub‑30 ms semantic retrieval and the least moving parts possible.

---

## Architecture Overview

This plan enhances the existing Quivio architecture by adding vector-based context retrieval while preserving current question caching:

- **Supabase**: Main database for both existing questions table AND new `wiki_chunks` table
- **Existing Question Flow**: `TriviaRoom → QuestionDatabase (Supabase cache) → GeminiService` *(unchanged)*
- **New Context Flow**: `GeminiService → rag-service → pgvector retrieval → Wikipedia context → enhanced prompts`

Both systems work together: existing question caching for speed + vector context for quality.

---

## 1 · Postgres + pgvector foundation (Supabase)

| # | Task | Purpose |
|---|------|---------|
| 1.1 | `CREATE EXTENSION IF NOT EXISTS vector;` | Enable vector column + ops |
| 1.2 | Create **`wiki_chunks`** table:<br>`id uuid PRIMARY KEY`<br>`entity text` (title)<br>`section text` (optional)<br>`content text` (~500 tokens)<br>`embedding vector(1536)`<br>`content_hash text UNIQUE NOT NULL`<br>`updated_at timestamptz DEFAULT now()` | Minimal schema + idempotent writes |
| 1.3 | `CREATE INDEX wiki_chunks_embedding_hnsw ON wiki_chunks USING hnsw (embedding vector_cosine_ops);` | Fast ANN search (`m=16 ef=200`) |

**Note**: This table is completely separate from the existing `questions` table. Both systems coexist.

**Database Migration Required**: Run these SQL commands in Supabase dashboard:
```sql
-- Step 1: Drop existing table and function
DROP TABLE IF EXISTS wiki_chunks CASCADE;
DROP FUNCTION IF EXISTS vector_search(vector, float, int);

-- Step 2: Recreate wiki_chunks table with 1536 dimensions
CREATE TABLE IF NOT EXISTS wiki_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  section text,
  content text NOT NULL,
  embedding vector(1536),
  content_hash text UNIQUE NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Create HNSW index for fast vector search
CREATE INDEX IF NOT EXISTS wiki_chunks_embedding_hnsw 
ON wiki_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);

-- Step 4: Create vector search function
CREATE OR REPLACE FUNCTION vector_search(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.12,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  entity text,
  section text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wiki_chunks.id,
    wiki_chunks.entity,
    wiki_chunks.section,
    wiki_chunks.content,
    1 - (wiki_chunks.embedding <=> query_embedding) AS similarity
  FROM wiki_chunks
  WHERE 1 - (wiki_chunks.embedding <=> query_embedding) > similarity_threshold
  ORDER BY wiki_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 2 · Enhanced rag-service (Python)

The existing `apps/rag-service` skeleton becomes the vector retrieval engine:

### 2.1 On‑demand ingestion worker

1. **Input**: article title (string)  
2. Fetch HTML from Wikipedia REST → clean narrative prose (BeautifulSoup).  
3. Chunk into **512 tokens (+64 overlap)**.  
4. **Batch‑embed chunks** via `text‑embedding‑3‑small` (up to **2K tokens / request** for 60-70% cost savings).  
5. Compute `content_hash = hashlib.sha256(content.encode()).hexdigest()`; skip insert if unchanged.  
6. `INSERT … ON CONFLICT (content_hash) DO NOTHING` into Supabase `wiki_chunks` for idempotent writes.

**Dependencies** (in `pyproject.toml`):
```toml
dependencies = [
    "fastapi==0.104.1",
    "uvicorn[standard]==0.24.0",
    "llama-index-core==0.10.57",
    "llama-index-readers-wikipedia==0.1.4",
    "llama-index-readers-web==0.1.6",
    "openai==1.45.0",
    "supabase==1.2.0",  # Use 1.2.0 to avoid proxy argument issues
    "numpy==1.24.3",
    "pydantic==2.5.0",
    "requests==2.31.0",
    "python-dotenv==1.0.0",
    "beautifulsoup4>=4.12.3",  # For clean HTML parsing
]
```

**Virtual Environment Setup**:
```bash
cd apps/rag-service
uv venv
uv sync
source .venv/bin/activate
```

CLI usage:
```bash
# Manual ingestion with exact title
python ingest_worker.py "Albert Einstein" --verbose

# Auto-resolve topic to title (Phase 3.5)
python ingest_worker.py "Einstein" --auto-resolve --verbose
```

### 2.2 HTML Parsing Improvements

**Problem**: Original `html2text` produced "table soup" with pipe characters and citation brackets.

**Solution**: BeautifulSoup-based parsing that:
- Targets `div.mw-parser-output` or `<section>` elements (REST API structure)
- Skips tables, infoboxes, lists, and references
- Removes citation brackets like `[17]` and `[note 1]`
- Preserves clean narrative prose only
- Handles both traditional Wikipedia HTML and REST API structure

**Test Results**: 
- ✅ 83,465 characters of clean text from Albert Einstein article
- ✅ No pipe characters, no citation brackets
- ✅ 13,295 words of usable narrative prose

### 2.3 Auto‑trigger ingestion

```python
def ensure_entity(title: str):
    exists = supabase.table("wiki_chunks").select("id").eq("entity", title).limit(1).execute()
    if not exists.data:
        enqueue_job("ingest", title)
```

Call at the top of `/get-context` when `source == "wikipedia"`.

---

## 3 · Enhanced rag-service endpoints

**POST** `/get-context`  
Body: `{ "topic": "string", "category": "string" }`

```python
# Embed the topic query
qvec = embed(topic)

# Retrieve relevant chunks
result = supabase.rpc("vector_search", {
    "query_embedding": qvec,
    "similarity_threshold": 0.12,
    "match_count": 5
}).execute()

if not result.data or result.data[0]["similarity"] < 0.12:
    ensure_entity(resolve_title(topic))  # Auto-ingest on miss

# Join and return context
context = "\n".join([chunk["content"] for chunk in result.data])
return {"context": context, "source": "wikipedia"}
```

---

## 4 · GeminiService integration

Enhance existing `GeminiService.generateQuestion()` method:

```typescript
async generateQuestion(request: QuestionRequest): Promise<GeneratedQuestion> {
  // NEW: Get Wikipedia context via rag-service with timeout
  let contextualPrompt = this.buildPrompt(request);
  
  try {
    const ragResponse = await axios.post('http://localhost:8001/get-context', {
      topic: request.topic,
      category: this.inferCategory(request.topic)
    }, {
      timeout: 1000, // 1s timeout for real-time game performance
      retry: 0
    });
    
    if (ragResponse.data.context) {
      contextualPrompt = this.buildContextualPrompt(request, ragResponse.data.context);
    }
  } catch (error) {
    // Circuit breaker: fail closed with basic prompt
    console.warn('RAG service unavailable or slow, using basic prompt:', error.message);
  }
  
  // EXISTING: Generate with Gemini (enhanced with context when available)
  const result = await this.model.generateContent(contextualPrompt);
  return this.parseResponse(result.response.text(), request);
}
```

---

## 5 · Cache & dedup (Redis)

- Key `ctx:<entity>` → joined chunks, TTL 6 h.  
- Skip LLM call if identical prompt hash seen in last 200 entries.

---

## 6 · Observability (Prometheus / Grafana)

| Metric | Alert |
|--------|-------|
| Vector query p95 < 50 ms | > 50 ms |
| Embedding tokens / day | > budget |
| Ingestion job errors | any |
| Context retrieval success rate | < 90% |

---

## 7 · Implementation phases

### Phase 1: Database setup ✅
- [x] Enable `pgvector` in Supabase
- [x] Create `wiki_chunks` table + index (updated to 1536 dimensions)
- [x] Test basic vector operations
- [x] Database migration completed

### Phase 2: rag-service enhancement ✅
- [x] Add embedding dependencies (`openai`, `supabase`, `numpy`, `beautifulsoup4`)
- [x] Implement `/get-context` endpoint with vector search
- [x] Add Wikipedia ingestion worker
- [x] Test end-to-end context retrieval
- [x] Fix Supabase version compatibility (use 1.2.0)
- [x] Implement clean HTML parsing with BeautifulSoup
- [x] Virtual environment setup and dependency management

### Phase 3: Wikipedia ingestion worker ✅
- [x] Create `ingest_worker.py` script for Wikipedia content ingestion
- [x] Implement Wikipedia API fetching and HTML parsing
- [x] Add content chunking (512 tokens + 64 overlap)
- [x] Implement batch embedding (up to 2K tokens/request)
- [x] Add content hashing for idempotent writes
- [x] Test ingestion with sample Wikipedia articles
- [x] Fix vector dimension mismatch (768 → 1536)
- [x] Implement clean narrative prose extraction
- [x] Handle Wikipedia REST API structure

### Phase 3.5: Smart Title Discovery 🆕
- [ ] **MediaWiki Search API Client**
  - [ ] Implement `wikipedia_search.py` with MediaWiki API client
  - [ ] Query `https://en.wikipedia.org/w/api.php` for topic search
  - [ ] Handle network failures and rate limits
  - [ ] Expected latency: ~100ms (US)

- [ ] **Disambiguation Detection & Resolution**
  - [ ] Implement `disambiguation.py` for smart title resolution
  - [ ] Detect "may refer to" disambiguation clues
  - [ ] Prefer exact normalized matches
  - [ ] Handle recursive disambiguation resolution (once only)

- [ ] **Title Resolution Service**
  - [ ] Implement `title_resolver.py` for orchestration
  - [ ] Combine search and disambiguation logic
  - [ ] Handle edge cases (no results, all disambiguation pages)
  - [ ] Return resolved title or fallback

- [ ] **Enhanced Ingest Worker Integration**
  - [ ] Add `--auto-resolve` flag to `ingest_worker.py`
  - [ ] New method: `resolve_and_ingest(topic: str) -> bool`
  - [ ] Preserve existing CLI behavior
  - [ ] Fallback to manual title if resolution fails

- [ ] **Unit Test Suite**
  - [ ] Test exact matches: "Albert Einstein" → "Albert Einstein"
  - [ ] Test fuzzy matches: "einsten" → "Albert Einstein"
  - [ ] Test disambiguation: "Jaguar" → "Jaguar (car)"
  - [ ] Test edge cases and error handling

**Success Criteria**:
- ✅ "Einstein" → "Albert Einstein" in one hop
- ✅ "Jaguar" → appropriate disambiguation resolution
- ✅ "einsten" → "Albert Einstein" (fuzzy matching)
- ✅ Title resolution <200ms p95
- ✅ No breaking changes to existing functionality

### Phase 4: Lead-First Streaming Ingestion 🆕
- [ ] **Modify ingestion for lead-only mode**
  - [ ] Extract intro & first two paragraphs (≤512 tokens)
  - [ ] Return lead chunk immediately (<1s)
  - [ ] Background task for full article ingestion
  - [ ] Preserve existing full ingestion mode

- [ ] **Background Task Management**
  - [ ] Implement async task queue for full ingestion
  - [ ] Handle task failures and retries
  - [ ] Monitor background task completion
  - [ ] Graceful degradation on worker failures

### Phase 5: GeminiService integration
- [ ] Add HTTP client to `apps/server` dependencies  
- [ ] Enhance `generateQuestion()` with context calls
- [ ] Add fallback handling for rag-service unavailability
- [ ] Preserve existing question caching system
- [ ] Implement 1s timeout with lead-first ingestion

### Phase 6: Production readiness
- [ ] Add Redis caching layer
- [ ] Implement monitoring & alerting
- [ ] Load test vector retrieval performance
- [ ] Deploy with proper error handling

---

## 8 · Current Status & Done Checklist

### ✅ **Fully Working Components:**

1. **Database Schema**: Successfully updated to support 1536-dimensional vectors
2. **Wikipedia Ingestion**: 
   - ✅ Fetches Wikipedia articles via REST API
   - ✅ Converts HTML to clean narrative prose (no table soup)
   - ✅ Chunks content into 512-token segments with 64-token overlap
   - ✅ Generates embeddings using `text-embedding-3-small` (1536 dimensions)
   - ✅ Stores chunks in Supabase with content hashing for idempotency
   - ✅ Successfully ingested articles (Albert Einstein: 61 chunks, Battle of Salamis: 19 chunks)

3. **OpenAI Integration**: 
   - ✅ API key configured correctly
   - ✅ Embeddings generated successfully
   - ✅ Batch processing working (up to 2K tokens/request)

4. **Supabase Integration**:
   - ✅ Connection established successfully
   - ✅ Vector search function working
   - ✅ Content hashing prevents duplicate ingestion

5. **Virtual Environment**:
   - ✅ Proper dependency management with `uv`
   - ✅ Supabase version compatibility resolved (1.2.0)
   - ✅ All dependencies working correctly

6. **HTML Parsing**:
   - ✅ BeautifulSoup-based clean text extraction
   - ✅ Handles both traditional and REST API HTML structures
   - ✅ Removes citations and table content
   - ✅ Produces clean narrative prose

### 🎯 **Next Priority: Phase 3.5 - Smart Title Discovery**

The most critical missing piece is automated title discovery. Currently requires exact Wikipedia titles, but real-world usage involves fuzzy topics like "Einstein" or "Jaguar".

**Implementation Impact**:
- **Low Risk**: MediaWiki search implementation
- **High Value**: Transforms manual process into automated, user-friendly experience
- **Foundation**: Required for Phase 4 lead-first streaming and Phase 5 real-time integration

### 📋 **Final Done Checklist**

- [x] `pgvector` enabled & `wiki_chunks` table live in Supabase
- [x] rag-service ingests Wikipedia articles end‑to‑end  
- [x] Clean narrative prose extraction (no table soup)
- [x] Vector dimension compatibility (1536 dimensions)
- [x] Virtual environment and dependency management
- [ ] Smart title discovery (Phase 3.5)
- [ ] Lead-first streaming ingestion (Phase 4)
- [ ] `/get-context` returns relevant chunks in <30 ms  
- [ ] GeminiService uses context when available, falls back gracefully
- [ ] Existing question caching system unaffected
- [ ] Dashboard shows latency + spend + context quality metrics
