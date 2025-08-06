"""
Wikipedia Disambiguation Detection & Resolution

Handles detection of Wikipedia disambiguation pages and provides intelligent
resolution to select the most relevant target article for a given query.

Usage:
    from disambiguation import resolve_disambiguation_if_needed
    resolved_title = resolve_disambiguation_if_needed("Jaguar", "Jaguar")
    # Returns: "Jaguar (car)" or other most relevant option
"""

import logging
import re
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote_plus

import requests
from wikipedia_search import WikipediaSearchError

logger = logging.getLogger(__name__)


class DisambiguationError(Exception):
    """Custom exception for disambiguation handling failures"""
    pass


def is_disambiguation_page(title: str, content: Optional[str] = None) -> bool:
    """
    Detect if a Wikipedia page is a disambiguation page
    
    Args:
        title: Wikipedia page title
        content: Optional page content (if available, avoids extra API call)
        
    Returns:
        True if the page is a disambiguation page
    """
    # Quick check: title contains (disambiguation)
    if "(disambiguation)" in title.lower():
        logger.debug(f"Title '{title}' contains '(disambiguation)' - confirmed disambiguation page")
        return True
    
    # If we don't have content, we need to fetch it to check
    if content is None:
        try:
            content = _fetch_page_content(title)
            if not content:
                return False
        except Exception as e:
            logger.warning(f"Could not fetch content for '{title}' to check disambiguation: {e}")
            return False
    
    # Check for disambiguation indicators in content
    content_lower = content.lower()
    
    # Common disambiguation patterns
    disambiguation_patterns = [
        r'\bmay refer to\b',
        r'\brefer to\b',
        r'\bdisambiguation\b',
        r'\bcan mean\b',
        r'\bmay mean\b',
        r'\bfollowing uses?\b',
        r'\bseveral meanings?\b'
    ]
    
    for pattern in disambiguation_patterns:
        if re.search(pattern, content_lower):
            logger.debug(f"Found disambiguation pattern '{pattern}' in '{title}'")
            return True
    
    # Check for list structure typical of disambiguation pages
    if re.search(r'^\*\s+.*\*\s+.*\*\s+', content, re.MULTILINE):
        logger.debug(f"Found list structure typical of disambiguation in '{title}'")
        return True
    
    return False


def parse_disambiguation_page(title: str) -> List[Dict[str, str]]:
    """
    Parse a disambiguation page to extract all disambiguation options
    
    Args:
        title: Title of the disambiguation page
        
    Returns:
        List of dictionaries with keys: 'title', 'description'
        
    Raises:
        DisambiguationError: If page cannot be parsed or fetched
    """
    try:
        content = _fetch_page_content(title)
        if not content:
            raise DisambiguationError(f"Could not fetch content for disambiguation page: {title}")
        
        options = []
        
        # Pattern to match disambiguation entries in multiple formats:
        # Format 1: * [[Article Name]], description
        # Format 2: * [[Article Name|Display Name]], description  
        # Format 3: Article Name (link), description (plain text format)
        # Format 4: '''Article Name''', description
        
        # Split content into lines and process each
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines
            if not line:
                continue
            
            # Format 1 & 2: Lines starting with * (bullet points)
            if line.startswith('*'):
                # Remove the bullet point
                line = line[1:].strip()
                
                # Extract wiki links [[Article]] or [[Article|Display]]
                wiki_link_matches = re.findall(r'\[\[([^\]]+)\]\]', line)
                
                for match in wiki_link_matches:
                    # Handle [[Article|Display]] format
                    if '|' in match:
                        article_title, display_text = match.split('|', 1)
                    else:
                        article_title = match
                        display_text = match
                    
                    # Extract description (text after the link)
                    # Remove the wiki link from the line to get description
                    description_part = re.sub(r'\[\[[^\]]+\]\]', '', line, count=1).strip()
                    # Remove leading comma/punctuation
                    description_part = re.sub(r'^[,\s]+', '', description_part)
                    
                    # Skip meta/navigation pages
                    if _is_meta_page(article_title):
                        continue
                    
                    options.append({
                        'title': article_title.strip(),
                        'description': description_part.strip()
                    })
            
            # Format 3: Plain text lines with links (like Mercury disambiguation)
            elif re.search(r'\w+\s*\([^)]+\)', line):
                # Look for pattern like "Mercury (planet), description"
                # Extract title and description
                match = re.match(r'^([^,]+),?\s*(.*)$', line)
                if match:
                    title_part = match.group(1).strip()
                    description_part = match.group(2).strip()
                    
                    # Clean up the title (remove extra parentheses formatting)
                    title_part = re.sub(r'\s+', ' ', title_part)
                    
                    # Skip lines that are just headers or don't contain actual articles
                    if ('refer to' in title_part.lower() or 
                        'may also' in title_part.lower() or
                        'commonly refers' in title_part.lower()):
                        continue
                        
                    if not _is_meta_page(title_part):
                        options.append({
                            'title': title_part,
                            'description': description_part
                        })
        
        # Also look for bold text entries (alternative format)
        bold_matches = re.findall(r"'''([^']+)'''", content)
        for match in bold_matches:
            # Skip if we already have this from wiki links
            if not any(opt['title'] == match.strip() for opt in options):
                # Find description after the bold text
                pattern = rf"'''{re.escape(match)}'''[,\s]*([^.*\n]*)"
                desc_match = re.search(pattern, content)
                description = desc_match.group(1).strip() if desc_match else ""
                
                if not _is_meta_page(match.strip()):
                    options.append({
                        'title': match.strip(),
                        'description': description
                    })
        
        logger.info(f"Parsed {len(options)} disambiguation options from '{title}'")
        return options
        
    except Exception as e:
        raise DisambiguationError(f"Failed to parse disambiguation page '{title}': {e}")


