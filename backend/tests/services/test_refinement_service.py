import pytest
from unittest.mock import MagicMock, patch
from typing import Dict, List

from ai_prompt_enhancement.services.prompt_refinement.refinement_service import RefinementService
from ai_prompt_enhancement.services.model.deepseek_service import DeepseekService

pytestmark = pytest.mark.asyncio

@pytest.fixture
def refinement_service(mock_deepseek_service):
    """Fixture for RefinementService with mocked dependencies."""
    return RefinementService(model_service=mock_deepseek_service)

async def test_analyze_prompt_success(refinement_service: RefinementService):
    """Test successful prompt analysis."""
    result = await refinement_service.analyze_prompt(
        prompt="Write a function to calculate fibonacci numbers",
        context={"domain": "programming"},
        metrics=["clarity", "specificity"]
    )
    
    assert isinstance(result, dict)
    assert "metrics" in result
    assert "suggestions" in result
    assert "enhanced_prompt" in result
    assert isinstance(result["metrics"], dict)
    assert isinstance(result["suggestions"], list)
    assert isinstance(result["enhanced_prompt"], str)

async def test_analyze_prompt_with_empty_context(refinement_service: RefinementService):
    """Test prompt analysis with empty context."""
    result = await refinement_service.analyze_prompt(
        prompt="Write a function to calculate fibonacci numbers"
    )
    
    assert isinstance(result, dict)
    assert "metrics" in result
    assert "suggestions" in result

async def test_analyze_prompt_with_specific_metrics(refinement_service: RefinementService):
    """Test prompt analysis with specific metrics."""
    metrics = ["clarity", "specificity"]
    result = await refinement_service.analyze_prompt(
        prompt="Write a function to calculate fibonacci numbers",
        metrics=metrics
    )
    
    assert isinstance(result, dict)
    assert "metrics" in result
    assert all(metric in metrics for metric in result["metrics"])

async def test_analyze_prompt_service_error(refinement_service: RefinementService, mock_deepseek_service):
    """Test prompt analysis with service error."""
    mock_deepseek_service.analyze_prompt.side_effect = Exception("Service error")
    
    with pytest.raises(Exception):
        await refinement_service.analyze_prompt(
            prompt="Write a function to calculate fibonacci numbers"
        )

async def test_compare_prompts_success(refinement_service: RefinementService):
    """Test successful prompt comparison."""
    result = await refinement_service.compare_prompts(
        original_prompt="Write a sorting function",
        enhanced_prompt="Write a Python function that implements merge sort algorithm",
        context={"domain": "algorithms"}
    )
    
    assert isinstance(result, dict)
    assert "comparison_metrics" in result
    assert "improvements" in result
    assert "recommendation" in result
    assert isinstance(result["comparison_metrics"], dict)
    assert isinstance(result["improvements"], list)
    assert isinstance(result["recommendation"], str)

async def test_compare_prompts_identical(refinement_service: RefinementService):
    """Test prompt comparison with identical prompts."""
    prompt = "Write a sorting function"
    result = await refinement_service.compare_prompts(
        original_prompt=prompt,
        enhanced_prompt=prompt
    )
    
    assert isinstance(result, dict)
    assert "comparison_metrics" in result
    assert "improvements" in result

async def test_compare_prompts_service_error(refinement_service: RefinementService, mock_deepseek_service):
    """Test prompt comparison with service error."""
    mock_deepseek_service.compare_prompts.side_effect = Exception("Service error")
    
    with pytest.raises(Exception):
        await refinement_service.compare_prompts(
            original_prompt="Write a sorting function",
            enhanced_prompt="Write a Python function that implements merge sort"
        )

async def test_analyze_prompt_validation(refinement_service: RefinementService):
    """Test input validation for prompt analysis."""
    with pytest.raises(ValueError):
        await refinement_service.analyze_prompt(prompt="")
    
    with pytest.raises(ValueError):
        await refinement_service.analyze_prompt(prompt="   ")

async def test_compare_prompts_validation(refinement_service: RefinementService):
    """Test input validation for prompt comparison."""
    with pytest.raises(ValueError):
        await refinement_service.compare_prompts(
            original_prompt="",
            enhanced_prompt="Write a function"
        )
    
    with pytest.raises(ValueError):
        await refinement_service.compare_prompts(
            original_prompt="Write a function",
            enhanced_prompt=""
        ) 