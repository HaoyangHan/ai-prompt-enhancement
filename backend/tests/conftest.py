import pytest
from fastapi.testclient import TestClient
from typing import Generator
import asyncio
from unittest.mock import MagicMock

from ai_prompt_enhancement.main import app
from ai_prompt_enhancement.core.config import get_settings
from ai_prompt_enhancement.services.model.deepseek_service import DeepseekService
from ai_prompt_enhancement.services.prompt_refinement.refinement_service import RefinementService
from ai_prompt_enhancement.services.evaluation.evaluation_service import EvaluationService

@pytest.fixture
def settings():
    """Fixture for application settings."""
    return get_settings()

@pytest.fixture
def client() -> Generator:
    """Fixture for FastAPI test client."""
    client = TestClient(app)
    yield client

@pytest.fixture
def mock_deepseek_service():
    """Fixture for mocked DeepseekService."""
    service = MagicMock(spec=DeepseekService)
    
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
    
    service.analyze_prompt.side_effect = mock_analyze_prompt
    service.get_capabilities.side_effect = mock_get_capabilities
    service.get_status.side_effect = mock_get_status
    return service

@pytest.fixture
def mock_refinement_service(mock_deepseek_service):
    """Fixture for mocked RefinementService."""
    service = MagicMock(spec=RefinementService)
    
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
    
    async def mock_compare_prompts(*args, **kwargs):
        return {
            "comparison_metrics": {
                "clarity_improvement": 0.3,
                "specificity_improvement": 0.5
            },
            "improvements": [
                "Added specific programming language",
                "Added return type specification"
            ],
            "recommendation": "Use the enhanced version"
        }
    
    service.analyze_prompt.side_effect = mock_analyze_prompt
    service.compare_prompts.side_effect = mock_compare_prompts
    return service

@pytest.fixture
def mock_evaluation_service():
    """Fixture for mocked EvaluationService."""
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
def event_loop():
    """Fixture for async tests."""
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()
