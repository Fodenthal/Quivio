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
| 1.2 | Create **`wiki_chunks`** table:<br>`id uuid PRIMARY KEY`<br>`entity text` (title)<br>`section text` (optional)<br>`content text` (~500 tokens)<br>`embedding vector(768)`<br>`content_hash text UNIQUE NOT NULL`<br>`updated_at timestamptz DEFAULT now()` | Minimal schema + idempotent writes |
| 1.3 | `CREATE INDEX wiki_chunks_embedding_hnsw ON wiki_chunks USING hnsw (embedding vector_cosine_ops);` | Fast ANN search (`m=16 ef=200`) |

**Note**: This table is completely separate from the existing `questions` table. Both systems coexist.

---

## 2 · Enhanced rag-service (Python)

The existing `apps/rag-service` skeleton becomes the vector retrieval engine:

### 2.1 On‑demand ingestion worker

1. **Input**: article title (string)  
2. Fetch HTML from Wikipedia REST → strip tags (`html2text`).  
3. Chunk into **512 tokens (+64 overlap)**.  
4. **Batch‑embed chunks** via `text‑embedding‑3‑small` (up to **2K tokens / request** for 60-70% cost savings).  
5. Compute `content_hash = hashlib.sha256(content.encode()).hexdigest()`; skip insert if unchanged.  
6. `INSERT … ON CONFLICT (content_hash) DO NOTHING` into Supabase `wiki_chunks` for idempotent writes.

CLI usage:
```bash
python ingest_worker.py "Battle of Salamis"
```

### 2.2 Auto‑trigger ingestion

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
- [x] Create `wiki_chunks` table + index
- [x] Test basic vector operations

### Phase 2: rag-service enhancement ✅
- [x] Add embedding dependencies (`openai`, `supabase`, `numpy`)
- [x] Implement `/get-context` endpoint with vector search
- [ ] Add Wikipedia ingestion worker
- [ ] Test end-to-end context retrieval

### Phase 3: Wikipedia ingestion worker
- [ ] Create `ingest_worker.py` script for Wikipedia content ingestion
- [ ] Implement Wikipedia API fetching and HTML parsing
- [ ] Add content chunking (512 tokens + 64 overlap)
- [ ] Implement batch embedding (up to 2K tokens/request)
- [ ] Add content hashing for idempotent writes
- [ ] Test ingestion with sample Wikipedia articles

### Phase 4: GeminiService integration
- [ ] Add HTTP client to `apps/server` dependencies  
- [ ] Enhance `generateQuestion()` with context calls
- [ ] Add fallback handling for rag-service unavailability
- [ ] Preserve existing question caching system

### Phase 5: Production readiness
- [ ] Add Redis caching layer
- [ ] Implement monitoring & alerting
- [ ] Load test vector retrieval performance
- [ ] Deploy with proper error handling

---

## 8 · Done checklist

- [ ] `pgvector` enabled & `wiki_chunks` table live in Supabase
- [ ] rag-service ingests Wikipedia articles end‑to‑end  
- [ ] `/get-context` returns relevant chunks in <30 ms  
- [ ] GeminiService uses context when available, falls back gracefully
- [ ] Existing question caching system unaffected
- [ ] Dashboard shows latency + spend + context quality metrics
