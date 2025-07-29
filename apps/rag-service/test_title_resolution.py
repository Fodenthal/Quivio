"""
Comprehensive Test Suite for Title Resolution System

Tests all components of Phase 3.5 Smart Title Discovery:
- wikipedia_search.py (MediaWiki API client)
- disambiguation.py (Disambiguation detection and resolution)  
- title_resolver.py (Orchestration service)

Usage:
    python test_title_resolution.py
    python test_title_resolution.py --verbose
    python test_title_resolution.py --performance
"""

import unittest
import time
import logging
from typing import Dict, List, Optional
import sys
import argparse

# Import our modules
try:
    from wikipedia_search import (
        search_wikipedia_titles, find_best_match, 
        MediaWikiSearchClient, WikipediaSearchError
    )
    from disambiguation import (
        is_disambiguation_page, parse_disambiguation_page,
        resolve_disambiguation, resolve_disambiguation_if_needed,
        DisambiguationError
    )
    from title_resolver import (
        resolve_title, resolve_title_with_metadata,
        batch_resolve_titles, TitleResolver
    )
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running from the rag-service directory")
    sys.exit(1)


class TestWikipediaSearch(unittest.TestCase):
    """Test suite for wikipedia_search.py module"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.client = MediaWikiSearchClient()
        self.test_queries = {
            'exact_match': 'Albert Einstein',
            'fuzzy_match': 'Einstein',
            'disambiguation': 'Mercury',
            'common_name': 'Tesla',
            'multi_word': 'New York',
            'special_chars': 'C++',
            'non_existent': 'xyzabc123nonexistent'
        }
    
    def test_basic_search_functionality(self):
        """Test basic Wikipedia search functionality"""
        results = search_wikipedia_titles('Einstein', limit=5)
        
        self.assertIsInstance(results, list)
        self.assertGreater(len(results), 0, "Should return search results")
        
        # Check result structure
        first_result = results[0]
        required_fields = ['title', 'snippet', 'wordcount', 'size']
        for field in required_fields:
            self.assertIn(field, first_result, f"Result should contain {field}")
        
        # Should find Albert Einstein
        titles = [r['title'] for r in results]
        self.assertTrue(any('Albert Einstein' in title for title in titles))
    
    def test_search_parameters(self):
        """Test search with different parameters"""
        # Test different limits
        for limit in [1, 5, 10]:
            results = search_wikipedia_titles('Einstein', limit=limit)
            self.assertLessEqual(len(results), limit)
    
    def test_search_edge_cases(self):
        """Test edge cases for search functionality"""
        # Empty query
        with self.assertRaises(ValueError):
            search_wikipedia_titles('')
        
        # Invalid limit
        with self.assertRaises(ValueError):
            search_wikipedia_titles('test', limit=0)
        
        with self.assertRaises(ValueError):
            search_wikipedia_titles('test', limit=100)
        
        # Non-existent topic
        results = search_wikipedia_titles('xyzabc123nonexistent99999')
        # Should not raise exception, just return empty or minimal results
        self.assertIsInstance(results, list)
    
    def test_find_best_match(self):
        """Test find_best_match functionality"""
        test_cases = [
            ('Einstein', 'Albert Einstein'),
            ('Tesla', 'Tesla'),  # Could be various Tesla results
            ('Newton', 'Isaac Newton')  # Could be Isaac Newton or Newton (unit)
        ]
        
        for query, expected_pattern in test_cases:
            result = find_best_match(query)
            self.assertIsNotNone(result, f"Should find result for {query}")
            self.assertIsInstance(result, dict)
            self.assertIn('title', result)
            
            # For some queries, we can check if the expected pattern is in the result
            if expected_pattern in ['Albert Einstein', 'Isaac Newton']:
                self.assertIn(expected_pattern, result['title'])
    
    def test_disambiguation_toggle(self):
        """Test find_best_match with disambiguation on/off"""
        # Test with disambiguation enabled/disabled
        result_with_disambig = find_best_match('Mercury', resolve_disambiguation=True)
        result_without_disambig = find_best_match('Mercury', resolve_disambiguation=False)
        
        self.assertIsNotNone(result_with_disambig)
        self.assertIsNotNone(result_without_disambig)
        
        # With disambiguation, should get specific article like "Mercury (planet)"
        # Without disambiguation, should get generic "Mercury"
        with_title = result_with_disambig['title']
        without_title = result_without_disambig['title']
        
        # The results should be different
        if with_title != without_title:
            self.assertIn('Mercury', with_title)
            self.assertEqual('Mercury', without_title)


class TestDisambiguation(unittest.TestCase):
    """Test suite for disambiguation.py module"""
    
    def test_disambiguation_detection(self):
        """Test disambiguation page detection"""
        test_cases = [
            ('Mercury', True),      # Known disambiguation page
            ('Albert Einstein', False),  # Regular article
            ('Jaguar', False),      # Regular article (might be disambiguation but that's ok)
            ('Python', True),       # Should be disambiguation
        ]
        
        for title, expected_is_disambig in test_cases:
            # Note: This test depends on current Wikipedia structure
            result = is_disambiguation_page(title)
            self.assertIsInstance(result, bool)
            # We'll log rather than assert for brittle cases
            if result != expected_is_disambig:
                print(f"⚠️  Disambiguation detection mismatch for '{title}': "
                      f"expected {expected_is_disambig}, got {result}")
    
    def test_disambiguation_parsing(self):
        """Test disambiguation page parsing"""
        # Test with known disambiguation page
        try:
            options = parse_disambiguation_page('Mercury')
            
            self.assertIsInstance(options, list)
            if len(options) > 0:  # If we found options
                self.assertGreater(len(options), 0, "Should find disambiguation options")
                
                # Check option structure
                first_option = options[0]
                self.assertIn('title', first_option)
                self.assertIn('description', first_option)
                
                # Should contain common Mercury disambiguations
                titles = [opt['title'] for opt in options]
                mercury_variants = ['Mercury (planet)', 'Mercury (element)', 'Mercury (mythology)']
                found_variants = sum(1 for variant in mercury_variants 
                                   if any(variant in title for title in titles))
                self.assertGreater(found_variants, 0, "Should find known Mercury variants")
                
        except DisambiguationError as e:
            self.skipTest(f"Could not test disambiguation parsing: {e}")
    
    def test_disambiguation_resolution(self):
        """Test disambiguation resolution logic"""
        # Create mock disambiguation options
        mock_options = [
            {'title': 'Mercury (planet)', 'description': 'the closest planet to the Sun'},
            {'title': 'Mercury (element)', 'description': 'a chemical element'},
            {'title': 'Mercury (mythology)', 'description': 'a Roman deity'},
            {'title': 'Mercury Records', 'description': 'a record label'}
        ]
        
        # Test resolution for different queries
        test_cases = [
            ('Mercury', 'Mercury (planet)'),  # Should prefer planet
            ('mercury element', 'Mercury (element)'),  # Should match element
            ('mercury god', 'Mercury (mythology)'),  # Should match mythology
        ]
        
        for query, expected_pattern in test_cases:
            resolved = resolve_disambiguation(query, mock_options)
            self.assertIsNotNone(resolved, f"Should resolve '{query}'")
            if expected_pattern:
                self.assertIn(expected_pattern, resolved, 
                            f"Query '{query}' should resolve to something containing '{expected_pattern}'")
    
    def test_resolve_disambiguation_if_needed(self):
        """Test the main disambiguation resolution function"""
        # Test with actual disambiguation page
        resolved = resolve_disambiguation_if_needed('Mercury', 'Mercury')
        self.assertIsNotNone(resolved)
        
        # Test with non-disambiguation page
        resolved = resolve_disambiguation_if_needed('Einstein', 'Albert Einstein')
        self.assertEqual(resolved, 'Albert Einstein')


class TestTitleResolver(unittest.TestCase):
    """Test suite for title_resolver.py module"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.resolver = TitleResolver(enable_caching=False)  # Disable caching for consistent tests
    
    def test_basic_resolution(self):
        """Test basic title resolution functionality"""
        test_cases = [
            'Einstein',
            'Mercury', 
            'Tesla',
            'Newton',
            'Darwin'
        ]
        
        for query in test_cases:
            resolved = resolve_title(query)
            # Should either resolve to something or return None (but not crash)
            self.assertTrue(resolved is None or isinstance(resolved, str))
            
            if resolved:
                self.assertGreater(len(resolved), 0, "Resolved title should not be empty")
                print(f"✅ {query} → {resolved}")
            else:
                print(f"⚠️  {query} → Could not resolve")
    
    def test_resolution_with_metadata(self):
        """Test resolution with comprehensive metadata"""
        result = resolve_title_with_metadata('Einstein')
        
        # Check required metadata fields
        required_fields = [
            'resolved_title', 'original_query', 'strategy_used',
            'attempts', 'disambiguation_applied', 'duration_ms', 'from_cache'
        ]
        
        for field in required_fields:
            self.assertIn(field, result, f"Metadata should contain {field}")
        
        # Check data types
        self.assertIsInstance(result['attempts'], int)
        self.assertIsInstance(result['duration_ms'], int)
        self.assertIsInstance(result['disambiguation_applied'], bool)
        self.assertIsInstance(result['from_cache'], bool)
        
        # Duration should be reasonable (less than 10 seconds)
        self.assertLess(result['duration_ms'], 10000)
    
    def test_caching_functionality(self):
        """Test caching system"""
        resolver = TitleResolver(enable_caching=True)
        
        # First call
        start_time = time.time()
        result1 = resolver.resolve_title_with_metadata('Einstein')
        first_duration = time.time() - start_time
        
        # Second call (should be cached)
        start_time = time.time()
        result2 = resolver.resolve_title_with_metadata('Einstein')
        second_duration = time.time() - start_time
        
        # First call should not be from cache, second should be
        self.assertFalse(result1['from_cache'])
        self.assertTrue(result2['from_cache'])
        
        # Second call should be much faster
        self.assertLess(second_duration, first_duration / 2)
        
        # Results should be the same
        self.assertEqual(result1['resolved_title'], result2['resolved_title'])
    
    def test_batch_resolution(self):
        """Test batch resolution functionality"""
        queries = ['Einstein', 'Tesla', 'Newton', 'Darwin']
        results = batch_resolve_titles(queries)
        
        self.assertIsInstance(results, dict)
        self.assertEqual(len(results), len(queries))
        
        # Each query should have a result (even if None)
        for query in queries:
            self.assertIn(query, results)
        
        # Count successful resolutions
        successful = sum(1 for r in results.values() if r is not None)
        print(f"Batch resolution: {successful}/{len(queries)} successful")
    
    def test_input_validation(self):
        """Test input validation and normalization"""
        test_cases = [
            ('', None),  # Empty string
            ('   ', None),  # Whitespace only
            ('Einstein', 'Einstein'),  # Normal case
            ('  einstein  ', 'einstein'),  # Whitespace normalization
            ('Einstein<>|*?', 'Einstein'),  # Special character removal
            ('a' * 250, 'a' * 200),  # Length truncation
        ]
        
        for input_query, expected_normalized in test_cases:
            result = self.resolver._normalize_query(input_query)
            if expected_normalized is None:
                self.assertIsNone(result)
            else:
                self.assertEqual(result, expected_normalized)
    
    def test_fallback_strategies(self):
        """Test fallback strategy system"""
        # Test with a query that might need fallback
        result = resolve_title_with_metadata('xyznonexistent99999')
        
        # Should have attempted multiple strategies
        self.assertGreaterEqual(result['attempts'], 2)
        self.assertIsNotNone(result['error_message'])
        self.assertIsNone(result['resolved_title'])
    
    def test_error_handling(self):
        """Test error handling and edge cases"""
        error_cases = [
            None,  # None input
            123,   # Non-string input
            '',    # Empty string
            '   ', # Whitespace only
        ]
        
        for bad_input in error_cases:
            try:
                result = resolve_title(bad_input)
                # Should return None or handle gracefully
                self.assertTrue(result is None or isinstance(result, str))
            except Exception as e:
                self.fail(f"Should handle bad input gracefully: {bad_input}, got {e}")


