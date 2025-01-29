import pytest
from unittest.mock import MagicMock, patch
from typing import Dict, List
import io

from ai_prompt_enhancement.services.evaluation.evaluation_service import EvaluationService

pytestmark = pytest.mark.asyncio

@pytest.fixture
def evaluation_service(mock_deepseek_service):
    """Fixture for EvaluationService with mocked dependencies."""
    return EvaluationService(model_service=mock_deepseek_service)

@pytest.fixture
def sample_criteria():
    """Fixture for sample evaluation criteria."""
    return [
        {
            "name": "clarity",
            "weight": 0.4,
            "description": "Measures clarity",
            "threshold": 0.7
        },
        {
            "name": "specificity",
            "weight": 0.6,
            "description": "Measures specificity",
            "threshold": 0.8
        }
    ]

@pytest.fixture
def sample_csv_file():
    """Fixture for sample CSV file."""
    content = "prompt\nWrite a sorting function\nImplement binary search"
    return io.BytesIO(content.encode())

async def test_evaluate_prompt_success(evaluation_service: EvaluationService, sample_criteria):
    """Test successful prompt evaluation."""
    result = await evaluation_service.evaluate_prompt(
        prompt="Write a function to sort an array",
        criteria=sample_criteria,
        context={"domain": "programming"}
    )
    
    assert isinstance(result, dict)
    assert "overall_score" in result
    assert "criteria_scores" in result
    assert "feedback" in result
    assert "passed_thresholds" in result
    assert isinstance(result["overall_score"], float)
    assert isinstance(result["criteria_scores"], dict)
    assert isinstance(result["feedback"], list)
    assert isinstance(result["passed_thresholds"], bool)

async def test_evaluate_prompt_weights_validation(evaluation_service: EvaluationService):
    """Test validation of criteria weights."""
    invalid_criteria = [
        {
            "name": "clarity",
            "weight": 0.7,
            "description": "Measures clarity",
            "threshold": 0.7
        },
        {
            "name": "specificity",
            "weight": 0.6,  # Total weights > 1
            "description": "Measures specificity",
            "threshold": 0.8
        }
    ]
    
    with pytest.raises(ValueError):
        await evaluation_service.evaluate_prompt(
            prompt="Write a sorting function",
            criteria=invalid_criteria
        )

async def test_evaluate_prompt_threshold_validation(evaluation_service: EvaluationService):
    """Test validation of criteria thresholds."""
    invalid_criteria = [
        {
            "name": "clarity",
            "weight": 0.4,
            "description": "Measures clarity",
            "threshold": 1.2  # Invalid threshold > 1
        }
    ]
    
    with pytest.raises(ValueError):
        await evaluation_service.evaluate_prompt(
            prompt="Write a sorting function",
            criteria=invalid_criteria
        )

async def test_evaluate_prompt_service_error(evaluation_service: EvaluationService, sample_criteria, mock_deepseek_service):
    """Test prompt evaluation with service error."""
    mock_deepseek_service.evaluate_prompt.side_effect = Exception("Service error")
    
    with pytest.raises(Exception):
        await evaluation_service.evaluate_prompt(
            prompt="Write a sorting function",
            criteria=sample_criteria
        )

async def test_evaluate_batch_success(evaluation_service: EvaluationService, sample_criteria, sample_csv_file):
    """Test successful batch evaluation."""
    result = await evaluation_service.evaluate_prompts_batch(
        file=sample_csv_file,
        criteria=sample_criteria
    )
    
    assert isinstance(result, dict)
    assert "total_prompts" in result
    assert "passed_prompts" in result
    assert "average_score" in result
    assert "results" in result
    assert isinstance(result["total_prompts"], int)
    assert isinstance(result["passed_prompts"], int)
    assert isinstance(result["average_score"], float)
    assert isinstance(result["results"], dict)

async def test_evaluate_batch_invalid_csv(evaluation_service: EvaluationService, sample_criteria):
    """Test batch evaluation with invalid CSV."""
    invalid_csv = io.BytesIO(b"invalid,csv,content")
    
    with pytest.raises(ValueError):
        await evaluation_service.evaluate_prompts_batch(
            file=invalid_csv,
            criteria=sample_criteria
        )

async def test_evaluate_batch_empty_csv(evaluation_service: EvaluationService, sample_criteria):
    """Test batch evaluation with empty CSV."""
    empty_csv = io.BytesIO(b"prompt\n")
    
    with pytest.raises(ValueError):
        await evaluation_service.evaluate_prompts_batch(
            file=empty_csv,
            criteria=sample_criteria
        )

async def test_evaluate_batch_service_error(evaluation_service: EvaluationService, sample_criteria, sample_csv_file, mock_deepseek_service):
    """Test batch evaluation with service error."""
    mock_deepseek_service.evaluate_prompt.side_effect = Exception("Service error")
    
    with pytest.raises(Exception):
        await evaluation_service.evaluate_prompts_batch(
            file=sample_csv_file,
            criteria=sample_criteria
        )

async def test_evaluate_prompt_empty_criteria(evaluation_service: EvaluationService):
    """Test prompt evaluation with empty criteria."""
    with pytest.raises(ValueError):
        await evaluation_service.evaluate_prompt(
            prompt="Write a sorting function",
            criteria=[]
        )

async def test_evaluate_batch_missing_prompt_column(evaluation_service: EvaluationService, sample_criteria):
    """Test batch evaluation with CSV missing prompt column."""
    invalid_csv = io.BytesIO(b"other_column\nsome_value")
    
    with pytest.raises(ValueError):
        await evaluation_service.evaluate_prompts_batch(
            file=invalid_csv,
            criteria=sample_criteria
        ) 