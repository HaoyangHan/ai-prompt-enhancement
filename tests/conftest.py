import pytest
from typing import Generator
from unittest.mock import MagicMock, AsyncMock
from fastapi.testclient import TestClient
import asyncio

from ai_prompt_enhancement.main import app
from ai_prompt_enhancement.services.model_service import ModelService
from ai_prompt_enhancement.services.evaluation_service import EvaluationService
from ai_prompt_enhancement.services.prompt_service import PromptService

@pytest.fixture
def mock_model_service():
    """Mock model service for testing."""
    service = MagicMock(spec=ModelService)
    service.get_capabilities = AsyncMock(return_value={
        "supported_models": ["gpt-4", "gpt-3.5-turbo"],
        "features": ["prompt_analysis", "prompt_comparison"]
    })
    service.get_status = AsyncMock(return_value={"status": "operational"})
    return service

@pytest.fixture
def mock_evaluation_service():
    """Mock evaluation service for testing."""
    service = MagicMock(spec=EvaluationService)
    
    async def mock_evaluate_prompt(*args, **kwargs):
        return {
            "overall_score": 0.85,
            "criteria_scores": {
                "clarity": 0.9,
                "specificity": 0.8
            },
            "feedback": [
                "Prompt is clear and well-structured",
                "Could be more specific about the sorting algorithm"
            ],
            "passed_thresholds": True
        }

    async def mock_evaluate_prompts_batch(*args, **kwargs):
        return {
            "total_prompts": 2,
            "passed_prompts": 2,
            "average_score": 0.85,
            "results": {
                "prompt_1": {
                    "overall_score": 0.85,
                    "criteria_scores": {"clarity": 0.9, "specificity": 0.8},
                    "feedback": ["Prompt is clear"],
                    "passed_thresholds": True
                },
                "prompt_2": {
                    "overall_score": 0.85,
                    "criteria_scores": {"clarity": 0.9, "specificity": 0.8},
                    "feedback": ["Prompt is clear"],
                    "passed_thresholds": True
                }
            }
        }

    service.evaluate_prompt.side_effect = mock_evaluate_prompt
    service.evaluate_prompts_batch.side_effect = mock_evaluate_prompts_batch
    return service

@pytest.fixture
def mock_prompt_service():
    """Mock prompt service for testing."""
    service = MagicMock(spec=PromptService)
    service.analyze_prompt = AsyncMock(return_value={
        "metrics": {"length": 50, "complexity": 0.7},
        "suggestions": ["Make it clearer"],
        "enhanced_prompt": "Enhanced test prompt"
    })
    service.compare_prompts = AsyncMock(return_value={
        "similarity_score": 0.8,
        "differences": ["Different context"],
        "recommendations": ["Use more specific terms"]
    })
    return service

@pytest.fixture
def client(
    mock_model_service,
    mock_evaluation_service,
    mock_prompt_service
) -> Generator:
    """Fixture for FastAPI test client."""
    app.dependency_overrides = {
        ModelService: lambda: mock_model_service,
        EvaluationService: lambda: mock_evaluation_service,
        PromptService: lambda: mock_prompt_service
    }
    
    client = TestClient(app)
    yield client
    
    app.dependency_overrides = {}

@pytest.fixture
def mock_deepseek_service():
    """Fixture for mocked DeepseekService."""
    service = MagicMock()
    
    async def mock_analyze_prompt(*args, **kwargs):
        return {
            "metrics": {
                "clarity": 0.85,
                "specificity": 0.75,
                "completeness": 0.90
            },
            "suggestions": [
                "Consider specifying the return type of the function",
                "Add example inputs and expected outputs"
            ],
            "enhanced_prompt": "Write a Python function that calculates the nth Fibonacci number."
        }
    
    async def mock_get_capabilities(*args, **kwargs):
        return [{
            "name": "deepseek-chat",
            "version": "1.0.0",
            "capabilities": ["prompt analysis", "code generation"],
            "max_tokens": 8192,
            "supported_languages": ["en"]
        }]
    
    async def mock_get_status(*args, **kwargs):
        return [{
            "name": "deepseek-chat",
            "status": "healthy",
            "latency": 0.5,
            "requests_per_minute": 100,
            "error_rate": 0.1
        }]
    
    service.analyze_prompt = AsyncMock(side_effect=mock_analyze_prompt)
    service.get_capabilities = AsyncMock(side_effect=mock_get_capabilities)
    service.get_status = AsyncMock(side_effect=mock_get_status)
    return service

@pytest.fixture
def mock_evaluation_service():
    """Fixture for mocked EvaluationService."""
    service = MagicMock()
    
    async def mock_evaluate_prompt(*args, **kwargs):
        return {
            "overall_score": 0.85,
            "criteria_scores": {
                "clarity": 0.9,
                "specificity": 0.8
            },
            "feedback": [
                "Prompt is clear and well-structured",
                "Could be more specific about the sorting algorithm"
            ],
            "passed_thresholds": True
        }
    
    async def mock_evaluate_prompts_batch(*args, **kwargs):
        return {
            "total_prompts": 2,
            "passed_prompts": 2,
            "average_score": 0.85,
            "results": {
                "prompt_1": {
                    "overall_score": 0.85,
                    "criteria_scores": {"clarity": 0.9, "specificity": 0.8},
                    "feedback": ["Prompt is clear"],
                    "passed_thresholds": True
                },
                "prompt_2": {
                    "overall_score": 0.85,
                    "criteria_scores": {"clarity": 0.9, "specificity": 0.8},
                    "feedback": ["Prompt is clear"],
                    "passed_thresholds": True
                }
            }
        }
    
    service.evaluate_prompt = AsyncMock(side_effect=mock_evaluate_prompt)
    service.evaluate_prompts_batch = AsyncMock(side_effect=mock_evaluate_prompts_batch)
    return service

@pytest.fixture
def event_loop():
    """Fixture for async tests."""
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()