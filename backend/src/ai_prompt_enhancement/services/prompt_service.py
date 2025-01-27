from typing import Dict, List, Optional
from fastapi import HTTPException
from loguru import logger
from ..schemas.prompt import (
    PromptAnalyzeRequest,
    PromptAnalysisResponse,
    AnalysisMetric,
    ModelType
)
from .deepseek_service import DeepseekService

class PromptService:
    def __init__(self):
        self.deepseek = DeepseekService()
    
    async def analyze_prompt(self, request: PromptAnalyzeRequest) -> PromptAnalysisResponse:
        """
        Analyze a prompt and provide improvement suggestions.
        """
        logger.info(f"Analyzing prompt: {request.prompt_text[:100]}...")
        logger.debug(f"Full request: {request.dict()}")
        
        try:
            model = request.preferences.model if request.preferences else ModelType.DEEPSEEK_CHAT
            logger.info(f"Using model: {model}")
            
            if model not in [ModelType.DEEPSEEK_CHAT, ModelType.DEEPSEEK_REASONER]:
                logger.error(f"Unsupported model: {model}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Model {model} is not currently supported. Please use {ModelType.DEEPSEEK_CHAT} or {ModelType.DEEPSEEK_REASONER}."
                )
            
            # Get analysis from Deepseek
            analysis = await self.deepseek.analyze_prompt(
                prompt=request.prompt_text,
                context=request.context
            )
            logger.debug(f"Received analysis: {analysis}")
            
            # Convert the analysis to our response format
            try:
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
                    enhanced_prompt=analysis["enhanced_prompt"],
                    model_used=model
                )
            except KeyError as e:
                logger.error(f"Invalid analysis format: {e}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Invalid analysis format: missing required field {e}"
                )
                
        except Exception as e:
            logger.exception("Error analyzing prompt")
            raise HTTPException(status_code=500, detail=str(e)) 