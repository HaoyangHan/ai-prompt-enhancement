import pytest
from typing import Dict, Optional
from fastapi.testclient import TestClient

from ai_prompt_enhancement.main import app
from ai_prompt_enhancement.services.prompt_service import BasePromptAnalyzer
from ai_prompt_enhancement.schemas.prompt import AnalysisMetric

class MockAnalyzer(BasePromptAnalyzer):
    """Mock analyzer for testing"""
    async def analyze(self, prompt: str, context: Optional[str] = None) -> Dict[str, AnalysisMetric]:
        return {
            "clarity": AnalysisMetric(
                score=0.8,
                description="Test clarity metric",
                suggestions=["Test suggestion 1"]
            ),
            "completeness": AnalysisMetric(
                score=0.7,
                description="Test completeness metric",
                suggestions=["Test suggestion 2"]
            )
        }

@pytest.fixture
def test_client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)

@pytest.fixture
def mock_analyzer():
    """Create a mock analyzer for testing"""
    return MockAnalyzer()

@pytest.fixture
def sample_prompt():
    """Sample prompt for testing"""
    return "Write a function that calculates the fibonacci sequence"

@pytest.fixture
def sample_context():
    """Sample context for testing"""
    return "The function should be implemented in Python"
