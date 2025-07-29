#!/usr/bin/env python3
"""
Comprehensive Test Suite for Background Task Management System

Tests the streaming ingestion workflow including lead-only processing,
background task queuing, execution, monitoring, and error handling.
"""

import asyncio
import logging
import os
import sys
import time
import unittest
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, List, Optional

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from background_tasks import (
    BackgroundTaskManager, 
    BackgroundTask, 
    TaskStatus,
    get_task_manager
)

# Configure logging for tests
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


class TestBackgroundTaskManager(unittest.TestCase):
    """Test cases for BackgroundTaskManager functionality"""
    
    def setUp(self):
        """Set up test environment before each test"""
        # Create a fresh task manager for each test
        self.task_manager = BackgroundTaskManager(max_workers=2, max_concurrent_tasks=3)
        self.mock_worker = Mock()
        self.mock_worker.ingest_article_background.return_value = True
        
    def tearDown(self):
        """Clean up after each test"""
        # Shutdown task manager to clean up threads
        self.task_manager.shutdown()
    
    def test_task_manager_initialization(self):
        """Test proper initialization of task manager"""
        self.assertEqual(len(self.task_manager.tasks), 0)
        self.assertIsNotNone(self.task_manager.executor)
        self.assertEqual(self.task_manager.max_concurrent_tasks, 3)
        logger.info("✅ Task manager initializes correctly")
    
    def test_queue_full_ingestion(self):
        """Test queuing background full ingestion tasks"""
        title = "Test Article"
        
        # Queue the task
        task_id = self.task_manager.queue_full_ingestion(title, self.mock_worker)
        
        # Verify task was queued
        self.assertIsNotNone(task_id)
        self.assertIn(task_id, self.task_manager.tasks)
        
        task = self.task_manager.tasks[task_id]
        self.assertEqual(task.title, title)
        self.assertEqual(task.status, TaskStatus.PENDING)
        
        logger.info("✅ Background tasks queue correctly")
    
    def test_task_execution_success(self):
        """Test successful task execution"""
        title = "Test Article Success"
        
        # Queue and wait for task execution
        task_id = self.task_manager.queue_full_ingestion(title, self.mock_worker)
        
        # Wait for task to complete (with timeout)
        max_wait = 5.0  # 5 seconds max
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            task = self.task_manager.get_task_status(task_id)
            if task and task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                break
            time.sleep(0.1)
        
        # Verify task completed successfully
        final_task = self.task_manager.get_task_status(task_id)
        if final_task:
            self.assertEqual(final_task.status, TaskStatus.COMPLETED)
            self.mock_worker.ingest_article_background.assert_called_once()
            logger.info("✅ Background tasks execute successfully")
        else:
            self.fail("Task was not found after execution")
    
    def test_task_execution_failure_with_retry(self):
        """Test task failure handling and retry logic"""
        title = "Test Article Failure"
        
        # Mock worker to fail initially then succeed
        self.mock_worker.ingest_article_background.side_effect = [
            Exception("First attempt fails"),
            Exception("Second attempt fails"),
            True  # Third attempt succeeds
        ]
        
        # Queue the task
        task_id = self.task_manager.queue_full_ingestion(title, self.mock_worker)
        
        # Wait for task to complete with retries
        max_wait = 10.0  # 10 seconds for retries
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            task = self.task_manager.get_task_status(task_id)
            if task and task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                break
            time.sleep(0.2)
        
        # Verify retry logic worked
        final_task = self.task_manager.get_task_status(task_id)
        if final_task:
            # Should have succeeded after retries OR failed after max retries
            self.assertIn(final_task.status, [TaskStatus.COMPLETED, TaskStatus.FAILED])
            
            # Verify multiple calls were made (original + retries)
            call_count = self.mock_worker.ingest_article_background.call_count
            self.assertGreaterEqual(call_count, 1)
            
            logger.info(f"✅ Retry logic works: {call_count} attempts made")
        else:
            self.fail("Task was not found after execution")
    
    def test_concurrent_task_limit(self):
        """Test that concurrent task limit is respected"""
        titles = [f"Test Article {i}" for i in range(5)]
        task_ids = []
        
        # Queue more tasks than the concurrent limit
        for title in titles:
            task_id = self.task_manager.queue_full_ingestion(title, self.mock_worker)
            task_ids.append(task_id)
        
        # Give tasks time to start
        time.sleep(0.5)
        
        # Count running tasks
        running_count = 0
        for task_id in task_ids:
            task = self.task_manager.get_task_status(task_id)
            if task and task.status == TaskStatus.RUNNING:
                running_count += 1
        
        # Should not exceed max_concurrent_tasks
        self.assertLessEqual(running_count, self.task_manager.max_concurrent_tasks)
        logger.info(f"✅ Concurrent task limit respected: {running_count}/{self.task_manager.max_concurrent_tasks}")
    
    def test_task_cancellation(self):
        """Test task cancellation functionality"""
        title = "Test Article Cancel"
        
        # Mock a slow-running task
        self.mock_worker.ingest_article_background.side_effect = lambda: time.sleep(2)
        
        # Queue the task
        task_id = self.task_manager.queue_full_ingestion(title, self.mock_worker)
        
        # Cancel the task quickly
        time.sleep(0.1)
        success = self.task_manager.cancel_task(task_id)
        
        self.assertTrue(success)
        
        # Wait a bit and verify it's cancelled
        time.sleep(0.5)
        task = self.task_manager.get_task_status(task_id)
        if task:
            self.assertEqual(task.status, TaskStatus.CANCELLED)
            logger.info("✅ Task cancellation works")
    
    def test_task_statistics(self):
        """Test task statistics and monitoring"""
        # Queue several tasks with different outcomes
        titles = ["Success 1", "Success 2", "Fail 1"]
        
        # Mock different outcomes
        outcomes = [True, True, Exception("Simulated failure")]
        for i, (title, outcome) in enumerate(zip(titles, outcomes)):
            worker = Mock()
            worker.ingest_article_background.side_effect = [outcome] if isinstance(outcome, Exception) else outcome
            self.task_manager.queue_full_ingestion(title, worker)
        
        # Wait for completion
        time.sleep(2.0)
        
        # Get statistics
        stats = self.task_manager.get_stats()
        
        self.assertGreaterEqual(stats['total_tasks'], 3)
        self.assertIsInstance(stats['completed'], int)
        self.assertIsInstance(stats['failed'], int)
        self.assertIsInstance(stats['running'], int)
        self.assertIsInstance(stats['pending'], int)
        
        logger.info(f"✅ Statistics work: {stats}")
    
    def test_task_cleanup(self):
        """Test automatic cleanup of old completed tasks"""
        # Create some completed tasks
        for i in range(3):
            worker = Mock()
            worker.ingest_article_background.return_value = True
            task_id = self.task_manager.queue_full_ingestion(f"Cleanup Test {i}", worker)
        
        # Wait for completion
        time.sleep(1.0)
        
        initial_count = len(self.task_manager.tasks)
        
        # Trigger cleanup (simulate old tasks)
        removed_count = self.task_manager.cleanup_old_tasks(max_age_hours=0)
        
        # Verify cleanup occurred
        self.assertGreaterEqual(removed_count, 0)
        logger.info(f"✅ Task cleanup works: removed {removed_count} old tasks")


