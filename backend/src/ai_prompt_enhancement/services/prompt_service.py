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
from .model.model_factory import ModelFactory
from .core.storage_service import StorageService
import json

class PromptService:
    def __init__(self, storage_service: StorageService = Depends()):
        self.model_factory = ModelFactory()
        self.storage_service = storage_service
    
    async def analyze_prompt(self, request: Union[PromptAnalyzeRequest, Dict[str, Any]]) -> PromptAnalysisResponse:
        """
        Analyze a prompt using the specified model.
        Handles both PromptAnalyzeRequest and direct dictionary inputs.
        """
        try:
            # Handle both request types
            if isinstance(request, dict):
                prompt_text = request.get("prompt_text") or request.get("prompt")
                preferences = request.get("preferences", {})
                model = preferences.get("model") if preferences else request.get("model")
                context = request.get("context")
            else:
                prompt_text = request.prompt_text
                model = request.preferences.model
                context = request.context

            if not prompt_text:
                raise ValueError("Prompt text is required")
            if not model:
                raise ValueError("Model specification is required")

            logger.info(f"Analyzing prompt with model: {model}")
            logger.debug(f"Full analyze request: {prompt_text}")
            
            # Get model service
            model_service = self.model_factory.create_model_service(model)
            
            # Perform analysis
            result = await model_service.analyze_prompt(
                prompt_text,
                context
            )
            logger.debug(f"Analysis result: {json.dumps(result, indent=2)}")
            
            # Add required fields
            result['original_prompt'] = prompt_text
            result['model_used'] = model
            
            # Save the analysis result
            self.storage_service.save_analysis_history(result)
            
            # Return response without duplicate model_used
            return PromptAnalysisResponse(**result)
        except Exception as e:
            logger.exception("Error during prompt analysis")
            raise HTTPException(status_code=500, detail=str(e))

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
            # Convert request to dict if it's a Pydantic model
            if hasattr(request, 'dict'):
                request_data = request.dict()
            else:
                request_data = request
            
            # Extract analysis result if it exists
            if 'analysis_result' in request_data:
                analysis_result = request_data['analysis_result']
            else:
                analysis_result = request_data
            
            # Extract the required fields
            original_prompt = analysis_result.get('original_prompt')
            enhanced_prompt = analysis_result.get('enhanced_prompt')
            context = analysis_result.get('context')
            
            if not original_prompt or not enhanced_prompt:
                raise ValueError("Both original_prompt and enhanced_prompt are required")
            
            # Get the model from context or use default
            model_name = context.get('model') if context else 'gpt-4o-mini'
            model_service = self.model_factory.create_model_service(model_name)
            
            # Process the request and get the comparison result
            result = await model_service.compare_prompts(
                original_prompt=original_prompt,
                enhanced_prompt=enhanced_prompt,
                context=context
            )
            
            # Save the comparison result
            self.storage_service.save_comparison_history(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in compare_prompts: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def get_analysis_history(self) -> List[Dict]:
        """Get analysis history."""
        return self.storage_service.get_analysis_history()

    def get_comparison_history(self) -> List[Dict]:
        """Get comparison history."""
        return self.storage_service.get_comparison_history() 