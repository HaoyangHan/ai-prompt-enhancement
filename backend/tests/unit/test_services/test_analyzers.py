import pytest
from ai_prompt_enhancement.services.analyzers import OpenAIAnalyzer, DefaultAnalyzer, create_analyzer
from ai_prompt_enhancement.schemas.prompt import ModelType

@pytest.mark.asyncio
async def test_openai_analyzer_initialization():
    """Test OpenAI analyzer initialization"""
    analyzer = OpenAIAnalyzer(model="gpt-3.5-turbo")
    assert analyzer.model == "gpt-3.5-turbo"
    assert analyzer.analysis_prompt_template is not None

@pytest.mark.asyncio
async def test_default_analyzer_initialization():
    """Test default analyzer initialization"""
    analyzer = DefaultAnalyzer()
    assert analyzer.model == "gpt-3.5-turbo"

@pytest.mark.asyncio
async def test_create_analyzer_gpt4():
    """Test analyzer factory with GPT-4"""
    analyzer = create_analyzer(ModelType.GPT_4)
    assert isinstance(analyzer, OpenAIAnalyzer)
    assert analyzer.model == "gpt-4"

@pytest.mark.asyncio
async def test_create_analyzer_default():
    """Test analyzer factory with default model"""
    analyzer = create_analyzer(ModelType.DEFAULT)
    assert isinstance(analyzer, DefaultAnalyzer)
    assert analyzer.model == "gpt-3.5-turbo"

@pytest.mark.asyncio
async def test_analyzer_with_context(mock_analyzer, sample_prompt, sample_context):
    """Test analyzer with context"""
    metrics = await mock_analyzer.analyze(sample_prompt, sample_context)
    assert "clarity" in metrics
    assert "completeness" in metrics
    assert metrics["clarity"].score == 0.8
    assert len(metrics["clarity"].suggestions) > 0

@pytest.mark.asyncio
async def test_analyzer_without_context(mock_analyzer, sample_prompt):
    """Test analyzer without context"""
    metrics = await mock_analyzer.analyze(sample_prompt)
    assert "clarity" in metrics
    assert "completeness" in metrics
    assert metrics["completeness"].score == 0.7
    assert len(metrics["completeness"].suggestions) > 0 