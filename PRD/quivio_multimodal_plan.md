### 3. **Agent Produces Comprehensive Analysis**

#### **The Current Architecture**

| Component | Description | Key Code / Config References |
|-----------|-------------|------------------------------|
| **Front‑End** | Next.js client with Colyseus for real‑time multiplayer. | `/apps/web`, `/apps/server/rooms` |
| **Question Cache** | Redis (`ctx:<topic>` & `q:<hash>` keys, TTL 6 h). | `redisClient.ts` |
| **Question DB** | Supabase Postgres – `questions` table. | `schema.sql` |
| **Vector Store (Text)** | `wiki_chunks` table with **pgvector** (1536‑d OpenAI embeddings) + RPC `vector_search`. | *Quivio Vector Store v1* migration file |
| **RAG‑Service** | FastAPI service for Wikipedia ingestion & retrieval. | `/apps/rag-service` |
| **LLM Generation** | `GeminiService` (see `GeminiService.ts` above). | Uses `gemini-2.5-flash` |
| **Game Loop** | Colyseus room, WebSocket events. | `TriviaRoom.ts` |

> **Gap:** No image ingestion or retrieval; context misses when topic isn’t in `wiki_chunks`.

---

#### **The Core Problem**

*Quivio cannot generate image‑based trivia and sometimes lacks rich text context for fuzzy or long‑tail topics.*

* **Example 1 (Image):** User enters “N64 box art” → system can’t fetch an image, so falls back to text‑only round.  
* **Example 2 (Context):** Topic “Jaguar (car)” → vector store miss ⇒ Gemini writes shallow or wrong question.

---

#### **The Root Cause**

1. **Single‑modality vector store** – only Wikipedia text chunks.  
2. **No fuzzy, managed fallback** – when pgvector misses, there’s no secondary index.  
3. **No image pipeline** – lack of licensed image source, metadata parser, and schema support.

---

#### **Recommended Solution (Target Architecture)**

```
                            ┌────────────────────────┐
User Topic ──► Redis Cache ─┤ if miss                │
                            │                        ▼
                   ┌────────┴───────┐         ┌──────────────┐
                   │ pgvector (text)│ miss───►│ Cohere Weav. │   ← public 1 M‑page Wikipedia
                   └──────┬─────────┘         └──────────────┘
                          │
                          │ success (context)
                          ▼
     ┌─────────────────────────────────────────┐
     │ GeminiService.buildContextualPrompt()  │
     └─────────────────────────────────────────┘

**Image path (parallel)**

User Topic ─► Commons MediaSearch ─success─► ImageQuestionResolver
                 │ miss
                 ▼
        Weaviate Unsplash Demo (CLIP vectors)
```

*Text*: keep **pgvector** primary, add **public Cohere×Weaviate** as fallback.  
*Images*: query **Wikimedia Commons** first (CC licences), then **Unsplash‑Weaviate**. Gradually ingest images into *own* Weaviate cluster.

---

#### **Phased Implementation Plan**

| Phase | Goal | Major Tasks | Est. |
|-------|------|------------|------|
| **0 – Quick Win** | Ship Commons‑only image rounds. | • `fetchCommonsImage()` helper<br>• `image_assets` schema update<br>• `<ImageQuestion/>` UI. | 2 days |
| **1 – Text Fallback** | Zero‑infra coverage of missing topics. | • Add `getCohereWikiContext()` fallback call in `GeminiService`.<br>• Monitor latency & hit‑rate. | 0.5 day |
| **2 – Unsplash Vector Fallback** | Modern imagery & fuzzy visual queries. | • Embed via Cohere.<br>• GraphQL `nearVector` on Unsplash demo.<br>• Image‑question resolver reuse. | 1 day |
| **3 – Own Weaviate Cluster** | Unified, low‑latency multimodal store. | • Spin up Serverless cluster.<br>• Create `Article` & `Photo` classes.<br>• Bulk‑import existing wiki_chunks & image_assets.<br>• Switch search order: Weaviate → pgvector → Cohere. | 2 days |
| **4 – Expansion & Tuning** | Scalability & observability. | • Add IGDB, Smithsonian feeders.<br>• Prometheus dashboards (hit‑rate, p95).<br>• Autoscale Weaviate shards. | ongoing |

> **Exit criteria for Ph 3:** Weaviate hit‑rate ≥ 70 %, p95 latency ≤ 50 ms, image recall ≥ 90 % for top 1 k topics.

---

*With this roadmap, Quivio can roll out visual trivia inside a single sprint while de‑risking future scale with a managed vector backend.*