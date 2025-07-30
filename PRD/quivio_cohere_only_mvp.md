### 3. **Agent Produces Comprehensive Analysis (Revised – “Cohere‑Only MVP”)**

#### **The Core Problem**

Quivio lacks:
1. **Context grounding** for Gemini prompts.  
2. **Image‑based trivia** generation.

We must solve this **without extra infra** (no Redis, no micro‑services).

---

#### **Root Cause**

*Previous design assumed new services (pgvector, RAG, image cache), none of which are spun up.*  
Therefore Gemini generates ungrounded questions and images are impossible.

---

#### **Recommended Target Architecture (Cohere‑Only, Zero‑Infra)**

```mermaid
graph TD
    A[Topic] -->|embed| B[Cohere API]
    B -->|nearText:Wiki| C[Paragraph Context]
    B -->|nearVector:Unsplash| D[Image Hit]
    C --> G[GeminiService.buildPrompt()]
    D --> H[ImageQuestionResolver]
```

*One outbound call → Cohere APIs cover **both text context & images**.*


**Decision:** Start in **Node** for a single‑process MVP; migrate ingestion scripts to Python later.

---

#### **Branching Strategy**

* `git checkout -b feat/cohere-context-and-images` off `HEAD` – isolates work; Cursor can run locally.

---

#### **Phased Implementation Plan**

| Phase | Deliverable | Tasks | Est. |
|-------|-------------|-------|------|
| **0 – SDK Bootstrap** | Cohere connectivity | `npm i cohere-ai weaviate-client`<br>Add `.env.local` with `COHERE_API_KEY` | 0.25 d |
| **1 – Text Context** | Gemini grounded | • `getWikiContext(topic)` – GraphQL to Cohere Wiki Weaviate.<br>• Inject into `GeminiService` if hit. | 0.5 d |
| **2 – Image Trivia** | First visual round | • `getImageHit(topic)` – Unsplash Weaviate.<br>• Map to “Who / Where / What” question.<br>• Add simple `<ImageQuestion/>` component. | 1 d |
| **3 – Local Polish** | Seamless UX | • Licence pop‑over.<br>• Unit tests.<br>• Graceful fallback when no image found. | 0.5 d |
| **4 – (Future) Own DB** | Niche / meme content | Prototype pgvector or SQLite table for fresh, crowd‑added facts. | later |

> **Order:** Implement **Phase 1** first – quickest win in question quality; then **Phase 2** for images.

---

*This plan keeps everything self‑contained, leverages Cohere’s free endpoints, and meets the “no extra infra” constraint.*

