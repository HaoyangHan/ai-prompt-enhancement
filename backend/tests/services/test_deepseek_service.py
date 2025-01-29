import pytest
from unittest.mock import MagicMock, patch
from typing import Dict, List
import json

from ai_prompt_enhancement.services.model.deepseek_service import DeepseekService
from ai_prompt_enhancement.core.config import get_settings

pytestmark = pytest.mark.asyncio

@pytest.fixture
def mock_openai():
    """Fixture for mocked OpenAI client."""
    with patch("openai.AsyncOpenAI") as mock:
        client = MagicMock()
        mock.return_value = client
        yield client

@pytest.fixture
def deepseek_service(mock_openai):
    """Fixture for DeepseekService with mocked OpenAI client."""
    settings = get_settings()
    return DeepseekService(settings=settings)

async def test_analyze_prompt_success(deepseek_service: DeepseekService, mock_openai):
    """Test successful prompt analysis."""
    # Mock the OpenAI response
    mock_openai.chat.completions.create.return_value.choices[0].message.content = json.dumps({
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
    })
    
    result = await deepseek_service.analyze_prompt(
        prompt="Write a function to calculate fibonacci numbers",
        context={"domain": "programming"}
    )
    
    assert isinstance(result, dict)
    assert "metrics" in result
    assert "suggestions" in result
    assert "enhanced_prompt" in result
    assert isinstance(result["metrics"], dict)
    assert isinstance(result["suggestions"], list)
    assert isinstance(result["enhanced_prompt"], str)

async def test_analyze_prompt_invalid_response(deepseek_service: DeepseekService, mock_openai):
    """Test prompt analysis with invalid model response."""
    mock_openai.chat.completions.create.return_value.choices[0].message.content = "invalid json"
    
    with pytest.raises(ValueError):
        await deepseek_service.analyze_prompt(
            prompt="Write a function to calculate fibonacci numbers"
        )

async def test_analyze_prompt_api_error(deepseek_service: DeepseekService, mock_openai):
    """Test prompt analysis with API error."""
    mock_openai.chat.completions.create.side_effect = Exception("API Error")
    
    with pytest.raises(Exception):
        await deepseek_service.analyze_prompt(
            prompt="Write a function to calculate fibonacci numbers"
        )

async def test_get_capabilities_success(deepseek_service: DeepseekService):
    """Test successful retrieval of model capabilities."""
    capabilities = await deepseek_service.get_capabilities()
    
    assert isinstance(capabilities, list)
    assert len(capabilities) > 0
    for capability in capabilities:
        assert "name" in capability
        assert "version" in capability
        assert "capabilities" in capability
        assert "max_tokens" in capability
        assert "supported_languages" in capability

async def test_get_status_success(deepseek_service: DeepseekService):
    """Test successful retrieval of model status."""
    status = await deepseek_service.get_status()
    
    assert isinstance(status, list)
    assert len(status) > 0
    for stat in status:
        assert "name" in stat
        assert "status" in stat
        assert "latency" in stat
        assert "requests_per_minute" in stat
        assert "error_rate" in stat

async def test_analyze_prompt_validation(deepseek_service: DeepseekService):
    """Test input validation for prompt analysis."""
    with pytest.raises(ValueError):
        await deepseek_service.analyze_prompt(prompt="")
    
    with pytest.raises(ValueError):
        await deepseek_service.analyze_prompt(prompt="   ")

async def test_analyze_prompt_with_context(deepseek_service: DeepseekService, mock_openai):
    """Test prompt analysis with context."""
    mock_openai.chat.completions.create.return_value.choices[0].message.content = json.dumps({
        "metrics": {"clarity": 0.9},
        "suggestions": ["Add more details"],
        "enhanced_prompt": "Enhanced version"
    })
    
    context = {"domain": "programming", "level": "advanced"}
    result = await deepseek_service.analyze_prompt(
        prompt="Write a function",
        context=context
    )
    
    # Verify that context was included in the API call
    call_args = mock_openai.chat.completions.create.call_args[1]
    messages = call_args["messages"]
    assert any(context_str in str(msg) for msg in messages for context_str in str(context).split())

async def test_analyze_prompt_rate_limiting(deepseek_service: DeepseekService, mock_openai):
    """Test rate limiting for prompt analysis."""
    # Simulate rate limit error
    mock_openai.chat.completions.create.side_effect = Exception("Rate limit exceeded")
    
    with pytest.raises(Exception) as exc_info:
        await deepseek_service.analyze_prompt(
            prompt="Write a function"
        )
    assert "Rate limit" in str(exc_info.value)

async def test_analyze_prompt_timeout(deepseek_service: DeepseekService, mock_openai):
    """Test timeout handling for prompt analysis."""
    # Simulate timeout
    mock_openai.chat.completions.create.side_effect = Exception("Request timed out")
    
    with pytest.raises(Exception) as exc_info:
        await deepseek_service.analyze_prompt(
            prompt="Write a function"
        )
    assert "timed out" in str(exc_info.value) 