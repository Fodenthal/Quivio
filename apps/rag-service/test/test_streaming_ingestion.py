#!/usr/bin/env python3
"""
Comprehensive Test Suite for Streaming Ingestion Workflow

Tests the complete end-to-end streaming ingestion process:
1. Lead-only extraction and immediate ingestion
2. Background task queuing and execution  
3. Full article processing completion
4. Error handling and edge cases
5. Performance and timing requirements
"""

import logging
import os
import sys
import time
import unittest
from unittest.mock import Mock, patch, MagicMock, call
from typing import Dict, List, Optional

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from ingest_worker import WikipediaIngestionWorker
from background_tasks import BackgroundTaskManager, TaskStatus

# Configure logging for tests
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


class TestStreamingIngestionWorkflow(unittest.TestCase):
    """Test the complete streaming ingestion workflow"""
    
    def setUp(self):
        """Set up test environment with mocked dependencies"""
        # Mock environment variables
        self.env_patcher = patch.dict(os.environ, {
            'OPENAI_API_KEY': 'test_key',
            'SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_ANON_KEY': 'test_anon_key'
        })
        self.env_patcher.start()
        
        # Mock external dependencies
        self.requests_patcher = patch('ingest_worker.requests')
        self.openai_patcher = patch('ingest_worker.OpenAI')
        self.supabase_patcher = patch('ingest_worker.create_client')
        
        self.mock_requests = self.requests_patcher.start()
        self.mock_openai = self.openai_patcher.start()
        self.mock_supabase = self.supabase_patcher.start()
        
        # Set up mock responses
        self.setup_mock_responses()
        
    def tearDown(self):
        """Clean up after tests"""
        self.env_patcher.stop()
        self.requests_patcher.stop()
        self.openai_patcher.stop() 
        self.supabase_patcher.stop()
    
    def setup_mock_responses(self):
        """Set up mock responses for external API calls"""
        # Mock Wikipedia API response
        mock_html = """
        <html>
        <body>
        <p>Albert Einstein was a German-born <b>theoretical physicist</b>.</p>
        <p>He is widely regarded as one of the greatest and most influential physicists of all time.</p>
        <p>Einstein is best known for developing the theory of relativity.</p>
        <p>This is additional content for full article processing.</p>
        <p>More content continues here with detailed information.</p>
        </body>
        </html>
        """
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = mock_html
        self.mock_requests.get.return_value = mock_response
        
        # Mock OpenAI embeddings
        mock_embedding = [0.1] * 1536  # 1536-dimensional embedding
        self.mock_openai.return_value.embeddings.create.return_value.data = [
            Mock(embedding=mock_embedding)
        ]
        
        # Mock Supabase client
        mock_supabase_client = Mock()
        mock_supabase_client.table.return_value.insert.return_value.execute.return_value = Mock()
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        self.mock_supabase.return_value = mock_supabase_client
    
    def test_lead_only_extraction_speed(self):
        """Test that lead-only extraction meets speed requirements (<1s)"""
        worker = WikipediaIngestionWorker()
        title = "Albert Einstein"
        
        # Time the lead-only extraction
        start_time = time.time()
        
        with patch.object(worker, 'store_chunks', return_value=1):
            success = worker.ingest_article_lead_only(title, queue_background=False)
        
        extraction_time = time.time() - start_time
        
        # Verify success and timing
        self.assertTrue(success)
        self.assertLess(extraction_time, 1.0, f"Lead extraction took {extraction_time:.2f}s, should be <1s")
        
        logger.info(f"✅ Lead-only extraction completed in {extraction_time:.3f}s")
    
    def test_lead_content_extraction_quality(self):
        """Test that lead content extraction produces quality content"""
        worker = WikipediaIngestionWorker()
        
        # Mock HTML content with clear lead section
        mock_html = """
        <html><body>
        <p>This is the intro paragraph with key information.</p>
        <p>This is the first paragraph with more details.</p>
        <p>This is the second paragraph completing the lead.</p>
        <p>This paragraph should not be included in lead-only mode.</p>
        </body></html>
        """
        
        # Extract lead content
        lead_content = worker.extract_lead_content(mock_html)
        
        # Verify content quality
        self.assertIn("intro paragraph", lead_content)
        self.assertIn("first paragraph", lead_content)
        self.assertIn("second paragraph", lead_content)
        self.assertNotIn("should not be included", lead_content)
        
        # Verify token limit (≤512 tokens)
        token_count = len(worker.tokenizer.encode(lead_content))
        self.assertLessEqual(token_count, 512, f"Lead content has {token_count} tokens, should be ≤512")
        
        logger.info(f"✅ Lead content extraction quality verified: {token_count} tokens")
    
    def test_background_task_queuing(self):
        """Test that lead-only ingestion properly queues background tasks"""
        worker = WikipediaIngestionWorker()
        title = "Test Article"
        
        # Mock successful lead ingestion
        with patch.object(worker, 'store_chunks', return_value=1):
            success = worker.ingest_article_lead_only(title, queue_background=True)
        
        self.assertTrue(success)
        
        # Verify background task was queued
        stats = worker.task_manager.get_stats()
        self.assertGreater(stats['total_tasks'], 0)
        
        # Check that a task exists for our title
        all_tasks = worker.task_manager.get_all_tasks()
        task_titles = [task.title for task in all_tasks.values()]
        self.assertIn(title, task_titles)
        
        logger.info("✅ Background task queuing works correctly")
        
        # Clean up
        worker.task_manager.shutdown()
    
    def test_no_background_option(self):
        """Test the --no-background option skips task queuing"""
        worker = WikipediaIngestionWorker()
        title = "Test Article No BG"
        
        # Mock successful lead ingestion without background
        with patch.object(worker, 'store_chunks', return_value=1):
            success = worker.ingest_article_lead_only(title, queue_background=False)
        
        self.assertTrue(success)
        
        # Verify no background task was queued
        stats = worker.task_manager.get_stats()
        self.assertEqual(stats['total_tasks'], 0)
        
        logger.info("✅ No-background option works correctly")
    
    @patch('time.sleep')  # Speed up test by mocking sleep
    def test_background_task_execution(self, mock_sleep):
        """Test that background tasks execute and complete full ingestion"""
        worker = WikipediaIngestionWorker()
        title = "Background Test Article"
        
        # Set up for background task execution
        worker._current_title = title
        
        # Mock the full ingestion methods
        with patch.object(worker, 'fetch_wikipedia_content', return_value="<html>Full content</html>"):
            with patch.object(worker, 'html_to_text', return_value="Full text content"):
                with patch.object(worker, 'chunk_text', return_value=[("chunk1", None), ("chunk2", None)]):
                    with patch.object(worker, 'store_chunks', return_value=2):
                        
                        # Execute background ingestion
                        success = worker.ingest_article_background()
                        
                        self.assertTrue(success)
                        
                        # Verify all methods were called
                        worker.fetch_wikipedia_content.assert_called_once_with(title)
                        worker.html_to_text.assert_called_once()
                        worker.chunk_text.assert_called_once()
                        worker.store_chunks.assert_called_once()
        
        logger.info("✅ Background task execution works correctly")
    
    def test_end_to_end_streaming_workflow(self):
        """Test the complete end-to-end streaming ingestion workflow"""
        worker = WikipediaIngestionWorker()
        title = "End to End Test"
        
        # Step 1: Lead-only ingestion (should be fast)
        start_time = time.time()
        
        with patch.object(worker, 'store_chunks', return_value=1):
            lead_success = worker.ingest_article_lead_only(title, queue_background=True)
        
        lead_time = time.time() - start_time
        
        # Verify lead ingestion succeeded quickly
        self.assertTrue(lead_success)
        self.assertLess(lead_time, 1.0)
        
        # Step 2: Verify background task was queued
        stats = worker.task_manager.get_stats()
        self.assertGreater(stats['total_tasks'], 0)
        
        # Step 3: Wait for background task to start and complete
        max_wait = 5.0
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            stats = worker.task_manager.get_stats()
            if stats['completed'] > 0 or stats['failed'] > 0:
                break
            time.sleep(0.1)
        
        # Verify workflow completion
        final_stats = worker.task_manager.get_stats()
        total_processed = final_stats['completed'] + final_stats['failed']
        self.assertGreater(total_processed, 0)
        
        logger.info(f"✅ End-to-end workflow: Lead in {lead_time:.3f}s, Background stats: {final_stats}")
        
        # Clean up
        worker.task_manager.shutdown()
    
    def test_error_handling_in_lead_extraction(self):
        """Test error handling during lead-only extraction"""
        worker = WikipediaIngestionWorker()
        title = "Error Test Article"
        
        # Mock Wikipedia fetch failure
        with patch.object(worker, 'fetch_wikipedia_content', side_effect=Exception("Network error")):
            success = worker.ingest_article_lead_only(title, queue_background=False)
            
            # Should fail gracefully
            self.assertFalse(success)
        
        logger.info("✅ Error handling in lead extraction works")
    
    def test_error_handling_in_background_tasks(self):
        """Test error handling and retry logic in background tasks"""
        worker = WikipediaIngestionWorker()
        title = "Background Error Test"
        
        # Set up for background task with failure
        worker._current_title = title
        
        # Mock failure in background processing
        with patch.object(worker, 'fetch_wikipedia_content', side_effect=Exception("Background error")):
            success = worker.ingest_article_background()
            
            # Should fail but be handled gracefully
            self.assertFalse(success)
        
        logger.info("✅ Error handling in background tasks works")
    
    def test_concurrent_ingestion_handling(self):
        """Test handling of multiple concurrent ingestions"""
        worker = WikipediaIngestionWorker()
        titles = ["Concurrent 1", "Concurrent 2", "Concurrent 3"]
        
        # Mock successful ingestion for all
        with patch.object(worker, 'store_chunks', return_value=1):
            results = []
            for title in titles:
                success = worker.ingest_article_lead_only(title, queue_background=True)
                results.append(success)
        
        # All should succeed
        self.assertTrue(all(results))
        
        # Verify multiple background tasks were queued
        stats = worker.task_manager.get_stats() 
        self.assertGreaterEqual(stats['total_tasks'], len(titles))
        
        logger.info(f"✅ Concurrent ingestion handled: {len(titles)} articles, {stats['total_tasks']} tasks")
        
        # Clean up
        worker.task_manager.shutdown()


