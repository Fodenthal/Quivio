#!/usr/bin/env python3
"""
Test script for HTML parsing functionality

Tests that the BeautifulSoup-based HTML parsing produces clean narrative prose
without pipe characters, citation brackets, or table soup.
"""

import os
import sys
from dotenv import load_dotenv

# Add the current directory to the path so we can import ingest_worker
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ingest_worker import WikipediaIngestionWorker

def test_albert_einstein_parsing():
    """Test parsing of Albert Einstein article to ensure clean output"""
    
    # Sample HTML content from Albert Einstein article (simplified)
    sample_html = """
    <div class="mw-parser-output">
        <p>Albert Einstein (14 March 1879 – 18 April 1955) was a German-born theoretical physicist who developed the theory of relativity.</p>
        <table class="infobox">
            <tr><td>Born</td><td>14 March 1879</td></tr>
            <tr><td>Died</td><td>18 April 1955</td></tr>
        </table>
        <p>Einstein also made important contributions to quantum mechanics.[1][5] His work is also known for its influence on the philosophy of science.</p>
        <h2>Early life</h2>
        <p>Einstein was born in Ulm, in the Kingdom of Württemberg in the German Empire.[note 1] His father was Hermann Einstein.</p>
        <h2>References</h2>
        <ul><li>Reference 1</li></ul>
    </div>
    """
    
    worker = WikipediaIngestionWorker()
    clean_text = worker.html_to_text(sample_html)
    
    print("=== Test Results ===")
    print(f"Clean text length: {len(clean_text)} characters")
    print(f"First 200 characters: {clean_text[:200]}...")
    print()
    
    # Assertions
    assert '|' not in clean_text, f"Found pipe character in text: {clean_text}"
    assert '[1]' not in clean_text, f"Found citation [1] in text: {clean_text}"
    assert '[5]' not in clean_text, f"Found citation [5] in text: {clean_text}"
    assert '[note 1]' not in clean_text, f"Found note citation in text: {clean_text}"
    assert 'Born|' not in clean_text, f"Found table content in text: {clean_text}"
    assert 'Died|' not in clean_text, f"Found table content in text: {clean_text}"
    assert 'References' not in clean_text, f"Found references section in text: {clean_text}"
    assert len(clean_text.split()) > 50, f"Text too short: {len(clean_text.split())} words"
    
    print("✅ All tests passed! Text is clean narrative prose.")
    print(f"Word count: {len(clean_text.split())}")
    return clean_text

def test_real_wikipedia_fetch():
    """Test with real Wikipedia article fetch"""
    print("\n=== Testing Real Wikipedia Fetch ===")
    
    worker = WikipediaIngestionWorker()
    
    # Fetch Albert Einstein article
    html_content = worker.fetch_wikipedia_article("Albert Einstein")
    if not html_content:
        print("❌ Failed to fetch Wikipedia article")
        return
    
    print(f"✅ Fetched article: {len(html_content)} characters")
    
    # Parse to clean text
    clean_text = worker.html_to_text(html_content)
    
    print(f"✅ Parsed to clean text: {len(clean_text)} characters")
    print(f"Word count: {len(clean_text.split())}")
    
    # Check for problematic content
    issues = []
    if '|' in clean_text:
        issues.append("pipe characters")
    if re.search(r'\[\d+\]', clean_text):
        issues.append("citation brackets")
    if 'Born|' in clean_text or 'Died|' in clean_text:
        issues.append("table content")
    
    if issues:
        print(f"❌ Found issues: {', '.join(issues)}")
        print("First 500 characters:")
        print(clean_text[:500])
    else:
        print("✅ No issues found - clean narrative prose!")
        print("First 300 characters:")
        print(clean_text[:300])

if __name__ == "__main__":
    import re
    
    load_dotenv()
    
    print("Testing HTML parsing functionality...")
    
    # Test with sample HTML
    test_albert_einstein_parsing()
    
    # Test with real Wikipedia fetch
    test_real_wikipedia_fetch() 