"""
Background Task Management System

Handles asynchronous background processing for full article ingestion
after lead-only content has been delivered for immediate use.

This enables streaming ingestion: deliver lead content quickly (<1s) while
full article processing happens in the background.
"""

import asyncio
import logging
import time
import threading
from concurrent.futures import ThreadPoolExecutor
from enum import Enum
from typing import Dict, Optional, Callable, Any
from dataclasses import dataclass, field
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    """Status of background tasks"""
    PENDING = "pending"
    RUNNING = "running" 
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class BackgroundTask:
    """Represents a background task with metadata"""
    id: str
    title: str
    task_type: str
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime = field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3


class BackgroundTaskManager:
    """
    Manages background tasks for streaming Wikipedia ingestion
    
    Handles task queuing, execution, monitoring, and error recovery
    for full article ingestion that runs after lead-only processing.
    """
    
    def __init__(self, max_workers: int = 2, max_concurrent_tasks: int = 5):
        """
        Initialize the background task manager
        
        Args:
            max_workers: Maximum number of worker threads
            max_concurrent_tasks: Maximum number of concurrent tasks
        """
        self.max_workers = max_workers
        self.max_concurrent_tasks = max_concurrent_tasks
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        self.tasks: Dict[str, BackgroundTask] = {}
        self.running_tasks: Dict[str, asyncio.Task] = {}
        self._shutdown = False
        self._lock = threading.Lock()
        
        logger.info(f"Background task manager initialized: {max_workers} workers, {max_concurrent_tasks} max concurrent")
    
    def queue_full_ingestion(self, title: str, worker_instance: Any) -> str:
        """
        Queue a full article ingestion task to run in the background
        
        Args:
            title: Wikipedia article title to ingest
            worker_instance: WikipediaIngestionWorker instance to use
            
        Returns:
            Task ID for tracking
        """
        task_id = str(uuid.uuid4())
        
        task = BackgroundTask(
            id=task_id,
            title=title,
            task_type="full_ingestion",
            max_retries=2  # Fewer retries for background tasks
        )
        
        with self._lock:
            if len(self.running_tasks) >= self.max_concurrent_tasks:
                logger.warning(f"Maximum concurrent tasks ({self.max_concurrent_tasks}) reached, queuing task: {title}")
            
            self.tasks[task_id] = task
        
        # Schedule the task execution
        self._schedule_task(task_id, self._execute_full_ingestion, worker_instance)
        
        logger.info(f"Queued full ingestion task for '{title}' [ID: {task_id}]")
        return task_id
    
    def _schedule_task(self, task_id: str, task_func: Callable, *args) -> None:
        """Schedule a task for execution"""
        try:
            # Submit to thread pool executor
            future = self.executor.submit(self._run_task_with_error_handling, task_id, task_func, *args)
            
            # Keep track of the future for monitoring
            with self._lock:
                # We can't directly store asyncio.Task here since we're using ThreadPoolExecutor
                # Instead, we'll track the task in our tasks dict
                if task_id in self.tasks:
                    self.tasks[task_id].status = TaskStatus.PENDING
                    
        except Exception as e:
            logger.error(f"Failed to schedule task {task_id}: {e}")
            self._mark_task_failed(task_id, str(e))
    
    def _run_task_with_error_handling(self, task_id: str, task_func: Callable, *args) -> None:
        """Execute a task with comprehensive error handling and retry logic"""
        task = self.tasks.get(task_id)
        if not task:
            logger.error(f"Task {task_id} not found")
            return
        
        max_retries = task.max_retries
        
        for attempt in range(max_retries + 1):
            try:
                # Mark task as running
                with self._lock:
                    task.status = TaskStatus.RUNNING
                    task.started_at = datetime.utcnow()
                    task.retry_count = attempt
                
                logger.info(f"Starting background task '{task.title}' [ID: {task_id}] (attempt {attempt + 1}/{max_retries + 1})")
                
                # Execute the actual task
                success = task_func(*args)
                
                if success:
                    # Task completed successfully
                    with self._lock:
                        task.status = TaskStatus.COMPLETED
                        task.completed_at = datetime.utcnow()
                    
                    duration = (task.completed_at - task.started_at).total_seconds()
                    logger.info(f"✅ Background task completed: '{task.title}' [ID: {task_id}] in {duration:.1f}s")
                    return
                else:
                    # Task failed, but we might retry
                    if attempt < max_retries:
                        wait_time = 2 ** attempt  # Exponential backoff
                        logger.warning(f"Background task failed (attempt {attempt + 1}), retrying in {wait_time}s: {task.title}")
                        time.sleep(wait_time)
                        continue
                    else:
                        self._mark_task_failed(task_id, "Task returned False after all retries")
                        return
                        
            except Exception as e:
                error_msg = f"Task execution error (attempt {attempt + 1}): {e}"
                logger.error(f"Background task error: '{task.title}' [ID: {task_id}] - {error_msg}")
                
                if attempt < max_retries:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.info(f"Retrying background task in {wait_time}s: {task.title}")
                    time.sleep(wait_time)
                    continue
                else:
                    self._mark_task_failed(task_id, error_msg)
                    return
        
        # If we get here, all retries failed
        self._mark_task_failed(task_id, "All retry attempts exhausted")
    
    def _execute_full_ingestion(self, worker_instance: Any) -> bool:
        """Execute full article ingestion using the worker instance"""
        try:
            # Get the task info to know which title to ingest
            # We need to pass the title somehow - let's modify this approach
            return worker_instance.ingest_article_background()
        except Exception as e:
            logger.error(f"Full ingestion execution failed: {e}")
            return False
    
    def _mark_task_failed(self, task_id: str, error_message: str) -> None:
        """Mark a task as failed with error details"""
        with self._lock:
            task = self.tasks.get(task_id)
            if task:
                task.status = TaskStatus.FAILED
                task.error_message = error_message
                task.completed_at = datetime.utcnow()
        
        logger.error(f"❌ Background task failed: [ID: {task_id}] - {error_message}")
    
    def get_task_status(self, task_id: str) -> Optional[BackgroundTask]:
        """Get the current status of a task"""
        with self._lock:
            return self.tasks.get(task_id)
    
    def get_all_tasks(self) -> Dict[str, BackgroundTask]:
        """Get all tasks with their current status"""
        with self._lock:
            return self.tasks.copy()
    
    def cancel_task(self, task_id: str) -> bool:
        """Cancel a pending or running task"""
        with self._lock:
            task = self.tasks.get(task_id)
            if not task:
                return False
            
            if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
                return False  # Cannot cancel already finished tasks
            
            task.status = TaskStatus.CANCELLED
            task.completed_at = datetime.utcnow()
        
        logger.info(f"Cancelled background task: [ID: {task_id}]")
        return True
    
    def cleanup_completed_tasks(self, max_age_hours: int = 24) -> int:
        """Clean up old completed tasks to prevent memory leaks"""
        cutoff_time = datetime.utcnow().timestamp() - (max_age_hours * 3600)
        removed_count = 0
        
        with self._lock:
            task_ids_to_remove = []
            
            for task_id, task in self.tasks.items():
                if (task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED] and
                    task.completed_at and 
                    task.completed_at.timestamp() < cutoff_time):
                    task_ids_to_remove.append(task_id)
            
            for task_id in task_ids_to_remove:
                del self.tasks[task_id]
                removed_count += 1
        
        if removed_count > 0:
            logger.info(f"Cleaned up {removed_count} old background tasks")
        
        return removed_count
    
    def get_stats(self) -> Dict[str, Any]:
        """Get background task manager statistics"""
        with self._lock:
            stats = {
                'total_tasks': len(self.tasks),
                'pending': sum(1 for t in self.tasks.values() if t.status == TaskStatus.PENDING),
                'running': sum(1 for t in self.tasks.values() if t.status == TaskStatus.RUNNING),
                'completed': sum(1 for t in self.tasks.values() if t.status == TaskStatus.COMPLETED),
                'failed': sum(1 for t in self.tasks.values() if t.status == TaskStatus.FAILED),
                'cancelled': sum(1 for t in self.tasks.values() if t.status == TaskStatus.CANCELLED),
                'max_workers': self.max_workers,
                'max_concurrent_tasks': self.max_concurrent_tasks,
            }
        
        return stats
    
    def shutdown(self, wait: bool = True, timeout: float = 30.0) -> None:
        """Shutdown the background task manager gracefully"""
        logger.info("Shutting down background task manager...")
        self._shutdown = True
        
        if wait:
            # Note: timeout parameter not supported in Python 3.9 ThreadPoolExecutor
            self.executor.shutdown(wait=True)
        else:
            self.executor.shutdown(wait=False)
        
        logger.info("Background task manager shutdown complete")


# Global task manager instance
_task_manager: Optional[BackgroundTaskManager] = None

def get_task_manager() -> BackgroundTaskManager:
    """Get or create the global background task manager instance"""
    global _task_manager
    if _task_manager is None:
        _task_manager = BackgroundTaskManager()
    return _task_manager 