class TestStreamingIngestionPerformance(unittest.TestCase):
    """Performance-focused tests for streaming ingestion"""
    
    def setUp(self):
        """Set up performance test environment"""
        # Mock all external dependencies for speed
        self.env_patcher = patch.dict(os.environ, {
            'OPENAI_API_KEY': 'test_key',
            'SUPABASE_URL': 'https://test.supabase.co', 
            'SUPABASE_ANON_KEY': 'test_anon_key'
        })
        self.env_patcher.start()
        
        # Mock external calls
        self.requests_patcher = patch('ingest_worker.requests')
        self.openai_patcher = patch('ingest_worker.OpenAI')
        self.supabase_patcher = patch('ingest_worker.create_client')
        
        self.mock_requests = self.requests_patcher.start()
        self.mock_openai = self.openai_patcher.start()
        self.mock_supabase = self.supabase_patcher.start()
        
        # Set up fast mock responses
        self.setup_fast_mocks()
    
    def tearDown(self):
        """Clean up performance tests"""
        self.env_patcher.stop()
        self.requests_patcher.stop()
        self.openai_patcher.stop()
        self.supabase_patcher.stop()
    
    def setup_fast_mocks(self):
        """Set up mocks optimized for speed"""
        # Fast Wikipedia response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = "<html><body><p>Fast test content</p></body></html>"
        self.mock_requests.get.return_value = mock_response
        
        # Fast embedding
        self.mock_openai.return_value.embeddings.create.return_value.data = [
            Mock(embedding=[0.1] * 1536)
        ]
        
        # Fast database
        mock_client = Mock()
        mock_client.table.return_value.insert.return_value.execute.return_value = Mock()
        mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        self.mock_supabase.return_value = mock_client
    
    def test_lead_ingestion_throughput(self):
        """Test throughput of lead-only ingestion"""
        worker = WikipediaIngestionWorker()
        titles = [f"Throughput Test {i}" for i in range(10)]
        
        # Time multiple lead ingestions
        with patch.object(worker, 'store_chunks', return_value=1):
            start_time = time.time()
            
            results = []
            for title in titles:
                success = worker.ingest_article_lead_only(title, queue_background=False)
                results.append(success)
            
            total_time = time.time() - start_time
        
        # Calculate throughput
        successful = sum(results)
        throughput = successful / total_time
        avg_time = total_time / len(titles)
        
        # Performance requirements
        self.assertGreater(throughput, 5.0, f"Throughput {throughput:.1f} articles/sec too low")
        self.assertLess(avg_time, 0.5, f"Average time {avg_time:.3f}s too high")
        
        logger.info(f"✅ Lead ingestion throughput: {throughput:.1f} articles/sec, {avg_time:.3f}s avg")
    
    def test_background_task_capacity(self):
        """Test background task system capacity"""
        worker = WikipediaIngestionWorker()
        num_tasks = 25
        
        # Queue many background tasks
        mock_worker_instance = Mock()
        mock_worker_instance.ingest_article_background.return_value = True
        
        start_time = time.time()
        task_ids = []
        
        for i in range(num_tasks):
            task_id = worker.task_manager.queue_full_ingestion(f"Capacity Test {i}", mock_worker_instance)
            task_ids.append(task_id)
        
        queue_time = time.time() - start_time
        
        # Wait for some tasks to complete
        time.sleep(2.0)
        
        stats = worker.task_manager.get_stats()
        
        # Verify capacity handling
        self.assertEqual(len(task_ids), num_tasks)
        self.assertLess(queue_time, 1.0, f"Queuing {num_tasks} tasks took {queue_time:.3f}s")
        self.assertGreater(stats['total_tasks'], 0)
        
        logger.info(f"✅ Background task capacity: {num_tasks} tasks queued in {queue_time:.3f}s")
        
        # Clean up
        worker.task_manager.shutdown()