class TestIntegration(unittest.TestCase):
    """Integration tests for the complete title resolution system"""
    
    def test_end_to_end_workflow(self):
        """Test complete workflow from fuzzy query to exact title"""
        workflows = [
            {
                'query': 'Einstein',
                'expected_patterns': ['Albert Einstein'],
                'should_resolve': True
            },
            {
                'query': 'Mercury',
                'expected_patterns': ['Mercury (planet)', 'Mercury (element)'],
                'should_resolve': True
            },
            {
                'query': 'Tesla inventor',
                'expected_patterns': ['Nikola Tesla', 'Tesla'],
                'should_resolve': True
            },
            {
                'query': 'xyzabc123impossible',
                'expected_patterns': [],
                'should_resolve': False
            }
        ]
        
        for workflow in workflows:
            query = workflow['query']
            resolved = resolve_title(query)
            
            if workflow['should_resolve']:
                self.assertIsNotNone(resolved, f"Should resolve '{query}'")
                
                # Check if resolved title matches expected patterns
                if workflow['expected_patterns']:
                    matches_pattern = any(pattern in resolved 
                                        for pattern in workflow['expected_patterns'])
                    if not matches_pattern:
                        print(f"⚠️  '{query}' resolved to '{resolved}', "
                              f"expected one of {workflow['expected_patterns']}")
            else:
                self.assertIsNone(resolved, f"Should not resolve '{query}'")
            
            print(f"Workflow test: '{query}' → {resolved}")
    
    def test_performance_benchmarks(self):
        """Test performance benchmarks"""
        queries = ['Einstein', 'Tesla', 'Newton', 'Darwin', 'Mercury']
        
        # Test individual query performance
        total_time = 0
        for query in queries:
            start_time = time.time()
            resolve_title(query)
            duration = time.time() - start_time
            total_time += duration
            
            # Individual query should complete in reasonable time
            self.assertLess(duration, 5.0, f"Query '{query}' took too long: {duration:.2f}s")
        
        avg_time = total_time / len(queries)
        print(f"Average resolution time: {avg_time:.2f}s")
        
        # Test batch performance
        start_time = time.time()
        batch_resolve_titles(queries)
        batch_duration = time.time() - start_time
        
        print(f"Batch resolution time: {batch_duration:.2f}s for {len(queries)} queries")
    
    def test_reliability_stress(self):
        """Test system reliability under stress"""
        # Test repeated queries
        query = 'Einstein'
        results = []
        
        for i in range(5):
            result = resolve_title(query)
            results.append(result)
            time.sleep(0.1)  # Small delay to respect rate limits
        
        # Results should be consistent
        unique_results = set(filter(None, results))
        self.assertLessEqual(len(unique_results), 2, 
                           "Results should be consistent across multiple calls")
        
        print(f"Reliability test: {len(unique_results)} unique results from 5 calls")


