#!/usr/bin/env python3
"""
Wikipedia Ingestion Worker

Fetches Wikipedia articles, chunks them into 512-token segments with 64-token overlap,
generates embeddings using OpenAI's text-embedding-3-small, and stores them in the
Supabase wiki_chunks table with content hashing for idempotent writes.

Usage:
    python ingest_worker.py "Albert Einstein"
    python ingest_worker.py "Battle of Salamis"
"""

import argparse
import hashlib
import logging
import os
import re
import sys
import time
from typing import List, Optional, Tuple

import requests
import tiktoken
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ingest-worker")

class WikipediaIngestionWorker:
    """
    Worker class for ingesting Wikipedia articles into the vector database
    """
    
    def __init__(self):
        """Initialize the ingestion worker with OpenAI and Supabase clients"""
        # Load environment variables
        load_dotenv()
        
        # Initialize OpenAI client for embeddings
        openai_api_key = os.getenv('OPENAI_API_KEY')
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.openai_client = OpenAI(api_key=openai_api_key)
        
        # Initialize Supabase client
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
        
        try:
            self.supabase: Client = create_client(supabase_url, supabase_key)
        except TypeError as e:
            if "proxy" in str(e):
                raise ValueError(f"Supabase client initialization failed due to version compatibility issue: {e}")
            else:
                raise
        
        # Initialize tokenizer for precise token counting
        self.tokenizer = tiktoken.get_encoding("cl100k_base")  # Used by text-embedding-3-small
        
        # Configuration
        self.chunk_size = 512  # tokens
        self.chunk_overlap = 64  # tokens
        self.max_batch_tokens = 2000  # Max tokens per embedding batch request
        
        logger.info("Wikipedia ingestion worker initialized successfully")
    
    def fetch_wikipedia_article(self, title: str) -> Optional[str]:
        """
        Fetch a Wikipedia article's content using the Wikipedia REST API
        
        Args:
            title: Wikipedia article title
            
        Returns:
            Raw HTML content of the article, or None if not found
        """
        try:
            # Use Wikipedia REST API v1 for better reliability
            url = f"https://en.wikipedia.org/api/rest_v1/page/html/{title.replace(' ', '_')}"
            
            headers = {
                'User-Agent': 'Quivio-RAG-Service/1.0 (https://github.com/quivio/rag-service)'
            }
            
            logger.info(f"Fetching Wikipedia article: {title}")
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                logger.info(f"Successfully fetched article: {title} ({len(response.text)} chars)")
                return response.text
            elif response.status_code == 404:
                logger.warning(f"Wikipedia article not found: {title}")
                return None
            else:
                logger.error(f"Failed to fetch article {title}: HTTP {response.status_code}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Network error fetching article {title}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching article {title}: {e}")
            return None
    
    def html_to_text(self, html_content: str) -> str:
        """
        Convert HTML content to clean narrative prose using BeautifulSoup
        
        Extracts only the main article body, skips tables/infoboxes, and cleans citations.
        Handles both traditional Wikipedia HTML and REST API structure.
        
        Args:
            html_content: Raw HTML content
            
        Returns:
            Clean narrative text content
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Find the main article body - try different selectors
            main_content = None
            
            # Try traditional Wikipedia structure first
            main_content = soup.find('div', class_='mw-parser-output')
            
            # If not found, try REST API structure (body with mw-parser-output class)
            if not main_content and soup.body and 'mw-parser-output' in soup.body.get('class', []):
                main_content = soup.body
            
            # If still not found, try looking for sections directly
            if not main_content:
                # Look for the main content section (usually the first substantial section)
                sections = soup.find_all('section')
                if sections:
                    # Find the section with the most text content (likely the main article)
                    main_section = max(sections, key=lambda s: len(s.get_text().strip()))
                    if len(main_section.get_text().strip()) > 1000:  # Must have substantial content
                        main_content = main_section
            
            if not main_content:
                logger.warning("Could not find main article content")
                return ""
            
            # Collect clean text from paragraphs and headings
            clean_lines = []
            
            # Define elements to process
            content_elements = main_content.find_all(['p', 'h1', 'h2', 'h3', 'h4'])
            
            for element in content_elements:
                # Stop at references/external links
                if element.name in ['h2', 'h3'] and element.get_text().strip().lower() in [
                    'references', 'external links', 'see also', 'notes', 'citations'
                ]:
                    break
                
                # Skip elements with specific classes that contain metadata
                if element.get('class'):
                    classes = ' '.join(element.get('class')).lower()
                    if any(skip_class in classes for skip_class in [
                        'infobox', 'metadata', 'navbox', 'reflist', 'catlinks', 'ambox',
                        'shortdescription', 'hatnote', 'navigation-not-searchable'
                    ]):
                        continue
                
                text = element.get_text().strip()
                if text:
                    # Clean citation brackets like [17] or [note 1]
                    text = re.sub(r'\[\d+\]', '', text)  # Remove [17] style citations
                    text = re.sub(r'\[note \d+\]', '', text)  # Remove [note 1] style citations
                    text = re.sub(r'\[[^\]]*\]', '', text)  # Remove any remaining brackets
                    
                    # Clean up whitespace
                    text = re.sub(r'\s+', ' ', text).strip()
                    
                    if text and len(text) > 10:  # Only keep substantial text
                        clean_lines.append(text)
            
            # Join lines with proper spacing
            clean_text = ' '.join(clean_lines)
            
            # Final cleanup
            clean_text = re.sub(r'\s+', ' ', clean_text).strip()
            
            logger.debug(f"Converted HTML to clean text: {len(clean_text)} characters")
            return clean_text
            
        except Exception as e:
            logger.error(f"Error converting HTML to text: {e}")
            return ""
    
    def chunk_text(self, text: str, title: str) -> List[Tuple[str, Optional[str]]]:
        """
        Chunk text into overlapping segments of specified token size
        
        Args:
            text: Text content to chunk
            title: Article title for context
            
        Returns:
            List of (chunk_content, section) tuples
        """
        try:
            # Tokenize the entire text
            tokens = self.tokenizer.encode(text)
            chunks = []
            
            if len(tokens) <= self.chunk_size:
                # Text is small enough to be a single chunk
                chunks.append((text, None))
                logger.info(f"Article '{title}' fits in single chunk: {len(tokens)} tokens")
                return chunks
            
            # Create overlapping chunks
            start = 0
            chunk_num = 1
            
            while start < len(tokens):
                # Define chunk boundaries
                end = min(start + self.chunk_size, len(tokens))
                chunk_tokens = tokens[start:end]
                
                # Decode tokens back to text
                chunk_text = self.tokenizer.decode(chunk_tokens)
                
                # Add chunk with section information
                section = f"part_{chunk_num}" if len(tokens) > self.chunk_size else None
                chunks.append((chunk_text.strip(), section))
                
                logger.debug(f"Created chunk {chunk_num}: {len(chunk_tokens)} tokens")
                
                # Move to next chunk with overlap
                if end >= len(tokens):
                    break
                    
                start = end - self.chunk_overlap
                chunk_num += 1
            
            logger.info(f"Article '{title}' chunked into {len(chunks)} segments")
            return chunks
            
        except Exception as e:
            logger.error(f"Error chunking text for '{title}': {e}")
            return [(text, None)]  # Return original text as fallback
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a batch of texts
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors
        """
        try:
            # Check total token count for the batch
            total_tokens = sum(len(self.tokenizer.encode(text)) for text in texts)
            
            if total_tokens > self.max_batch_tokens:
                logger.warning(f"Batch too large ({total_tokens} tokens), processing individually")
                # Process individually if batch is too large
                embeddings = []
                for text in texts:
                    response = self.openai_client.embeddings.create(
                        model="text-embedding-3-small",
                        input=text,
                        encoding_format="float"
                    )
                    embeddings.append(response.data[0].embedding)
                    time.sleep(0.1)  # Rate limiting
                return embeddings
            
            # Process as batch
            logger.debug(f"Generating embeddings for batch of {len(texts)} texts ({total_tokens} tokens)")
            
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=texts,
                encoding_format="float"
            )
            
            embeddings = [item.embedding for item in response.data]
            logger.info(f"Generated {len(embeddings)} embeddings successfully")
            return embeddings
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise
    
    def store_chunks(self, title: str, chunks: List[Tuple[str, Optional[str]]]) -> int:
        """
        Store chunks with embeddings in the database
        
        Args:
            title: Article title
            chunks: List of (content, section) tuples
            
        Returns:
            Number of chunks successfully stored
        """
        try:
            stored_count = 0
            batch_size = 5  # Process in small batches to avoid timeouts
            
            for i in range(0, len(chunks), batch_size):
                batch_chunks = chunks[i:i + batch_size]
                batch_texts = [chunk[0] for chunk in batch_chunks]
                
                logger.info(f"Processing batch {i//batch_size + 1}: {len(batch_chunks)} chunks")
                
                # Generate embeddings for this batch
                embeddings = self.generate_embeddings_batch(batch_texts)
                
                # Store each chunk with its embedding
                for (content, section), embedding in zip(batch_chunks, embeddings):
                    try:
                        # Generate content hash for idempotent writes
                        content_hash = hashlib.sha256(content.encode()).hexdigest()
                        
                        # Prepare data for insertion
                        chunk_data = {
                            'entity': title,
                            'section': section,
                            'content': content,
                            'embedding': embedding,
                            'content_hash': content_hash
                        }
                        
                        # Insert with conflict resolution (idempotent)
                        result = self.supabase.table('wiki_chunks').upsert(
                            chunk_data,
                            on_conflict='content_hash'
                        ).execute()
                        
                        if result.data:
                            stored_count += 1
                            logger.debug(f"Stored chunk: {content_hash[:8]}...")
                        
                    except Exception as chunk_error:
                        logger.error(f"Error storing individual chunk: {chunk_error}")
                        continue
                
                # Rate limiting between batches
                time.sleep(1)
            
            logger.info(f"Successfully stored {stored_count}/{len(chunks)} chunks for '{title}'")
            return stored_count
            
        except Exception as e:
            logger.error(f"Error storing chunks for '{title}': {e}")
            return 0
    
    def ingest_article(self, title: str) -> bool:
        """
        Complete ingestion pipeline for a Wikipedia article
        
        Args:
            title: Wikipedia article title
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Starting ingestion for article: {title}")
            start_time = time.time()
            
            # Step 1: Fetch article HTML
            html_content = self.fetch_wikipedia_article(title)
            if not html_content:
                logger.error(f"Failed to fetch article: {title}")
                return False
            
            # Step 2: Convert HTML to text
            text_content = self.html_to_text(html_content)
            if not text_content.strip():
                logger.error(f"No text content extracted from article: {title}")
                return False
            
            # Step 3: Chunk the text
            chunks = self.chunk_text(text_content, title)
            if not chunks:
                logger.error(f"No chunks created for article: {title}")
                return False
            
            # Step 4: Store chunks with embeddings
            stored_count = self.store_chunks(title, chunks)
            
            elapsed_time = time.time() - start_time
            
            if stored_count > 0:
                logger.info(f"✅ Successfully ingested '{title}': {stored_count} chunks in {elapsed_time:.1f}s")
                return True
            else:
                logger.error(f"❌ Failed to store any chunks for '{title}'")
                return False
                
        except Exception as e:
            logger.error(f"❌ Ingestion failed for '{title}': {e}")
            return False
    
    def check_article_exists(self, title: str) -> bool:
        """
        Check if an article has already been ingested
        
        Args:
            title: Article title to check
            
        Returns:
            True if article exists in database
        """
        try:
            result = self.supabase.table('wiki_chunks').select('id').eq('entity', title).limit(1).execute()
            exists = bool(result.data)
            
            if exists:
                logger.info(f"Article '{title}' already exists in database")
            else:
                logger.info(f"Article '{title}' not found in database")
                
            return exists
            
        except Exception as e:
            logger.error(f"Error checking if article exists: {e}")
            return False


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="Ingest Wikipedia articles into vector database")
    parser.add_argument("title", nargs='+', help="Wikipedia article title to ingest (use quotes for titles with spaces)")
    parser.add_argument("--force", action="store_true", help="Force re-ingestion even if article exists")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Join the title parts back together
    title = ' '.join(args.title)
    
    try:
        # Initialize worker
        worker = WikipediaIngestionWorker()
        
        # Check if article already exists (unless forcing)
        if not args.force and worker.check_article_exists(title):
            print(f"✅ Article '{title}' already ingested. Use --force to re-ingest.")
            return 0
        
        # Perform ingestion
        success = worker.ingest_article(title)
        
        if success:
            print(f"✅ Successfully ingested Wikipedia article: {title}")
            return 0
        else:
            print(f"❌ Failed to ingest Wikipedia article: {title}")
            return 1
            
    except KeyboardInterrupt:
        print("\n⚠️ Ingestion interrupted by user")
        return 1
    except Exception as e:
        print(f"❌ Ingestion failed: {e}")
        logger.exception("Unexpected error during ingestion")
        return 1


if __name__ == "__main__":
    sys.exit(main()) 