#!/usr/bin/env python3
"""
Debug script to examine Wikipedia HTML structure
"""

import os
import sys
from dotenv import load_dotenv

# Add the current directory to the path so we can import ingest_worker
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ingest_worker import WikipediaIngestionWorker

def debug_html_structure():
    """Debug the HTML structure returned by Wikipedia REST API"""
    
    worker = WikipediaIngestionWorker()
    
    # Fetch Albert Einstein article
    html_content = worker.fetch_wikipedia_article("Albert Einstein")
    if not html_content:
        print("❌ Failed to fetch Wikipedia article")
        return
    
    print(f"✅ Fetched article: {len(html_content)} characters")
    
    # Save a sample of the HTML for inspection
    with open('sample_wikipedia.html', 'w', encoding='utf-8') as f:
        f.write(html_content[:5000])  # First 5000 characters
    print("📄 Saved sample HTML to sample_wikipedia.html")
    
    # Look for the main content div
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Check for different possible content containers
    possible_containers = [
        'div.mw-parser-output',
        'div.mw-content-ltr',
        'div.mw-content-rtl',
        'main',
        'article',
        'div.content',
        'div#content'
    ]
    
    print("\n=== Checking for content containers ===")
    for selector in possible_containers:
        element = soup.select_one(selector)
        if element:
            print(f"✅ Found: {selector}")
            print(f"   Content length: {len(element.get_text())} characters")
            print(f"   First 200 chars: {element.get_text()[:200]}...")
        else:
            print(f"❌ Not found: {selector}")
    
    # Check for any div with class containing 'parser'
    print("\n=== Checking for parser-related divs ===")
    parser_divs = soup.find_all('div', class_=lambda x: x and 'parser' in x.lower())
    for div in parser_divs:
        print(f"Found div with class: {div.get('class')}")
        print(f"Content length: {len(div.get_text())} characters")
    
    # Check the overall structure
    print("\n=== Overall HTML structure ===")
    print(f"Title: {soup.title.string if soup.title else 'No title'}")
    
    if soup.body:
        body_children = list(soup.body.children)
        print(f"Body children count: {len(body_children)}")
        
        # Show first few body children
        for i, child in enumerate(body_children[:5]):
            if child.name:
                print(f"  {i}: <{child.name}> (class: {child.get('class')})")
                if child.name == 'div':
                    print(f"     Text preview: {child.get_text()[:100]}...")
    else:
        print("No body tag found")
    
    # Look for any div that might contain the main content
    print("\n=== All divs with classes ===")
    all_divs = soup.find_all('div', class_=True)
    for div in all_divs[:10]:  # Show first 10
        classes = ' '.join(div.get('class'))
        text_length = len(div.get_text())
        print(f"<div class=\"{classes}\"> - {text_length} chars")

if __name__ == "__main__":
    load_dotenv()
    debug_html_structure() 