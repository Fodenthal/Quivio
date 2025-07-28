# Wikipedia Ingestion Worker

The Wikipedia ingestion worker fetches Wikipedia articles, chunks them into 512-token segments with 64-token overlap, generates embeddings using OpenAI's `text-embedding-3-small`, and stores them in the Supabase `wiki_chunks` table.

## Prerequisites

1. **Environment Variables**: Set up the following environment variables in your `.env` file:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Database Setup**: Ensure the `wiki_chunks` table exists in your Supabase database:
   ```sql
   CREATE TABLE wiki_chunks (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     entity text NOT NULL,
     section text,
     content text NOT NULL,
     embedding vector(1536) NOT NULL,
     content_hash text UNIQUE NOT NULL,
     updated_at timestamptz DEFAULT now()
   );
   
   CREATE INDEX wiki_chunks_embedding_hnsw ON wiki_chunks 
   USING hnsw (embedding vector_cosine_ops);
   ```

## Usage

### Basic Usage
```bash
# Ingest a single Wikipedia article (use quotes for titles with spaces)
python ingest_worker.py "Albert Einstein"

# Ingest with verbose logging
python ingest_worker.py "Battle of Salamis" --verbose

# Force re-ingestion even if article exists
python ingest_worker.py "World War II" --force

# Single word titles don't need quotes
python ingest_worker.py Einstein
```

### Command Line Options
- `title`: Wikipedia article title to ingest (required)
- `--force`: Force re-ingestion even if article already exists
- `--verbose, -v`: Enable verbose logging for debugging

## How It Works

1. **Fetch**: Downloads Wikipedia article HTML using the Wikipedia REST API
2. **Parse**: Converts HTML to clean text using `html2text`
3. **Chunk**: Splits text into 512-token segments with 64-token overlap using `tiktoken`
4. **Embed**: Generates embeddings using OpenAI's `text-embedding-3-small` model
5. **Store**: Saves chunks with embeddings to Supabase using content hashing for idempotent writes

## Features

- **Idempotent**: Uses content hashing to avoid duplicate ingestion
- **Efficient**: Batches embedding requests (up to 2K tokens per request)
- **Robust**: Handles network errors and API rate limits gracefully
- **Cost-Optimized**: Uses smaller embedding model and batching for cost efficiency

## Error Handling

The worker handles various error scenarios:
- Wikipedia article not found (404)
- Network timeouts and connection errors
- OpenAI API rate limits
- Supabase database errors
- Version compatibility issues

## Testing

The core functionality has been tested and verified:
- ✅ Wikipedia API fetching
- ✅ HTML to text conversion
- ✅ Text chunking with token counting
- ✅ Content hashing for idempotency

## Performance

- **Chunking**: 512 tokens per chunk with 64-token overlap
- **Embedding**: Up to 2K tokens per batch request
- **Rate Limiting**: 1-second delays between batches
- **Storage**: Efficient upsert operations with conflict resolution 