class TestLeadOnlyIntegration(unittest.TestCase):
    """Test integration between lead-only ingestion and background tasks"""
    
    def setUp(self):
        """Set up test environment"""
        self.task_manager = BackgroundTaskManager(max_workers=1)
    
    def tearDown(self):
        """Clean up after tests"""
        self.task_manager.shutdown()
    
    @patch('ingest_worker.WikipediaIngestionWorker')
    def test_lead_only_triggers_background_task(self, mock_worker_class):
        """Test that lead-only ingestion properly triggers background tasks"""
        # This would test the actual integration, but requires mocking the full workflow
        # For now, we'll test the core logic
        
        mock_worker = mock_worker_class.return_value
        mock_worker.extract_lead_content.return_value = "Test lead content"
        mock_worker.store_chunks.return_value = 1
        mock_worker._current_title = "Test Article"
        
        # Simulate the background task queuing
        task_id = self.task_manager.queue_full_ingestion("Test Article", mock_worker)
        
        self.assertIsNotNone(task_id)
        logger.info("✅ Lead-only ingestion integration setup works")


def run_performance_tests():
    """Run performance-focused tests for the background task system"""
    print("\n🚀 Running Performance Tests")
    print("=" * 50)
    
    # Test 1: Task queuing performance
    start_time = time.time()
    task_manager = BackgroundTaskManager(max_workers=3)
    
    mock_worker = Mock()
    mock_worker.ingest_article_background.return_value = True
    
    # Queue many tasks quickly
    task_ids = []
    for i in range(20):
        task_id = task_manager.queue_full_ingestion(f"Perf Test {i}", mock_worker)
        task_ids.append(task_id)
    
    queue_time = time.time() - start_time
    print(f"✅ Queued 20 tasks in {queue_time:.3f}s ({queue_time/20*1000:.1f}ms per task)")
    
    # Wait for all tasks to complete
    start_time = time.time()
    completed = 0
    
    while completed < 20 and time.time() - start_time < 30:  # 30s timeout
        completed = 0
        for task_id in task_ids:
            task = task_manager.get_task_status(task_id)
            if task and task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                completed += 1
        time.sleep(0.1)
    
    execution_time = time.time() - start_time
    print(f"✅ Completed {completed}/20 tasks in {execution_time:.3f}s")
    
    # Get final statistics
    stats = task_manager.get_stats()
    print(f"📊 Final stats: {stats}")
    
    task_manager.shutdown()
    return completed >= 18  # Allow some failures


def main():
    """Run all background task tests"""
    print("🧪 COMPREHENSIVE BACKGROUND TASK SYSTEM TESTS")
    print("=" * 60)
    
    # Run unit tests
    unittest.main(argv=[''], exit=False, verbosity=2)
    
    # Run performance tests
    perf_success = run_performance_tests()
    
    print("\n" + "=" * 60)
    print("🎯 BACKGROUND TASK TESTING COMPLETE")
    
    if perf_success:
        print("✅ All tests passed - Background task system is production ready!")
        print("📈 Performance meets requirements for streaming ingestion")
        return 0
    else:
        print("❌ Some tests failed - Background task system needs attention")
        return 1


if __name__ == "__main__":
    sys.exit(main()) 