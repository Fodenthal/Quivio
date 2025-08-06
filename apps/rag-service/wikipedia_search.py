"""
Wikipedia Search API Client

Provides fuzzy search capabilities for Wikipedia article titles using the MediaWiki API.
Handles network failures, rate limiting, and response parsing for reliable title resolution.

Usage:
    from wikipedia_search import search_wikipedia_titles
    results = search_wikipedia_titles("Einstein")
    # Returns: [{"title": "Albert Einstein", "snippet": "...", "wordcount": 12543}, ...]
"""

import json
import logging
import time
from typing import Dict, List, Optional
from urllib.parse import quote_plus

import requests

logger = logging.getLogger(__name__)


class WikipediaSearchError(Exception):
    """Custom exception for Wikipedia search failures"""
    pass


class MediaWikiSearchClient:
    """
    Client for querying Wikipedia's MediaWiki Search API
    """
    
    def __init__(self, base_url: str = "https://en.wikipedia.org/w/api.php"):
        """
        Initialize the MediaWiki search client
        
        Args:
            base_url: Base URL for the MediaWiki API (defaults to English Wikipedia)
        """
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Quivio-RAG-Service/1.0 (https://github.com/quivio/rag-service)'
        })
        self.last_request_time = 0.0
        self.rate_limit_delay = 0.1  # 100ms between requests
        
        logger.info(f"MediaWiki search client initialized for {base_url}")
    
    def _enforce_rate_limit(self) -> None:
        """Enforce rate limiting between API requests"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit_delay:
            sleep_time = self.rate_limit_delay - elapsed
            logger.debug(f"Rate limiting: sleeping {sleep_time:.3f}s")
            time.sleep(sleep_time)
    
    def _make_request(self, params: Dict[str, str], timeout: int = 30) -> Dict:
        """
        Make a request to the MediaWiki API with error handling
        
        Args:
            params: API parameters
            timeout: Request timeout in seconds
            
        Returns:
            Parsed JSON response
            
        Raises:
            WikipediaSearchError: For network or API errors
        """
        self._enforce_rate_limit()
        
        try:
            logger.debug(f"Making MediaWiki API request: {params}")
            response = self.session.get(
                self.base_url,
                params=params,
                timeout=timeout
            )
            self.last_request_time = time.time()
            
            response.raise_for_status()
            
            try:
                data = response.json()
            except json.JSONDecodeError as e:
                raise WikipediaSearchError(f"Invalid JSON response: {e}")
            
            # Check for API errors
            if 'error' in data:
                error_info = data['error']
                raise WikipediaSearchError(f"MediaWiki API error: {error_info.get('info', 'Unknown error')}")
            
            logger.debug(f"API request successful: {response.status_code}")
            return data
            
        except requests.exceptions.Timeout:
            raise WikipediaSearchError(f"Request timeout after {timeout}s")
        except requests.exceptions.ConnectionError as e:
            raise WikipediaSearchError(f"Connection error: {e}")
        except requests.exceptions.HTTPError as e:
            raise WikipediaSearchError(f"HTTP error: {e}")
        except requests.exceptions.RequestException as e:
            raise WikipediaSearchError(f"Request failed: {e}")
    
    def follow_redirect(self, title: str) -> Optional[str]:
        """
        Follow Wikipedia redirects to get the canonical title
        
        Args:
            title: Wikipedia article title that might be a redirect
            
        Returns:
            Canonical title if redirect exists, None if not a redirect or error
        """
        if not title or not title.strip():
            return None
        
        # Build API parameters for redirect resolution
        params = {
            'action': 'query',
            'format': 'json',
            'titles': title,
            'redirects': '1',  # Follow redirects
            'formatversion': '2'
        }
        
        try:
            response_data = self._make_request(params)
            
            # Check if we have query results
            if 'query' not in response_data:
                return None
            
            query_data = response_data['query']
            
            # Check for redirects
            if 'redirects' in query_data:
                redirects = query_data['redirects']
                if redirects and len(redirects) > 0:
                    # Get the target of the first redirect
                    canonical_title = redirects[0].get('to', title)
                    logger.info(f"Redirect resolved: '{title}' → '{canonical_title}'")
                    return canonical_title
            
            # Check for normalized titles (handles capitalization, etc.)
            if 'normalized' in query_data:
                normalized = query_data['normalized']
                if normalized and len(normalized) > 0:
                    normalized_title = normalized[0].get('to', title)
                    if normalized_title != title:
                        logger.info(f"Title normalized: '{title}' → '{normalized_title}'")
                        return normalized_title
            
            # No redirect found, return original title
            return title
            
        except Exception as e:
            logger.warning(f"Error following redirect for '{title}': {e}")
            return None

    def search_titles(self, query: str, limit: int = 10) -> List[Dict[str, any]]:
        """
        Search Wikipedia for articles matching the query
        
        Args:
            query: Search query string
            limit: Maximum number of results to return (1-50)
            
        Returns:
            List of dictionaries with keys: title, snippet, wordcount, size
            
        Raises:
            WikipediaSearchError: For API or network errors
            ValueError: For invalid parameters
        """
        if not query or not query.strip():
            raise ValueError("Query cannot be empty")
        
        if limit < 1 or limit > 50:
            raise ValueError("Limit must be between 1 and 50")
        
        # Normalize query
        normalized_query = query.strip()
        
        # Build API parameters
        params = {
            'action': 'query',
            'format': 'json',
            'list': 'search',
            'srsearch': normalized_query,
            'srlimit': str(limit),
            'srprop': 'snippet|titlesnippet|size|wordcount|timestamp',
            'formatversion': '2'
        }
        
        logger.info(f"Searching Wikipedia for: '{normalized_query}' (limit: {limit})")
        
        try:
            response_data = self._make_request(params)
            
            # Extract search results
            if 'query' not in response_data or 'search' not in response_data['query']:
                logger.warning(f"No search results found for query: '{normalized_query}'")
                return []
            
            raw_results = response_data['query']['search']
            
            # Process and normalize results
            processed_results = []
            for result in raw_results:
                processed_result = {
                    'title': result.get('title', ''),
                    'snippet': self._clean_snippet(result.get('snippet', '')),
                    'wordcount': result.get('wordcount', 0),
                    'size': result.get('size', 0),
                    'timestamp': result.get('timestamp', '')
                }
                processed_results.append(processed_result)
            
            logger.info(f"Found {len(processed_results)} results for '{normalized_query}'")
            return processed_results
            
        except WikipediaSearchError:
            # Re-raise API errors
            raise
        except Exception as e:
            raise WikipediaSearchError(f"Unexpected error during search: {e}")
    
    def _clean_snippet(self, snippet: str) -> str:
        """
        Clean HTML markup from search result snippets
        
        Args:
            snippet: Raw snippet with HTML markup
            
        Returns:
            Clean text snippet
        """
        if not snippet:
            return ""
        
        # Remove HTML tags and entities
        import re
        
        # Remove HTML tags
        clean_text = re.sub(r'<[^>]+>', '', snippet)
        
        # Decode common HTML entities
        clean_text = clean_text.replace('&lt;', '<')
        clean_text = clean_text.replace('&gt;', '>')
        clean_text = clean_text.replace('&quot;', '"')
        clean_text = clean_text.replace('&#39;', "'")
        clean_text = clean_text.replace('&amp;', '&')  # Do this last
        
        # Clean up whitespace
        clean_text = ' '.join(clean_text.split())
        
        return clean_text


# Global client instance
_search_client: Optional[MediaWikiSearchClient] = None

def get_search_client() -> MediaWikiSearchClient:
    """Get or create the global MediaWiki search client"""
    global _search_client
    if _search_client is None:
        _search_client = MediaWikiSearchClient()
    return _search_client


def search_wikipedia_titles(query: str, limit: int = 10) -> List[Dict[str, any]]:
    """
    Convenience function to search Wikipedia titles
    
    Args:
        query: Search query string
        limit: Maximum number of results (1-50)
        
    Returns:
        List of search results with title, snippet, wordcount, etc.
        
    Raises:
        WikipediaSearchError: For API or network errors
        ValueError: For invalid parameters
    """
    client = get_search_client()
    return client.search_titles(query, limit)


def follow_redirect(title: str) -> Optional[str]:
    """
    Convenience function to follow Wikipedia redirects
    
    Args:
        title: Wikipedia article title that might be a redirect
        
    Returns:
        Canonical title if redirect exists, original title if not a redirect, None on error
    """
    client = get_search_client()
    return client.follow_redirect(title)


def find_best_match(query: str, max_results: int = 5, resolve_disambiguation: bool = True) -> Optional[Dict[str, any]]:
    """
    Find the best matching Wikipedia article for a query
    
    This function attempts to find the most relevant article by first resolving
    redirects on both the query and search results, then applying selection logic 
    based on exact matches, word matching, and article importance (word count).
    
    Args:
        query: Search query
        max_results: Number of search results to examine
        resolve_disambiguation: Whether to resolve disambiguation pages
        
    Returns:
        Best matching result dictionary, or None if no good match found
    """
    try:
        results = search_wikipedia_titles(query, limit=max_results)
        
        if not results:
            logger.info(f"No search results found for: '{query}'")
            return None
        
        # STRATEGY 1: REDIRECT-FIRST RESOLUTION
        # First, check if the query itself redirects to something
        query_canonical = follow_redirect(query.strip())
        if query_canonical and query_canonical != query.strip():
            logger.info(f"Query redirect resolved: '{query}' → '{query_canonical}'")
        else:
            query_canonical = query.strip()
        
        # Resolve redirects for all top results before applying selection logic
        enriched_results = []
        for result in results:
            # Try to resolve redirect for this result
            canonical_title = follow_redirect(result['title'])
            if canonical_title and canonical_title != result['title']:
                # Create enriched result with canonical title
                logger.info(f"Result redirect resolved: '{result['title']}' → '{canonical_title}'")
                enriched_result = result.copy()
                enriched_result['title'] = canonical_title
                enriched_result['original_title'] = result['title']
                enriched_result['was_redirect'] = True
                enriched_results.append(enriched_result)
            else:
                # No redirect, use original result
                enriched_result = result.copy()
                enriched_result['original_title'] = result['title']
                enriched_result['was_redirect'] = False
                enriched_results.append(enriched_result)
        
        # Now apply selection logic using both original query and canonical query
        query_lower = query.lower().strip()
        query_canonical_lower = query_canonical.lower().strip()
        
        # Strategy 1: Look for exact match with query canonical title
        for result in enriched_results:
            result_title_lower = result['title'].lower()
            if (result_title_lower == query_lower or 
                result_title_lower == query_canonical_lower):
                logger.info(f"Found exact title match: '{result['title']}' for query '{query}' (canonical: '{query_canonical}', was redirect: {result['was_redirect']})")
                # Check if we need to resolve disambiguation
                if resolve_disambiguation:
                    resolved_title = _resolve_with_disambiguation(query, result['title'])
                    if resolved_title != result['title']:
                        # Create new result dict with resolved title
                        return _create_result_for_title(resolved_title)
                return result
        
        # Strategy 2: Look for title that contains the original query as a word
        for result in enriched_results:
            title_lower = result['title'].lower()
            # Check if query appears as a whole word in the title
            if f" {query_lower} " in f" {title_lower} " or title_lower.startswith(f"{query_lower} ") or title_lower.endswith(f" {query_lower}"):
                logger.info(f"Found title with query as word: '{result['title']}' for query '{query}' (was redirect: {result['was_redirect']})")
                # Check if we need to resolve disambiguation
                if resolve_disambiguation:
                    resolved_title = _resolve_with_disambiguation(query, result['title'])
                    if resolved_title != result['title']:
                        # Create new result dict with resolved title
                        return _create_result_for_title(resolved_title)
                return result
        
        # Strategy 3: Return the first result (highest relevance score from MediaWiki) 
        # but now with redirect resolution applied
        best_result = enriched_results[0]
        logger.info(f"Using best search result: '{best_result['title']}' for query '{query}' (canonical: '{query_canonical}', was redirect: {best_result['was_redirect']})")
        
        # Check if we need to resolve disambiguation
        if resolve_disambiguation:
            resolved_title = _resolve_with_disambiguation(query, best_result['title'])
            if resolved_title != best_result['title']:
                # Create new result dict with resolved title
                return _create_result_for_title(resolved_title)
        
        return best_result
        
    except Exception as e:
        logger.error(f"Error finding best match for '{query}': {e}")
        return None


def _resolve_with_disambiguation(query: str, title: str) -> str:
    """
    Helper function to resolve disambiguation if needed
    
    Args:
        query: Original search query
        title: Wikipedia title to potentially resolve
        
    Returns:
        Resolved title, or original title if no resolution needed/possible
    """
    try:
        from disambiguation import resolve_disambiguation_if_needed
        return resolve_disambiguation_if_needed(query, title)
    except ImportError:
        logger.debug("Disambiguation module not available, skipping resolution")
        return title
    except Exception as e:
        logger.warning(f"Error during disambiguation resolution: {e}")
        return title


def _create_result_for_title(title: str) -> Optional[Dict[str, any]]:
    """
    Create a search result dictionary for a given title
    
    Args:
        title: Wikipedia article title
        
    Returns:
        Result dictionary with title and basic metadata, or None if title not found
    """
    try:
        # Search for the specific title to get metadata
        results = search_wikipedia_titles(title, limit=1)
        if results and results[0]['title'] == title:
            return results[0]
        
        # If exact match not found, create basic result
        logger.debug(f"Creating basic result for resolved title: '{title}'")
        return {
            'title': title,
            'snippet': f"Resolved from disambiguation for {title}",
            'wordcount': 0,
            'size': 0,
            'timestamp': ''
        }
        
    except Exception as e:
        logger.error(f"Error creating result for title '{title}': {e}")
        return None


if __name__ == "__main__":
    # Simple test when run directly
    import sys
    
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        try:
            results = search_wikipedia_titles(query, limit=5)
            print(f"\nSearch results for '{query}':")
            for i, result in enumerate(results, 1):
                print(f"{i}. {result['title']} ({result['wordcount']} words)")
                print(f"   {result['snippet'][:100]}...")
                
            # Test disambiguation resolution
            print(f"\nBest match with disambiguation resolution:")
            best_match = find_best_match(query)
            if best_match:
                print(f"→ {best_match['title']}")
            else:
                print("→ No match found")
        except Exception as e:
            print(f"Search failed: {e}")
    else:
        print("Usage: python wikipedia_search.py <search query>") 