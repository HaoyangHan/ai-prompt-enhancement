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
from .model.deepseek_service import DeepseekService
from .core.storage_service import StorageService
import json

class PromptService:
    def __init__(self, deepseek_service: DeepseekService = Depends(), storage_service: StorageService = Depends()):
        self.deepseek_service = deepseek_service
        self.storage_service = storage_service
    
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
                
                # Save the analysis result
                result['original_prompt'] = request.prompt_text
                self.storage_service.save_analysis_history(result)
                
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
        logger.debug(f"Request type: {type(request)}")
        logger.debug(f"Request attributes: {dir(request)}")
        
        try:
            # Convert request to dict if it's a Pydantic model
            if hasattr(request, 'dict'):
                logger.debug("Request is a Pydantic model")
                request_data = request.dict()
                logger.debug(f"Converted to dict: {json.dumps(request_data, indent=2)}")
            else:
                logger.debug("Request is not a Pydantic model")
                request_data = request
                if isinstance(request_data, dict):
                    logger.debug(f"Request data (dict): {json.dumps(request_data, indent=2)}")
                else:
                    logger.debug(f"Request data (raw): {request_data}")
            
            # Extract analysis result if it exists
            if 'analysis_result' in request_data:
                logger.debug("Found analysis_result in request")
                analysis_result = request_data['analysis_result']
            else:
                analysis_result = request_data
            
            # Validate required fields in analysis_result
            required_fields = ['metrics', 'suggestions', 'original_prompt', 'enhanced_prompt']
            missing_fields = [field for field in required_fields if field not in analysis_result]
            
            if missing_fields:
                logger.error(f"Missing required fields in analysis_result: {missing_fields}")
                logger.error(f"Available fields in analysis_result: {list(analysis_result.keys())}")
                raise ValueError(f"Missing required fields in analysis_result: {missing_fields}")
            
            # Process the request and get the comparison result
            result = await self.deepseek_service.compare_prompts(analysis_result)
            
            # Save the comparison result
            self.storage_service.save_comparison_history(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in compare_prompts: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            logger.exception("Full traceback:")
            raise HTTPException(status_code=500, detail=str(e))

    def get_analysis_history(self) -> List[Dict]:
        """Retrieve analysis history."""
        return self.storage_service.get_analysis_history()
    
    def get_comparison_history(self) -> List[Dict]:
        """Retrieve comparison history."""
        return self.storage_service.get_comparison_history() 