def resolve_disambiguation(query: str, options: List[Dict[str, str]]) -> Optional[str]:
    """
    Resolve disambiguation by selecting the most relevant option
    
    Args:
        query: Original search query
        options: List of disambiguation options from parse_disambiguation_page
        
    Returns:
        Title of the most relevant option, or None if no good match
    """
    if not options:
        logger.warning(f"No disambiguation options provided for query '{query}'")
        return None
    
    query_lower = query.lower().strip()
    scored_options = []
    
    for option in options:
        title = option['title']
        description = option['description']
        score = 0
        
        # Scoring strategy
        title_lower = title.lower()
        desc_lower = description.lower()
        
        # 1. Exact match in title (highest priority)
        if query_lower == title_lower:
            score += 100
        
        # 2. Query appears as word in title
        if f" {query_lower} " in f" {title_lower} " or title_lower.startswith(f"{query_lower} ") or title_lower.endswith(f" {query_lower}"):
            score += 50
        
        # 3. Query appears anywhere in title
        if query_lower in title_lower:
            score += 30
        
        # 4. Query appears in description
        if query_lower in desc_lower:
            score += 20
        
        # 5. Prefer shorter, more specific titles over generic ones
        # Penalize very long titles or those with lots of parentheses
        title_parts = title.count('(')
        if title_parts == 0:
            score += 10  # Simple title bonus
        elif title_parts == 1:
            score += 5   # One clarification is good
        else:
            score -= 5   # Too many clarifications
        
        # 6. Prefer common/likely topics
        common_indicators = ['company', 'car', 'animal', 'person', 'band', 'film', 'book']
        for indicator in common_indicators:
            if indicator in desc_lower or f"({indicator})" in title_lower:
                score += 15
                break
        
        # 7. Penalize meta pages (should have been filtered already, but safety check)
        if _is_meta_page(title):
            score -= 50
        
        scored_options.append((score, title, option))
        logger.debug(f"Scored option '{title}': {score} points")
    
    # Sort by score (highest first)
    scored_options.sort(key=lambda x: x[0], reverse=True)
    
    if scored_options:
        best_score, best_title, best_option = scored_options[0]
        logger.info(f"Resolved '{query}' to '{best_title}' (score: {best_score})")
        return best_title
    
    return None


def resolve_disambiguation_if_needed(query: str, search_result_title: str) -> str:
    """
    Check if a search result is a disambiguation page and resolve if needed
    
    Args:
        query: Original search query
        search_result_title: Title returned from Wikipedia search
        
    Returns:
        Resolved title if disambiguation was needed, otherwise original title
    """
    try:
        # Check if the result is a disambiguation page
        if not is_disambiguation_page(search_result_title):
            logger.debug(f"'{search_result_title}' is not a disambiguation page")
            return search_result_title
        
        logger.info(f"'{search_result_title}' is a disambiguation page, resolving for query '{query}'")
        
        # Parse disambiguation options
        options = parse_disambiguation_page(search_result_title)
        
        # Resolve to best option
        resolved_title = resolve_disambiguation(query, options)
        
        if resolved_title:
            logger.info(f"Successfully resolved '{search_result_title}' → '{resolved_title}' for query '{query}'")
            return resolved_title
        else:
            logger.warning(f"Could not resolve disambiguation for '{search_result_title}', using original")
            return search_result_title
            
    except Exception as e:
        logger.error(f"Error during disambiguation resolution: {e}")
        return search_result_title  # Fallback to original


def _fetch_page_content(title: str) -> Optional[str]:
    """
    Fetch Wikipedia page content using the MediaWiki API
    
    Args:
        title: Wikipedia page title
        
    Returns:
        Page content as text, or None if not found
    """
    try:
        url = "https://en.wikipedia.org/w/api.php"
        params = {
            'action': 'query',
            'format': 'json',
            'titles': title,
            'prop': 'extracts',
            'exintro': False,  # Get full content, not just intro
            'explaintext': True,  # Plain text, no HTML
            'exsectionformat': 'plain',
            'formatversion': '2'
        }
        
        headers = {
            'User-Agent': 'Quivio-RAG-Service/1.0 (https://github.com/quivio/rag-service)'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if 'query' in data and 'pages' in data['query']:
            pages = data['query']['pages']
            if pages and len(pages) > 0:
                page = pages[0]
                if 'extract' in page:
                    return page['extract']
        
        return None
        
    except Exception as e:
        logger.error(f"Failed to fetch content for '{title}': {e}")
        return None


def _is_meta_page(title: str) -> bool:
    """
    Check if a title refers to a meta/navigation page that should be skipped
    
    Args:
        title: Wikipedia page title
        
    Returns:
        True if this is a meta page to skip
    """
    title_lower = title.lower()
    
    # Skip various meta page types
    meta_indicators = [
        'list of',
        'category:',
        'template:',
        'wikipedia:',
        'help:',
        'portal:',
        'see also',
        'external links',
        'references',
        'bibliography'
    ]
    
    return any(indicator in title_lower for indicator in meta_indicators)


if __name__ == "__main__":
    # Simple test when run directly
    import sys
    
    if len(sys.argv) > 1:
        title = " ".join(sys.argv[1:])
        try:
            if is_disambiguation_page(title):
                print(f"✅ '{title}' is a disambiguation page")
                options = parse_disambiguation_page(title)
                print(f"Found {len(options)} options:")
                for i, option in enumerate(options[:5], 1):
                    print(f"{i}. {option['title']} - {option['description'][:100]}...")
            else:
                print(f"❌ '{title}' is not a disambiguation page")
        except Exception as e:
            print(f"Error: {e}")
    else:
        print("Usage: python disambiguation.py <page title>") 