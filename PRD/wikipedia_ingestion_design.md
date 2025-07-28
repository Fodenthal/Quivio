# Wikipedia Ingestion Design Notes

_Last updated: 28 July 2025_

---

## 1  Current State

| Stage | How it works **today** | Gaps / risks |
|-------|------------------------|--------------|
| **Title source** | We pass an explicit article title (e.g. `"Albert Einstein"`) to `ingest_worker.py`. | No automated discovery from a free‑form topic string. |
| **Ingestion** | Full article HTML → clean text → 512‑token chunks → embeddings → `wiki_chunks`. | Works only **after** we already know the exact title. |
| **Disambiguation / fuzzy** | _None_. | Topic like `"Einstein"` won’t map to `"Albert Einstein"` unless hard‑coded. |
| **Real‑time flow** | If RAG returns no chunks, we *don’t* attempt on‑the‑fly ingestion. | Game may stall or fall back to context‑free Gemini prompts. |
| **Latency** | Full‑article embed + store ≈ 6‑12 s. | Acceptable offline; risky inside 15 s interactive deadline. |

---

## 2  Choosing the Right Wikipedia Article

### 2.1  Search & Rank Workflow

1. **Query the MediaWiki search API**

   ```http
   GET https://en.wikipedia.org/w/api.php
       ?action=query
       &list=search
       &srsearch={topic}
       &srlimit=5
       &format=json
   ```

   *Typical latency: ≈ 100 ms (US).*

2. **Pick a candidate**

   * Prefer an **exact normalized match** (`lowercase + strip punctuation`).
   * Otherwise take the top result **unless**:
     * `pageid == -1`, or
     * the snippet contains _"may refer to"_ (disambiguation clue).

3. **Disambiguation guardrail**

   * If chosen page is a _Disambiguation_ page, grab its first non‑disambiguation link and recurse **once**.

4. **Fuzzy assist?**  
   MediaWiki search already handles stemming & minor typos. Keep custom fuzzy logic in the backlog unless empirical miss‑hits appear.

_Result: “einsten” → “Albert Einstein” in one hop._

---

## 3  Fast‑Enough Ingestion Strategy

| Option | Latency | Pros | Cons | Verdict |
|--------|---------|------|------|---------|
| **A — Full parse before Gemini** | 6–12 s+ | Simple; full context | Exceeds 15 s SLA | ❌ |
| **B — *Lead‑first* streaming** | ~1 s to Gemini | Users wait <3 s; DB hydrated in background | First question only has intro context | ✅ **Recommended** |
| **C — Parse a few chunks then stop** | 1–2 s | Fastest | DB may stay shallow | ⚠️ |

### Option B Workflow

1. Fetch article HTML.  
2. Extract **intro & first two `<p>` tags** (≤ 512 tokens) and embed.  
3. Return that chunk to GeminiService immediately.  
4. **Async task** embeds the rest and stores them.  
5. GeminiService keeps its 1 s timeout → still hits context on a cold start.

---

## 4  Control‑Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant TriviaRoom
    participant GeminiService
    participant RAG
    participant IngestWorker

    Client->>TriviaRoom: createRoom("Einstein")
    TriviaRoom->>GeminiService: generateQuestion(topic)
    GeminiService->>RAG: getContext("Einstein")
    RAG->>Supabase: vector_search(...)
    alt cache hit
        Supabase-->>RAG: chunks[]
    else cache miss
        RAG->>MediaWiki: search("Einstein")
        RAG->>IngestWorker: ingest("Albert Einstein")  activate
        note right of IngestWorker: lead‑only, returns &lt;1 s
        IngestWorker-->>RAG: introChunk
        RAG-->>Supabase: (async) store full article
    end
    RAG-->>GeminiService: context
    GeminiService-->>Client: Q&A
```

---

## 5  Test Plan

1. **Unit tests** for search/disambiguation helper  
   * “Einstein” → “Albert Einstein”  
   * “Jaguar” (ambiguous) picks “Jaguar (car)” when context is “vehicle”.

2. **Load test** — ingest 100 cold topics, measure p95 time _topic → first Gemini response_.  
   *Target ≤ 3 s.*

3. **Chaos test** — kill background ingest worker; ensure game falls back gracefully to context‑free prompts within 1 s.

---

## 6  TL;DR

* **Add MediaWiki search + smart pick** to solve title discovery and fuzzy cases.  
* **Lead‑first streaming ingestion** delivers a question in ≤ 3 s, hydrates DB in the background.  
* Lightweight disambiguation heuristic suffices; no heavy pipeline needed.  
* Stay beneath the 15‑second SLA while still improving answer quality over time.
