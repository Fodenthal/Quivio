#!/usr/bin/env python3
"""
Wikipedia Ingestion Worker

Fetches Wikipedia articles, chunks them into 512-token segments with 64-token overlap,
generates embeddings using OpenAI's text-embedding-3-small, and stores them in the
Supabase wiki_chunks table with content hashing for idempotent writes.

Usage:
    python ingest_worker.py "Albert Einstein"
    python ingest_worker.py "Battle of Salamis"
    python ingest_worker.py "Einstein" --auto-resolve
    python ingest_worker.py "Jaguar" --auto-resolve --verbose
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

from background_tasks import get_task_manager, BackgroundTaskManager

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
        
        # Initialize background task manager
        self.task_manager = get_task_manager()
        
        # Store current title for background processing
        self._current_title = None
        
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
    
    def extract_lead_content(self, html_content: str) -> str:
        """
        Extract only the lead section (intro + first 2 paragraphs) from Wikipedia HTML
        
        This method is optimized for quick extraction of the most relevant content
        for trivia questions, limiting output to ≤512 tokens.
        
        Args:
            html_content: Raw HTML content from Wikipedia
            
        Returns:
            Clean lead section text (≤512 tokens)
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Find the main article body using same logic as full parser
            main_content = None
            
            # Try traditional Wikipedia structure first
            main_content = soup.find('div', class_='mw-parser-output')
            
            # If not found, try REST API structure
            if not main_content and soup.body and 'mw-parser-output' in soup.body.get('class', []):
                main_content = soup.body
            
            # Fallback to sections
            if not main_content:
                sections = soup.find_all('section')
                if sections:
                    main_section = max(sections, key=lambda s: len(s.get_text().strip()))
                    if len(main_section.get_text().strip()) > 1000:
                        main_content = main_section
            
            if not main_content:
                logger.warning("Could not find main article content for lead extraction")
                return ""
            
            # Extract only lead paragraphs (before first h2)
            lead_lines = []
            paragraphs = main_content.find_all('p')
            
            for p in paragraphs:
                # Stop if we hit an h2 heading (indicates end of lead section)
                preceding_h2 = p.find_previous_sibling(['h2'])
                if preceding_h2:
                    break
                
                # Skip if paragraph is in an infobox or metadata
                if p.find_parent(['table', 'div'], class_=lambda x: x and any(
                    cls in ' '.join(x).lower() for cls in ['infobox', 'metadata', 'navbox', 'hatnote']
                )):
                    continue
                
                text = p.get_text().strip()
                if text:
                    # Clean citation brackets and formatting
                    text = re.sub(r'\[\d+\]', '', text)  # Remove [17] citations
                    text = re.sub(r'\[note \d+\]', '', text)  # Remove [note 1] citations
                    text = re.sub(r'\[[^\]]*\]', '', text)  # Remove remaining brackets
                    text = re.sub(r'\s+', ' ', text).strip()
                    
                    if len(text) > 10:  # Only substantial text
                        lead_lines.append(text)
                        
                        # Stop after first 2 meaningful paragraphs
                        if len(lead_lines) >= 2:
                            break
            
            # Join and clean the lead content
            lead_text = ' '.join(lead_lines)
            lead_text = re.sub(r'\s+', ' ', lead_text).strip()
            
            # Limit to 512 tokens to ensure quick processing
            token_count = len(self.tokenizer.encode(lead_text))
            if token_count > 512:
                # Truncate to approximately 512 tokens
                tokens = self.tokenizer.encode(lead_text)[:512]
                lead_text = self.tokenizer.decode(tokens)
                logger.info(f"Truncated lead content from {token_count} to ~512 tokens")
            
            logger.info(f"Extracted lead content: {len(lead_text)} chars, ~{len(self.tokenizer.encode(lead_text))} tokens")
            return lead_text
            
        except Exception as e:
            logger.error(f"Error extracting lead content: {e}")
            return ""

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
    
    def ingest_article_lead_only(self, title: str, queue_background: bool = True) -> bool:
        """
        Lead-only ingestion workflow for quick Wikipedia article processing
        
        Extracts and ingests only the lead section (intro + first 2 paragraphs)
        optimized for sub-1s processing time. Optionally queues background task
        for full article ingestion.
        
        Args:
            title: Wikipedia article title
            queue_background: Whether to queue background full ingestion
            
        Returns:
            True if lead ingestion was successful
        """
        start_time = time.time()
        
        try:
            logger.info(f"🚀 Starting lead-only ingestion for article: {title}")
            
            # Step 1: Fetch article HTML
            html_content = self.fetch_wikipedia_article(title)
            if not html_content:
                logger.error(f"Failed to fetch HTML content for '{title}'")
                return False
            
            # Step 2: Extract lead content only
            lead_content = self.extract_lead_content(html_content)
            if not lead_content:
                logger.error(f"Failed to extract lead content for '{title}'")
                return False
            
            logger.info(f"Extracted {len(lead_content)} characters of lead content")
            
            # Step 3: Create single chunk from lead content (already ≤512 tokens)
            token_count = len(self.tokenizer.encode(lead_content))
            chunks = [(lead_content, None)]  # (content, section) tuple format
            
            logger.info(f"Created lead chunk with {token_count} tokens")
            
            # Step 4: Store lead chunk in database
            stored_count = self.store_chunks(title, chunks)
            
            elapsed_time = time.time() - start_time
            
            if stored_count > 0:
                logger.info(f"✅ Successfully ingested lead for '{title}': {stored_count} chunk in {elapsed_time:.1f}s")
                
                # Step 5: Queue background task for full ingestion if enabled
                if queue_background:
                    try:
                        # Store title for background processing
                        self._current_title = title
                        task_id = self.task_manager.queue_full_ingestion(title, self)
                        logger.info(f"🔄 Background full ingestion queued for '{title}' [Task ID: {task_id}]")
                    except Exception as bg_error:
                        logger.warning(f"Failed to queue background task for '{title}': {bg_error}")
                        # Don't fail the lead ingestion if background queuing fails
                
                return True
            else:
                logger.error(f"❌ Failed to store lead chunk for '{title}'")
                return False
                
        except Exception as e:
            logger.error(f"❌ Lead ingestion failed for '{title}': {e}")
            return False

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
    
    def ingest_article_background(self) -> bool:
        """
        Background ingestion method for full article processing
        
        This method is called by the background task manager to complete
        full article ingestion after lead-only processing has finished.
        
        Returns:
            True if background ingestion was successful
        """
        title = self._current_title
        if not title:
            logger.error("No title set for background ingestion")
            return False
        
        try:
            logger.info(f"🔄 Starting background full ingestion for: {title}")
            start_time = time.time()
            
            # Check if full ingestion already exists (maybe another process did it)
            result = self.supabase.table('wiki_chunks').select('id').eq('entity', title).limit(5).execute()
            if result.data and len(result.data) > 1:  # More than just the lead chunk
                logger.info(f"Full article already ingested for '{title}', skipping background task")
                return True
            
            # Fetch and process the full article
            html_content = self.fetch_wikipedia_article(title)
            if not html_content:
                logger.error(f"Failed to fetch HTML for background ingestion: {title}")
                return False
            
            # Convert to full text (not just lead)
            text_content = self.html_to_text(html_content)
            if not text_content.strip():
                logger.error(f"No text content extracted for background ingestion: {title}")
                return False
            
            # Chunk the full content
            chunks = self.chunk_text(text_content, title)
            if not chunks:
                logger.error(f"Failed to chunk text for background ingestion: {title}")
                return False
            
            # Store chunks (will skip duplicates due to content hashing)
            stored_count = self.store_chunks(title, chunks)
            
            elapsed_time = time.time() - start_time
            
            if stored_count >= 0:  # >= 0 because some chunks might be duplicates
                logger.info(f"✅ Background ingestion completed for '{title}': {stored_count} new chunks in {elapsed_time:.1f}s")
                return True
            else:
                logger.error(f"❌ Background ingestion failed for '{title}': no chunks stored")
                return False
                
        except Exception as e:
            logger.error(f"❌ Background ingestion failed for '{title}': {e}")
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

    def resolve_and_ingest(self, topic: str, lead_only: bool = False, queue_background: bool = True) -> bool:
        """
        Resolve a fuzzy topic to an exact Wikipedia title and ingest it
        
        Args:
            topic: Fuzzy topic query (e.g., "Einstein", "Jaguar")
            lead_only: Whether to ingest only the lead section
            queue_background: Whether to queue full ingestion in background (lead-only mode)
            
        Returns:
            True if ingestion was successful
        """
        try:
            logger.info(f"🔍 Resolving fuzzy topic: '{topic}'")
            
            # Import title resolution services
            try:
                from title_resolver import resolve_title
            except ImportError as e:
                logger.error(f"Title resolution services not available: {e}")
                logger.info("Falling back to manual title ingestion")
                return self._ingest_with_fallback(topic, lead_only, queue_background)
            
            # Attempt to resolve the topic to an exact title
            resolved_title = resolve_title(topic)
            
            if resolved_title:
                logger.info(f"✅ Resolved '{topic}' → '{resolved_title}'")
                
                # Check if resolved article already exists
                if self.check_article_exists(resolved_title):
                    logger.info(f"📚 Article '{resolved_title}' already exists in database")
                    return True
                
                # Ingest the resolved title
                if lead_only:
                    return self.ingest_article_lead_only(resolved_title, queue_background)
                else:
                    return self.ingest_article(resolved_title)
            else:
                logger.warning(f"❌ Could not resolve topic '{topic}' to a Wikipedia title")
                logger.info("Falling back to manual title ingestion")
                return self._ingest_with_fallback(topic, lead_only, queue_background)
                
        except Exception as e:
            logger.error(f"Error during title resolution for '{topic}': {e}")
            logger.info("Falling back to manual title ingestion")
            return self._ingest_with_fallback(topic, lead_only, queue_background)
    
    def _ingest_with_fallback(self, title: str, lead_only: bool, queue_background: bool) -> bool:
        """
        Fallback method for manual title ingestion when resolution fails
        
        Args:
            title: Title to ingest (may be fuzzy)
            lead_only: Whether to ingest only the lead section
            queue_background: Whether to queue full ingestion in background
            
        Returns:
            True if ingestion was successful
        """
        logger.info(f"🔄 Attempting manual ingestion of '{title}'")
        
        # Check if article already exists
        if self.check_article_exists(title):
            logger.info(f"📚 Article '{title}' already exists in database")
            return True
        
        # Attempt ingestion
        if lead_only:
            return self.ingest_article_lead_only(title, queue_background)
        else:
            return self.ingest_article(title)


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="Ingest Wikipedia articles into vector database")
    parser.add_argument("title", nargs='*', help="Wikipedia article title to ingest (use quotes for titles with spaces)")
    parser.add_argument("--force", action="store_true", help="Force re-ingestion even if article exists")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose logging")
    parser.add_argument("--lead-only", action="store_true", help="Extract and ingest only the lead section (intro + first 2 paragraphs, ≤512 tokens)")
    parser.add_argument("--show-tasks", action="store_true", help="Show background task status and exit")
    parser.add_argument("--no-background", action="store_true", help="Skip background task queuing (lead-only mode only)")
    parser.add_argument("--auto-resolve", action="store_true", help="Attempt to resolve fuzzy title to an exact Wikipedia title and ingest it")
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        # Initialize worker
        worker = WikipediaIngestionWorker()
        
        # Handle task status display
        if args.show_tasks:
            print("📊 Background Task Status:")
            stats = worker.task_manager.get_stats()
            print(f"Total tasks: {stats['total_tasks']}")
            print(f"Running: {stats['running']}, Pending: {stats['pending']}")
            print(f"Completed: {stats['completed']}, Failed: {stats['failed']}")
            
            if stats['total_tasks'] > 0:
                print("\nRecent tasks:")
                tasks = worker.task_manager.get_all_tasks()
                for task_id, task in list(tasks.items())[-5:]:  # Show last 5 tasks
                    status_emoji = {"pending": "⏳", "running": "🔄", "completed": "✅", "failed": "❌", "cancelled": "⛔"}
                    print(f"  {status_emoji.get(task.status.value, '❓')} {task.title} [{task.status.value}]")
            
            return 0
        
        # Validate title is provided for ingestion commands
        if not args.title:
            print("❌ Error: Article title is required for ingestion")
            print("Use --show-tasks to view background task status")
            return 1
        
        # Join the title parts back together
        title = ' '.join(args.title)
        
        # Check if article already exists (unless forcing)
        if not args.force and worker.check_article_exists(title):
            print(f"✅ Article '{title}' already ingested. Use --force to re-ingest.")
            return 0
        
        # Perform ingestion (lead-only or full article)
        if args.auto_resolve:
            success = worker.resolve_and_ingest(title, args.lead_only, not args.no_background)
            mode_description = "lead section" if args.lead_only else "full article"
            
            if success:
                print(f"✅ Successfully ingested Wikipedia {mode_description}: {title}")
                return 0
            else:
                print(f"❌ Failed to ingest Wikipedia {mode_description}: {title}")
                return 1
        else:
            if args.lead_only:
                queue_background = not args.no_background
                success = worker.ingest_article_lead_only(title, queue_background)
                mode_description = "lead section"
                
                if success and queue_background:
                    print("🔄 Background full ingestion has been queued")
                    print("   Use --show-tasks to monitor progress")
            else:
                success = worker.ingest_article(title)
                mode_description = "full article"
            
            if success:
                print(f"✅ Successfully ingested Wikipedia {mode_description}: {title}")
                return 0
            else:
                print(f"❌ Failed to ingest Wikipedia {mode_description}: {title}")
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