from typing import Dict, List, Optional, Union, Any
from fastapi import HTTPException, Depends
from loguru import logger
from ..schemas.prompt import (
    PromptAnalyzeRequest,
    PromptAnalysisResponse,
    PromptComparisonRequest,
    PromptComparisonResponse,
    AnalysisMetric,
    ModelType
)
from .deepseek_service import DeepseekService
import json

class PromptService:
    def __init__(self, deepseek_service: DeepseekService = Depends()):
        self.deepseek_service = deepseek_service
    
    async def analyze_prompt(self, request: PromptAnalyzeRequest) -> PromptAnalysisResponse:
        """
        Analyze a prompt using the specified model.
        """
        logger.info(f"Analyzing prompt with model: {request.preferences.model}")
        logger.debug(f"Full analyze request: {request.dict()}")
        
        if request.preferences.model in [ModelType.DEEPSEEK_CHAT, ModelType.DEEPSEEK_REASONER]:
            try:
                result = await self.deepseek_service.analyze_prompt(
                    request.prompt_text,
                    request.context
                )
                logger.debug(f"Analysis result: {json.dumps(result, indent=2)}")
                return PromptAnalysisResponse(
                    **result,
                    model_used=request.preferences.model
                )
            except Exception as e:
                logger.exception("Error during prompt analysis")
                raise HTTPException(status_code=500, detail=str(e))
        else:
            logger.error(f"Unsupported model requested: {request.preferences.model}")
            raise NotImplementedError(f"Model {request.preferences.model} not supported")

    async def compare_prompts(self, request: Union[str, Dict, Any]) -> Dict:
        """
        Compare prompts based on analysis result. Accepts either a string or dictionary input.
        
        Args:
            request: Can be either a string (JSON) or a dictionary containing the analysis result
            
        Returns:
            Dict: Comparison results
        """
        logger.info("Processing comparison request")
        
        try:
            # If input is a string, try to parse it as JSON
            if isinstance(request, str):
                try:
                    analysis_result = json.loads(request)
                    logger.debug("Successfully parsed string input as JSON")
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse string input as JSON: {str(e)}")
                    raise ValueError("Invalid input format: string could not be parsed as JSON")
            # If input is a dictionary-like object with analysis_result
            elif hasattr(request, 'analysis_result'):
                analysis_result = request.analysis_result
                logger.debug("Extracted analysis_result from request object")
            # If input is already a dictionary
            elif isinstance(request, dict):
                analysis_result = request
                logger.debug("Using dictionary input directly")
            else:
                logger.error(f"Unsupported input type: {type(request)}")
                raise ValueError(f"Invalid input type: expected string, dictionary, or object with analysis_result, got {type(request)}")

            # Log the processed analysis result
            logger.debug(f"Processed analysis result:\n{json.dumps(analysis_result, indent=2)}")
            
            # Call the DeepseekService with the processed analysis result
            result = await self.deepseek_service.compare_prompts(analysis_result)
            return result
            
        except Exception as e:
            logger.error(f"Error during prompt comparison: {str(e)}")
            logger.exception("Full exception details:")
            raise 