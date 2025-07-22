#!/usr/bin/env python3
"""
Test script to validate RAG Service API functionality
"""

import asyncio
import sys
from main import get_context, health_check, ContextRequest
from fastapi import Request
from unittest.mock import Mock

async def test_health_endpoint():
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

async def test_context_endpoint():
    """Test the context retrieval endpoint"""
    print("\n🔍 Testing context endpoint...")
    
    # Mock HTTP request
    mock_request = Mock(spec=Request)
    mock_request.state = Mock()
    mock_request.state.request_id = "test_12345"
    
    try:
        # Test valid request
        request = ContextRequest(
            topic="World War II",
            category="History",
            max_context_length=500
        )
        
        response = await get_context(request, mock_request)
        
        # Validate response structure
        assert response.context is not None
        assert response.source in ["wikipedia", "web_search", "placeholder"]
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

async def test_validation():
    """Test input validation"""
    print("\n🔍 Testing input validation...")
    
    # Mock HTTP request
    mock_request = Mock(spec=Request)
    mock_request.state = Mock()
    mock_request.state.request_id = "test_validation"
    
    try:
        # Test with various inputs
        test_cases = [
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

async def test_category_mapping():
    """Test that different categories map to appropriate sources"""
    print("\n🔍 Testing category to source mapping...")
    
    mock_request = Mock(spec=Request)
    mock_request.state = Mock()
    mock_request.state.request_id = "test_mapping"
    
    expected_mapping = {
        "History": "wikipedia",
        "Media": "wikipedia", 
        "News": "web_search",
        "Sports": "web_search",
        "General": "wikipedia"
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

async def main():
    """Run all tests"""
    print("🚀 Starting RAG Service API Tests")
    print("=" * 50)
    
    tests = [
        test_health_endpoint(),
        test_context_endpoint(),
        test_validation(),
        test_category_mapping()
    ]
    
    results = await asyncio.gather(*tests, return_exceptions=True)
    
    passed = sum(1 for result in results if result is True)
    total = len(results)
    
    print("\n" + "=" * 50)
    print(f"🎯 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✅ All tests passed! API is ready for integration.")
        return 0
    else:
        print("❌ Some tests failed. Please check the output above.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code) 