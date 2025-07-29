"""
Title Resolution Service

Provides a unified, production-ready service for converting fuzzy user queries 
into exact Wikipedia article titles. Orchestrates the complete workflow of 
search → disambiguation → resolution with comprehensive error handling.

Usage:
    from title_resolver import resolve_title
    title = resolve_title("Einstein")
    # Returns: "Albert Einstein"
    
    title = resolve_title("Mercury") 
    # Returns: "Mercury (planet)"
"""

import logging
import time
from typing import Dict, List, Optional, Tuple
import re

from wikipedia_search import find_best_match, search_wikipedia_titles, WikipediaSearchError
from disambiguation import resolve_disambiguation_if_needed, DisambiguationError

logger = logging.getLogger(__name__)


class TitleResolutionError(Exception):
    """Custom exception for title resolution failures"""
    pass


class TitleResolver:
    """
    Comprehensive service for resolving fuzzy queries to exact Wikipedia titles
    """
    
    def __init__(self, enable_caching: bool = True):
        """
        Initialize the title resolver
        
        Args:
            enable_caching: Whether to enable in-memory caching of results
        """
        self.enable_caching = enable_caching
        self._cache: Dict[str, Tuple[Optional[str], float]] = {}  # query -> (result, timestamp)
        self.cache_ttl = 3600  # 1 hour cache TTL
        self.max_cache_size = 1000
        
        logger.info("Title resolver initialized with caching %s", 
                   "enabled" if enable_caching else "disabled")
    
    def resolve_title(self, query: str, max_attempts: int = 3) -> Optional[str]:
        """
        Resolve a fuzzy query to an exact Wikipedia article title
        
        Args:
            query: User's search query (can be fuzzy)
            max_attempts: Maximum resolution attempts with different strategies
            
        Returns:
            Exact Wikipedia article title, or None if resolution failed
        """
        result = self.resolve_title_with_metadata(query, max_attempts)
        return result.get('resolved_title')
    
    def resolve_title_with_metadata(self, query: str, max_attempts: int = 3) -> Dict:
        """
        Resolve a title and return comprehensive metadata about the resolution process
        
        Args:
            query: User's search query
            max_attempts: Maximum resolution attempts
            
        Returns:
            Dictionary with keys: resolved_title, strategy_used, attempts, 
            search_results, disambiguation_applied, error_message, duration_ms
        """
        start_time = time.time()
        
        # Initialize metadata
        metadata = {
            'resolved_title': None,
            'original_query': query,
            'normalized_query': None,
            'strategy_used': None,
            'attempts': 0,
            'search_results': [],
            'disambiguation_applied': False,
            'error_message': None,
            'duration_ms': 0,
            'from_cache': False
        }
        
        try:
            # Step 1: Input validation and normalization
            normalized_query = self._normalize_query(query)
            metadata['normalized_query'] = normalized_query
            
            if not normalized_query:
                metadata['error_message'] = "Empty or invalid query after normalization"
                return metadata
            
            # Step 2: Check cache
            if self.enable_caching:
                cached_result = self._get_from_cache(normalized_query)
                if cached_result is not None:
                    metadata['resolved_title'] = cached_result
                    metadata['from_cache'] = True
                    metadata['strategy_used'] = 'cache_hit'
                    logger.info(f"Cache hit for query '{normalized_query}' → '{cached_result}'")
                    return metadata
            
            # Step 3: Attempt resolution with multiple strategies
            strategies = [
                ('primary_with_disambiguation', self._resolve_primary_with_disambiguation),
                ('primary_without_disambiguation', self._resolve_primary_without_disambiguation),
                ('direct_title_search', self._resolve_direct_title_search),
                ('fuzzy_fallback', self._resolve_fuzzy_fallback)
            ]
            
            for attempt, (strategy_name, strategy_func) in enumerate(strategies, 1):
                if attempt > max_attempts:
                    break
                
                metadata['attempts'] = attempt
                
                try:
                    logger.info(f"Attempt {attempt}: Using strategy '{strategy_name}' for query '{normalized_query}'")
                    
                    result = strategy_func(normalized_query, metadata)
                    
                    if result:
                        metadata['resolved_title'] = result
                        metadata['strategy_used'] = strategy_name
                        
                        # Cache successful result
                        if self.enable_caching:
                            self._add_to_cache(normalized_query, result)
                        
                        logger.info(f"✅ Successfully resolved '{normalized_query}' → '{result}' using '{strategy_name}'")
                        break
                        
                except Exception as e:
                    logger.warning(f"Strategy '{strategy_name}' failed for '{normalized_query}': {e}")
                    continue
            
            if not metadata['resolved_title']:
                metadata['error_message'] = f"All resolution strategies failed after {metadata['attempts']} attempts"
                logger.error(f"❌ Failed to resolve '{normalized_query}' after {metadata['attempts']} attempts")
        
        except Exception as e:
            metadata['error_message'] = str(e)
            logger.error(f"❌ Unexpected error resolving '{query}': {e}")
        
        finally:
            metadata['duration_ms'] = int((time.time() - start_time) * 1000)
        
        return metadata
    
    def batch_resolve_titles(self, queries: List[str], max_workers: int = 3) -> Dict[str, Optional[str]]:
        """
        Resolve multiple titles in batch with rate limiting
        
        Args:
            queries: List of queries to resolve
            max_workers: Maximum concurrent resolutions (respects rate limits)
            
        Returns:
            Dictionary mapping queries to resolved titles (or None if failed)
        """
        results = {}
        
        logger.info(f"Starting batch resolution for {len(queries)} queries")
        
        for i, query in enumerate(queries, 1):
            try:
                # Rate limiting: small delay between requests
                if i > 1:
                    time.sleep(0.2)  # 200ms between queries
                
                resolved = self.resolve_title(query)
                results[query] = resolved
                
                if resolved:
                    logger.info(f"Batch {i}/{len(queries)}: '{query}' → '{resolved}'")
                else:
                    logger.warning(f"Batch {i}/{len(queries)}: '{query}' → FAILED")
                    
            except Exception as e:
                logger.error(f"Batch {i}/{len(queries)}: Error resolving '{query}': {e}")
                results[query] = None
        
        success_count = sum(1 for r in results.values() if r is not None)
        logger.info(f"Batch resolution completed: {success_count}/{len(queries)} successful")
        
        return results
    
    def _normalize_query(self, query: str) -> Optional[str]:
        """
        Normalize and validate the input query
        
        Args:
            query: Raw user query
            
        Returns:
            Normalized query string, or None if invalid
        """
        if not query or not isinstance(query, str):
            return None
        
        # Basic normalization
        normalized = query.strip()
        
        # Remove excessive whitespace
        normalized = re.sub(r'\s+', ' ', normalized)
        
        # Basic validation
        if not normalized or len(normalized) < 1:
            return None
        
        if len(normalized) > 200:  # Reasonable limit
            logger.warning(f"Query too long ({len(normalized)} chars), truncating: '{normalized[:50]}...'")
            normalized = normalized[:200]
        
        # Remove/replace problematic characters
        normalized = re.sub(r'[<>"|*?\\]', '', normalized)
        
        return normalized
    
    def _resolve_primary_with_disambiguation(self, query: str, metadata: Dict) -> Optional[str]:
        """
        Primary resolution strategy: use find_best_match with disambiguation enabled
        """
        try:
            result = find_best_match(query, max_results=5, resolve_disambiguation=True)
            if result and result.get('title'):
                title = result['title']
                metadata['search_results'].append(result)
                metadata['disambiguation_applied'] = True
                
                # Validate the result
                if self._is_valid_title(title):
                    return title
                else:
                    logger.warning(f"Invalid title returned: '{title}'")
                    return None
                    
        except Exception as e:
            logger.error(f"Primary with disambiguation failed: {e}")
            raise
        
        return None
    
    def _resolve_primary_without_disambiguation(self, query: str, metadata: Dict) -> Optional[str]:
        """
        Secondary strategy: use find_best_match without disambiguation
        """
        try:
            result = find_best_match(query, max_results=5, resolve_disambiguation=False)
            if result and result.get('title'):
                title = result['title']
                metadata['search_results'].append(result)
                
                if self._is_valid_title(title):
                    return title
                    
        except Exception as e:
            logger.error(f"Primary without disambiguation failed: {e}")
            raise
        
        return None
    
    def _resolve_direct_title_search(self, query: str, metadata: Dict) -> Optional[str]:
        """
        Tertiary strategy: direct search for exact title matches
        """
        try:
            # Try the query as-is as a direct title
            results = search_wikipedia_titles(query, limit=3)
            
            if results:
                metadata['search_results'].extend(results)
                
                # Look for exact matches first
                for result in results:
                    if result['title'].lower() == query.lower():
                        if self._is_valid_title(result['title']):
                            return result['title']
                
                # If no exact match, try the first result
                first_result = results[0]
                if self._is_valid_title(first_result['title']):
                    return first_result['title']
                    
        except Exception as e:
            logger.error(f"Direct title search failed: {e}")
            raise
        
        return None
    
    def _resolve_fuzzy_fallback(self, query: str, metadata: Dict) -> Optional[str]:
        """
        Final fallback strategy: fuzzy matching with broader search
        """
        try:
            # Try variations of the query
            variations = [
                query.title(),  # Title case
                query.lower(),  # Lowercase
                query.upper(),  # Uppercase (for acronyms)
            ]
            
            # Try each variation
            for variation in variations:
                if variation == query:
                    continue  # Skip if same as original
                
                try:
                    results = search_wikipedia_titles(variation, limit=3)
                    if results:
                        metadata['search_results'].extend(results)
                        
                        first_result = results[0]
                        if self._is_valid_title(first_result['title']):
                            logger.info(f"Fuzzy fallback succeeded with variation: '{variation}'")
                            return first_result['title']
                            
                except Exception:
                    continue  # Try next variation
                    
        except Exception as e:
            logger.error(f"Fuzzy fallback failed: {e}")
            raise
        
        return None
    
    def _is_valid_title(self, title: str) -> bool:
        """
        Validate that a title refers to a real, substantial Wikipedia article
        
        Args:
            title: Wikipedia article title to validate
            
        Returns:
            True if the title is valid for ingestion
        """
        if not title or not isinstance(title, str):
            return False
        
        title_lower = title.lower()
        
        # Skip meta pages and redirects
        invalid_indicators = [
            'wikipedia:',
            'category:',
            'template:',
            'help:',
            'portal:',
            'user:',
            'talk:',
            'file:',
            'media:',
            'special:',
            'redirect to',
            'see also',
            'disambiguation',
            'list of lists'
        ]
        
        if any(indicator in title_lower for indicator in invalid_indicators):
            logger.debug(f"Rejecting meta/redirect page: '{title}'")
            return False
        
        # Title should be reasonable length
        if len(title) < 2 or len(title) > 200:
            logger.debug(f"Rejecting title with invalid length: '{title}'")
            return False
        
        return True
    
    def _get_from_cache(self, query: str) -> Optional[str]:
        """Get result from cache if available and not expired"""
        if not self.enable_caching or query not in self._cache:
            return None
        
        result, timestamp = self._cache[query]
        
        # Check if expired
        if time.time() - timestamp > self.cache_ttl:
            del self._cache[query]
            return None
        
        return result
    
    def _add_to_cache(self, query: str, result: Optional[str]) -> None:
        """Add result to cache with size management"""
        if not self.enable_caching:
            return
        
        # Manage cache size
        if len(self._cache) >= self.max_cache_size:
            # Remove oldest entries (simple FIFO)
            oldest_keys = list(self._cache.keys())[:100]  # Remove oldest 100
            for key in oldest_keys:
                del self._cache[key]
        
        self._cache[query] = (result, time.time())
    
    def clear_cache(self) -> int:
        """Clear the resolution cache and return number of entries cleared"""
        count = len(self._cache)
        self._cache.clear()
        logger.info(f"Cleared {count} entries from resolution cache")
        return count
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics for monitoring"""
        return {
            'enabled': self.enable_caching,
            'size': len(self._cache),
            'max_size': self.max_cache_size,
            'ttl_seconds': self.cache_ttl
        }


# Global resolver instance
_resolver: Optional[TitleResolver] = None

def get_resolver() -> TitleResolver:
    """Get or create the global title resolver instance"""
    global _resolver
    if _resolver is None:
        _resolver = TitleResolver()
    return _resolver


def resolve_title(query: str, max_attempts: int = 3) -> Optional[str]:
    """
    Convenience function to resolve a single title
    
    Args:
        query: User's search query
        max_attempts: Maximum resolution attempts
        
    Returns:
        Exact Wikipedia article title, or None if resolution failed
    """
    resolver = get_resolver()
    return resolver.resolve_title(query, max_attempts)


def resolve_title_with_metadata(query: str, max_attempts: int = 3) -> Dict:
    """
    Convenience function to resolve a title with full metadata
    
    Args:
        query: User's search query
        max_attempts: Maximum resolution attempts
        
    Returns:
        Dictionary with resolution metadata
    """
    resolver = get_resolver()
    return resolver.resolve_title_with_metadata(query, max_attempts)


def batch_resolve_titles(queries: List[str]) -> Dict[str, Optional[str]]:
    """
    Convenience function for batch title resolution
    
    Args:
        queries: List of queries to resolve
        
    Returns:
        Dictionary mapping queries to resolved titles
    """
    resolver = get_resolver()
    return resolver.batch_resolve_titles(queries)


if __name__ == "__main__":
    # Simple test when run directly
    import sys
    
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        
        print(f"🔍 Resolving: '{query}'")
        
        # Get detailed metadata
        result = resolve_title_with_metadata(query)
        
        print(f"✅ Result: {result['resolved_title']}")
        print(f"📊 Strategy: {result['strategy_used']}")
        print(f"⏱️  Duration: {result['duration_ms']}ms")
        print(f"🔄 Attempts: {result['attempts']}")
        print(f"🧠 From cache: {result['from_cache']}")
        
        if result['disambiguation_applied']:
            print("🔀 Disambiguation was applied")
        
        if result['error_message']:
            print(f"❌ Error: {result['error_message']}")
            
    else:
        print("Usage: python title_resolver.py <query>")
        print("Example: python title_resolver.py Einstein") 