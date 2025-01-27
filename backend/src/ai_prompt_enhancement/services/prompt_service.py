from abc import ABC, abstractmethod
from typing import Dict, Optional
from datetime import datetime

from ..schemas.prompt import (
    PromptAnalyzeRequest,
    PromptAnalysisResponse,
    AnalysisMetric,
    ModelType
)

class BasePromptAnalyzer(ABC):
    @abstractmethod
    async def analyze(self, prompt: str, context: Optional[str] = None) -> Dict[str, AnalysisMetric]:
        """Analyze the prompt and return metrics"""
        pass

class PromptService:
    def __init__(self):
        from .analyzers import create_analyzer
        self.create_analyzer = create_analyzer
    
    async def analyze_prompt(self, request: PromptAnalyzeRequest) -> PromptAnalysisResponse:
        """
        Analyze a prompt using the appropriate analyzer for the specified model type.
        If no model type is specified, uses the default analyzer.
        """
        analyzer = self.create_analyzer(request.model_type)
        
        metrics = await analyzer.analyze(request.prompt_text, request.context)
        
        # Calculate overall score (average of all metric scores)
        overall_score = sum(m.score for m in metrics.values()) / len(metrics)
        
        # Collect all suggestions
        suggestions = [
            suggestion
            for metric in metrics.values()
            for suggestion in metric.suggestions
        ]
        
        return PromptAnalysisResponse(
            overall_score=overall_score,
            metrics=metrics,
            suggestions=suggestions,
            model_type=request.model_type,
            timestamp=datetime.utcnow().isoformat()
        ) 