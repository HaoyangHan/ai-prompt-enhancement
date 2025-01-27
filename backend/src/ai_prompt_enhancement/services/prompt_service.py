from typing import Dict, List, Optional
from ..schemas.prompt import PromptAnalyzeRequest, PromptAnalysisResponse, AnalysisMetric
from .deepseek_service import DeepseekService

class PromptService:
    def __init__(self):
        self.deepseek = DeepseekService()
    
    async def analyze_prompt(self, request: PromptAnalyzeRequest) -> PromptAnalysisResponse:
        """
        Analyze a prompt and provide improvement suggestions.
        """
        # Get analysis from Deepseek
        analysis = await self.deepseek.analyze_prompt(
            prompt=request.prompt_text,
            context=request.context
        )
        
        # Convert the analysis to our response format
        metrics = {
            name: AnalysisMetric(
                score=metric["score"],
                description=metric["description"],
                suggestions=metric["suggestions"]
            )
            for name, metric in analysis["metrics"].items()
        }
        
        return PromptAnalysisResponse(
            metrics=metrics,
            suggestions=analysis["suggestions"],
            enhanced_prompt=analysis["enhanced_prompt"]
        ) 