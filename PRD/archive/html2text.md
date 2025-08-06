Objective
Our WikipediaIngestionWorker is ingesting messy “table soup” (e.g., lines like Born | 14 March 1879). We need the chunks saved to wiki_chunks to be clean narrative prose that an LLM can actually use.

High‑level approach (tell me what you think)
Use BeautifulSoup in html_to_text() (it’s in apps/rag-service/ingestion_worker.py).

Grab only the main article body: div.mw-parser-output.

Iterate over its direct children:

Keep <p> paragraphs and (optionally) <h2>/<h3> section headings as plain text cues.

Skip <table>, <infobox>, lists, and anything after “References” / “External links”.

Strip citation brackets like [17] with a regex.

Collapse all whitespace to single spaces and join.

Add the dependency beautifulsoup4 to our requirements.

Unit / smoke tests to prove it works:

Fixture: raw HTML for “Albert Einstein”.

Assert that the cleaned text contains no pipe characters (|) and no \[number] citations, and still has > 50 words.

Quick manual ingest:

bash
Copy
Edit
python ingest_worker.py "Albert Einstein" --force -v
psql -c "select left(content,150) from wiki_chunks where entity='Albert Einstein' limit 3;"
Visually confirm it’s clean prose.

Extras (nice‑to‑have, not required right now)
Sentence‑aware chunking so we never split mid‑sentence.

Use the actual section heading text as the section column instead of part_1.

Simple retry/back‑off when the embeddings endpoint 429s.

What do you think of this plan? Any edge cases you’d tackle differently before you dive into the code?