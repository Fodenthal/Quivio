
---

## 2  Expanded **Cursor Action Plan**

```markdown
## Cursor Action Plan
### [HIGH]
- ⬆️ **Allow and follow redirects**
  - Remove `"redirect to"` from `invalid_indicators`.
  - Add `_follow_redirect(title)` helper that calls the MediaWiki API with `&redirects=1` and returns the canonical title; call it before `_is_valid_title`.
- ⬆️ **Build and integrate redirect‑alias dictionary**
  - Download `enwiki-latest-redirect.sql.gz`, parse into `{alias → canonical}` map, store in SQLite or Redis.
  - Add pre‑search lookup: if `normalized_query` in dict, return canonical immediately and cache.
- ⬆️ **Add spelling & accent correction**
  - `pip install symspellpy rapidfuzz unidecode`.
  - Build SymSpell dictionary from redirect aliases + canonical titles (max_edit_distance=2).
  - In `_normalize_query`, run `sym_spell.lookup()`; replace query with closest suggestion when confidence ≥ 0.9.
  - Accent‑fold query and titles with `unidecode`.
- ⬆️ **Expand candidate pool & ranking**
  - For each strategy, fetch top 10 results (`max_results=10`, `limit=10`).
  - Implement `_rank_candidates(query, candidates)` that scores with `rapidfuzz.fuzz.token_set_ratio` and picks best ≥ 90.
- ⬆️ **Create golden‑set tests**
  - Add `tests/test_title_resolver.py`.
  - YAML file `tests/goldens.yaml` with ≥ 100 `{query: expected}` pairs covering typos, redirects, accents, parentheticals.
  - Pytest asserts ≥ 95 % pass; CI block on failure.
- ⬆️ **Parameterise cache settings**
  - Accept `cache_ttl` and `max_cache_size` via constructor env vars; update docs.

### [MEDIUM]
- Implement exponential back‑off and max‑retries for Wikipedia API (handle 429, 503).
- Strip common stop‑words (“wiki”, “definition”, “biography”) before search.
- Add structured JSON logging (`logger.info(json.dumps({...}))`) with `query_id`, `strategy`, `duration_ms`.
- Provide a config flag to enable/disable future vector‑search phase.

### [LOW]
- Document hardware & storage requirements for optional Faiss index (~12 GB vectors, ~8 GB index; 10 ms p99).
- Write script `tools/build_faiss_index.py` that:
  1. Loads titles + redirects,
  2. Encodes with `sentence_transformers` MiniLM,
  3. Builds `IndexHNSWFlat`,
  4. Dumps to `wiki.faiss` and `wiki_meta.pkl`.
- Add README section “Troubleshooting & FAQs”.
