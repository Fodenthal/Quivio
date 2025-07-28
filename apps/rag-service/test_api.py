#!/usr/bin/env python3
"""
Test script to validate RAG Service API functionality
"""

import asyncio
import os
import sys
from typing import Literal
from unittest.mock import Mock, patch

from fastapi import Request

from main import ContextRequest, get_context, health_check
from vector_store import VectorStore


async def test_health_endpoint() -> bool:
    """Test the health check endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        health_response = await health_check()
        assert health_response["status"] in ["healthy", "unhealthy"]
        assert "llamaindex_imports" in health_response["checks"]
        print("✅ Health endpoint works correctly")
        print(f"   Status: {health_response['status']}")
        print(f"   LlamaIndex: {health_response['checks']['llamaindex_imports']['status']}")
        return True
    except Exception as e:
        print(f"❌ Health endpoint failed: {e}")
        return False


async def test_vector_store_initialization() -> bool:
    """Test vector store initialization and connectivity"""
    print("\n🔍 Testing vector store initialization...")
    try:
        # Check environment variables
        required_vars = ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        
        if missing_vars:
            print(f"⚠️  Missing environment variables: {missing_vars}")
            print("   Skipping vector store tests - this is expected in CI")
            return True
        
        # Test vector store initialization
        vector_store = VectorStore()
        assert vector_store.openai_client is not None
        assert vector_store.supabase is not None
        print("✅ Vector store initialized successfully")
        
        # Test basic embedding generation
        test_text = "This is a test embedding"
        embedding = vector_store.generate_embedding(test_text)
        assert len(embedding) > 0
        assert all(isinstance(x, float) for x in embedding)
        print("✅ Embedding generation works")
        
        return True
        
    except Exception as e:
        print(f"❌ Vector store initialization failed: {e}")
        return False


async def test_database_connectivity() -> bool:
    """Test Supabase database connectivity"""
    print("\n🔍 Testing database connectivity...")
    try:
        # Check if environment variables are set
        if not all([os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY')]):
            print("⚠️  Missing Supabase credentials - skipping database tests")
            return True
        
        vector_store = VectorStore()
        
        # Test basic database query
        response = vector_store.supabase.table("wiki_chunks").select("count", count="exact").execute()
        assert response is not None
        print("✅ Database connectivity verified")
        
        # Test vector_search function exists (if table is set up)
        try:
            # This will fail if the function doesn't exist, which is expected
            # We're just testing that we can make the call
            test_embedding = [0.1] * 768  # Mock embedding
            response = vector_store.supabase.rpc('vector_search', {
                'query_embedding': test_embedding,
                'similarity_threshold': 0.1,
                'match_count': 1
            }).execute()
            print("✅ Vector search function accessible")
        except Exception as e:
            if "function" in str(e).lower() or "does not exist" in str(e).lower():
                print("⚠️  Vector search function not set up yet (expected)")
            else:
                print(f"❌ Vector search test failed: {e}")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Database connectivity failed: {e}")
        return False


async def test_error_handling() -> bool:
    """Test error handling scenarios"""
    print("\n🔍 Testing error handling...")
    
    mock_request = Mock(spec=Request)
    mock_request.state = Mock()
    mock_request.state.request_id = "test_errors"
    
    passed = 0
    total = 0
    
    # Test 1: Missing environment variables
    total += 1
    try:
        with patch.dict(os.environ, {}, clear=True):
            # This should fail gracefully
            vector_store = VectorStore()
            print("   ❌ Should have failed with missing env vars")
    except ValueError as e:
        if "environment variable" in str(e):
            passed += 1
            print("   ✅ Correctly handles missing environment variables")
        else:
            print(f"   ❌ Unexpected error: {e}")
    except Exception as e:
        print(f"   ❌ Error handling test failed: {e}")
    
    # Test 2: Invalid API responses
    total += 1
    try:
        with patch('vector_store.VectorStore.generate_embedding') as mock_embed:
            mock_embed.side_effect = Exception("API rate limit exceeded")
            
            request = ContextRequest(topic="Test Error", category="General")
            response = await get_context(request, mock_request)
            
            # Should return no content gracefully
            if response.source == "no_content":
                passed += 1
                print("   ✅ Gracefully handles API errors")
            else:
                print("   ❌ Should have returned no_content for API error")
    except Exception as e:
        print(f"   ❌ API error handling test failed: {e}")
    
    # Test 3: Network timeouts
    total += 1
    try:
        with patch('vector_store.VectorStore.search_similar_chunks') as mock_search:
            mock_search.side_effect = Exception("Connection timeout")
            
            request = ContextRequest(topic="Test Timeout", category="General")
            response = await get_context(request, mock_request)
            
            if response.source == "no_content":
                passed += 1
                print("   ✅ Gracefully handles network timeouts")
            else:
                print("   ❌ Should have returned no_content for timeout")
    except Exception as e:
        print(f"   ❌ Timeout handling test failed: {e}")
    
    print(f"✅ Error handling: {passed}/{total} scenarios handled correctly")
    return passed == total


async def test_context_endpoint() -> bool:
    """Test the context retrieval endpoint"""
    print("\n🔍 Testing context endpoint...")

    # Mock HTTP request
    mock_request = Mock(spec=Request)
    mock_request.state = Mock()
    mock_request.state.request_id = "test_12345"

    try:
        # Test valid request
        request = ContextRequest(topic="World War II", category="History", max_context_length=500)

        response = await get_context(request, mock_request)

        # Validate response structure
        assert response.context is not None
        assert response.source in ["wikipedia", "no_content", "web_search", "placeholder"]
        assert 0.0 <= response.confidence <= 1.0
        assert response.request_id == "test_12345"
        assert response.processing_time_ms >= 0
        assert "topic_normalized" in response.metadata

        print("✅ Context endpoint works correctly")
        print(f"   Topic: {response.metadata['topic_normalized']}")
        print(f"   Source: {response.source}")
        print(f"   Confidence: {response.confidence}")
        print(f"   Processing time: {response.processing_time_ms}ms")
        print(f"   Context length: {len(response.context)} characters")
        return True

    except Exception as e:
        print(f"❌ Context endpoint failed: {e}")
        return False


async def test_validation() -> bool:
    """Test input validation"""
    print("\n🔍 Testing input validation...")

    # Mock HTTP request
    mock_request = Mock(spec=Request)
    mock_request.state = Mock()
    mock_request.state.request_id = "test_validation"

    try:
        # Test with various inputs
        test_cases: list[
            tuple[str, Literal["News", "History", "Media", "Sports", "General"], bool]
        ] = [
            ("Valid Topic", "History", True),
            ("UFC 317", "Sports", True),
            ("Breaking News", "News", True),
            ("Marvel Movies", "Media", True),
        ]

        passed = 0
        for topic, category, should_pass in test_cases:
            try:
                request = ContextRequest(topic=topic, category=category)
                response = await get_context(request, mock_request)
                if should_pass:
                    passed += 1
                    print(f"   ✅ '{topic}' ({category}) -> {response.source}")
                else:
                    print(f"   ❌ '{topic}' should have failed validation")
            except Exception as e:
                if not should_pass:
                    passed += 1
                    print(f"   ✅ '{topic}' correctly rejected: {e}")
                else:
                    print(f"   ❌ '{topic}' unexpectedly failed: {e}")

        print(f"✅ Validation tests: {passed}/{len(test_cases)} passed")
        return passed == len(test_cases)

    except Exception as e:
        print(f"❌ Validation testing failed: {e}")
        return False


async def test_category_mapping() -> bool:
    """Test that different categories map to appropriate sources"""
    print("\n🔍 Testing category to source mapping...")

    mock_request = Mock(spec=Request)
    mock_request.state = Mock()
    mock_request.state.request_id = "test_mapping"

    # Check if vector store is available
    try:
        from vector_store import VectorStore
        # Try to create a vector store instance to see if it's available
        test_vs = VectorStore()
        vector_store_available = True
    except Exception:
        vector_store_available = False

    if not vector_store_available:
        print("⚠️  Vector store unavailable - all categories will return 'no_content'")
        expected_mapping: dict[Literal["News", "History", "Media", "Sports", "General"], str] = {
            "History": "no_content",
            "Media": "no_content", 
            "News": "no_content",
            "Sports": "no_content",
            "General": "no_content",
        }
    else:
        expected_mapping: dict[Literal["News", "History", "Media", "Sports", "General"], str] = {
            "History": "wikipedia",
            "Media": "wikipedia",
            "News": "wikipedia",  # Updated to match current implementation
            "Sports": "wikipedia",  # Updated to match current implementation
            "General": "wikipedia",
        }

    passed = 0
    for category, expected_source in expected_mapping.items():
        try:
            request = ContextRequest(topic=f"Test {category}", category=category)
            response = await get_context(request, mock_request)

            if response.source == expected_source:
                passed += 1
                print(f"   ✅ {category} -> {response.source}")
            else:
                print(f"   ❌ {category} -> {response.source} (expected {expected_source})")

        except Exception as e:
            print(f"   ❌ {category} failed: {e}")

    print(f"✅ Category mapping: {passed}/{len(expected_mapping)} correct")
    return passed == len(expected_mapping)


async def test_performance_metrics() -> bool:
    """Test that performance metrics are properly tracked"""
    print("\n🔍 Testing performance metrics...")
    
    mock_request = Mock(spec=Request)
    mock_request.state = Mock()
    mock_request.state.request_id = "test_performance"
    
    try:
        request = ContextRequest(topic="Performance Test", category="General")
        response = await get_context(request, mock_request)
        
        # Check that processing time is reasonable
        assert response.processing_time_ms >= 0
        assert response.processing_time_ms < 30000  # Should not take more than 30 seconds
        
        # Check that metadata contains expected fields
        expected_metadata_fields = [
            "topic_normalized", "category_processed", "language_requested", 
            "max_length_requested", "actual_length"
        ]
        
        for field in expected_metadata_fields:
            assert field in response.metadata, f"Missing metadata field: {field}"
        
        print("✅ Performance metrics tracked correctly")
        print(f"   Processing time: {response.processing_time_ms}ms")
        print(f"   Metadata fields: {list(response.metadata.keys())}")
        return True
        
    except Exception as e:
        print(f"❌ Performance metrics test failed: {e}")
        return False


async def main() -> int:
    """Run all tests"""
    print("🚀 Starting RAG Service API Tests")
    print("=" * 50)

    tests = [
        test_health_endpoint(),
        test_vector_store_initialization(),
        test_database_connectivity(),
        test_error_handling(),
        test_context_endpoint(),
        test_validation(),
        test_category_mapping(),
        test_performance_metrics(),
    ]

    results = await asyncio.gather(*tests, return_exceptions=True)

    passed = sum(1 for result in results if result is True)
    total = len(results)

    print("\n" + "=" * 50)
    print(f"🎯 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("✅ All tests passed! API is ready for integration.")
        return 0
    print("❌ Some tests failed. Please check the output above.")
    return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