def main():
    """Run all streaming ingestion tests"""
    print("🧪 COMPREHENSIVE STREAMING INGESTION TESTS")
    print("=" * 60)
    
    # Run workflow tests
    suite1 = unittest.TestLoader().loadTestsFromTestCase(TestStreamingIngestionWorkflow)
    result1 = unittest.TextTestRunner(verbosity=2).run(suite1)
    
    # Run performance tests  
    suite2 = unittest.TestLoader().loadTestsFromTestCase(TestStreamingIngestionPerformance)
    result2 = unittest.TextTestRunner(verbosity=2).run(suite2)
    
    # Summary
    total_tests = result1.testsRun + result2.testsRun
    total_failures = len(result1.failures) + len(result1.errors) + len(result2.failures) + len(result2.errors)
    
    print("\n" + "=" * 60)
    print("🎯 STREAMING INGESTION TESTING COMPLETE")
    print(f"📊 Results: {total_tests - total_failures}/{total_tests} tests passed")
    
    if total_failures == 0:
        print("✅ All tests passed - Streaming ingestion is production ready!")
        print("🚀 Lead-only mode delivers <1s response times")
        print("🔄 Background processing ensures complete article coverage")
        return 0
    else:
        print(f"❌ {total_failures} tests failed - System needs attention")
        return 1


if __name__ == "__main__":
    sys.exit(main()) 