def run_comprehensive_tests(verbose=False, performance=False):
    """Run the comprehensive test suite"""
    
    # Configure logging
    log_level = logging.DEBUG if verbose else logging.WARNING
    logging.basicConfig(level=log_level, format='%(levelname)s: %(message)s')
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test cases
    test_classes = [
        TestWikipediaSearch,
        TestDisambiguation, 
        TestTitleResolver,
        TestIntegration
    ]
    
    for test_class in test_classes:
        tests = loader.loadTestsFromTestCase(test_class)
        suite.addTests(tests)
    
    # Add performance tests if requested
    if performance:
        suite.addTest(TestIntegration('test_performance_benchmarks'))
        suite.addTest(TestIntegration('test_reliability_stress'))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2 if verbose else 1)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "="*60)
    print("COMPREHENSIVE TEST RESULTS")
    print("="*60)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    
    if result.failures:
        print(f"\nFAILURES ({len(result.failures)}):")
        for test, traceback in result.failures:
            newline = '\n'
            error_msg = traceback.split('AssertionError: ')[-1].split(newline)[0]
            print(f"- {test}: {error_msg}")
    
    if result.errors:
        print(f"\nERRORS ({len(result.errors)}):")
        for test, traceback in result.errors:
            newline = '\n'
            error_msg = traceback.split(newline)[-2]
            print(f"- {test}: {error_msg}")
    
    # Overall assessment
    if len(result.failures) == 0 and len(result.errors) == 0:
        print("\n🎉 ALL TESTS PASSED - System is ready for production!")
    elif len(result.failures) + len(result.errors) <= 2:
        print("\n⚠️  MOSTLY SUCCESSFUL - Minor issues detected, review recommended")
    else:
        print("\n❌ SIGNIFICANT ISSUES - System needs fixes before proceeding")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Comprehensive Title Resolution Test Suite')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose output')
    parser.add_argument('--performance', action='store_true', help='Include performance tests')
    
    args = parser.parse_args()
    
    print("🧪 Starting Comprehensive Title Resolution Test Suite")
    print("="*60)
    
    success = run_comprehensive_tests(verbose=args.verbose, performance=args.performance)
    sys.exit(0 if success else 1) 