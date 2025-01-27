import pytest
from fastapi import status
from datetime import datetime

def test_analyze_prompt_endpoint(test_client, sample_prompt):
    """Test the prompt analysis endpoint"""
    response = test_client.post(
        "/api/v1/prompts/analyze",
        json={
            "prompt_text": sample_prompt,
            "model_type": "gpt-3.5-turbo"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Check response structure
    assert "overall_score" in data
    assert "metrics" in data
    assert "suggestions" in data
    assert "model_type" in data
    assert "timestamp" in data
    
    # Validate score ranges
    assert 0 <= data["overall_score"] <= 1
    for metric in data["metrics"].values():
        assert 0 <= metric["score"] <= 1

def test_analyze_prompt_with_context(test_client, sample_prompt, sample_context):
    """Test prompt analysis with additional context"""
    response = test_client.post(
        "/api/v1/prompts/analyze",
        json={
            "prompt_text": sample_prompt,
            "model_type": "gpt-4",
            "context": sample_context
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["model_type"] == "gpt-4"

def test_analyze_prompt_invalid_request(test_client):
    """Test error handling for invalid requests"""
    response = test_client.post(
        "/api/v1/prompts/analyze",
        json={
            "prompt_text": "",  # Empty prompt
            "model_type": "gpt-3.5-turbo"
        }
    )
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_analyze_prompt_invalid_model(test_client, sample_prompt):
    """Test error handling for invalid model type"""
    response = test_client.post(
        "/api/v1/prompts/analyze",
        json={
            "prompt_text": sample_prompt,
            "model_type": "invalid-model"  # Invalid model type
        }
    )
    
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_health_check(test_client):
    """Test the health check endpoint"""
    response = test_client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"status": "healthy"} 