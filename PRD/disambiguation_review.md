# Disambiguation Module Review  

## Strengths  

| Area | Why it’s good |  
|------|---------------|  
| **Network hygiene** | Custom User‑Agent and 30 s timeout on API calls |  
| **Pluggable scoring** | All heuristics live in one place; easy to tune |  
| **Meta‑page filtering** | `_is_meta_page()` prevents “List of…” links from leaking through |  
| **Docstrings & typing** | Clear enough for teammates to follow |  

## Issues & Quick Wins  

| Priority | Concern | Suggestion |  
|----------|---------|------------|  
| **🔥 High** | No recursion guard – nested dab pages might loop | Add `max_depth` (e.g. 2) inside `resolve_disambiguation_if_needed` |  
| **🔥 High** | No HTTP retry/back‑off | Wrap `_fetch_page_content` with exponential‑backoff retry (≤3 attempts) |  
| **Medium** | Bullet‑list regex too strict | Replace with `r'^\*\s+\[\[.*?\]\]'` |  
| **Medium** | Scorer common‑indicator list narrow | Move list to constant and expand (musician, city, etc.) |  
| **Medium** | Returns bare strings only | Return a tiny dataclass `DisambResult` with description & score |  
| **Low** | Synchronous `requests` client | Offer async wrapper with `httpx.AsyncClient` |  
| **Low** | No caching | Add `functools.lru_cache` or TTL memo |  
