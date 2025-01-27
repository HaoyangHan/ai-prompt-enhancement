import pytest
from ai_prompt_enhancement.services.prompt_service import PromptService
from ai_prompt_enhancement.schemas.prompt import PromptAnalyzeRequest, ModelType

@pytest.mark.asyncio
async def test_prompt_service_analyze(mock_analyzer, sample_prompt):
    """Test prompt service analysis functionality"""
    service = PromptService()
    
    request = PromptAnalyzeRequest(
        prompt_text=sample_prompt,
        model_type=ModelType.DEFAULT
    )
    
    response = await service.analyze_prompt(request)
    
    # Check response structure
    assert response.overall_score == 0.75  # (0.8 + 0.7) / 2
    assert len(response.metrics) == 2
    assert "clarity" in response.metrics
    assert "completeness" in response.metrics
    
    # Check suggestions
    assert len(response.suggestions) == 2
    assert "Test suggestion 1" in response.suggestions
    assert "Test suggestion 2" in response.suggestions
    
    # Check model type
    assert response.model_type == ModelType.DEFAULT
    
    # Check timestamp format
    assert response.timestamp is not None

@pytest.mark.asyncio
async def test_prompt_service_with_context(mock_analyzer, sample_prompt, sample_context):
    """Test prompt service with context"""
    service = PromptService()
    
    request = PromptAnalyzeRequest(
        prompt_text=sample_prompt,
        model_type=ModelType.GPT_4,
        context=sample_context
    )
    
    response = await service.analyze_prompt(request)
    assert response.model_type == ModelType.GPT_4
    assert len(response.metrics) == 2

@pytest.mark.asyncio
async def test_prompt_service_metrics_calculation(mock_analyzer, sample_prompt):
    """Test metric calculation in prompt service"""
    service = PromptService()
    
    request = PromptAnalyzeRequest(
        prompt_text=sample_prompt,
        model_type=ModelType.DEFAULT
    )
    
    response = await service.analyze_prompt(request)
    
    # Test individual metric scores
    assert response.metrics["clarity"].score == 0.8
    assert response.metrics["completeness"].score == 0.7
    
    # Test overall score calculation
    expected_overall = (0.8 + 0.7) / 2
    assert response.overall_score == expected_overall 