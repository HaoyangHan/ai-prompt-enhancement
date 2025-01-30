from typing import Dict, Optional, List, Union
from loguru import logger
from .analyzers import analyze_prompt_metrics
from .prompt_templates import ANALYSIS_TEMPLATE, COMPARISON_TEMPLATE
from ..model.model_factory import ModelFactory
from ...core.config import get_settings
from ..core.storage_service import StorageService
from fastapi import Depends
import re

class RefinementService:
    """Service for analyzing and refining prompts."""

    def __init__(self, storage_service: StorageService = Depends()):
        """Initialize the RefinementService."""
        self.settings = get_settings()
        self.model_factory = ModelFactory()
        self.storage_service = storage_service
        logger.info("RefinementService initialized")

    def _clean_text(self, text: Optional[Union[str, Dict]]) -> Optional[str]:
        """Clean and format text input."""
        logger.debug(f"Cleaning text input: '{text}'")
        logger.debug(f"Input type: {type(text)}")
        
        if text is None:
            logger.debug("Input is None, returning None")
            return None
        if isinstance(text, dict):
            logger.debug("Input is dict, converting to string")
            return str(text)
        cleaned = str(text).strip()
        logger.debug(f"Cleaned text: '{cleaned}'")
        return cleaned

    async def analyze_prompt(self, prompt: str, model: str, context: Optional[str] = None) -> Dict:
        """Analyze a prompt using the specified model."""
        try:
            logger.info(f"Analyzing prompt using model: {model}")
            
            # Get appropriate model service
            model_service = self.model_factory.create_model_service(model)
            
            # Perform analysis
            result = await model_service.analyze_prompt(prompt, context)
            
            # Add model information and original prompt
            result["model_used"] = model
            result["original_prompt"] = prompt
            
            # Save the analysis result
            try:
                self.storage_service.save_analysis_history(result)
                logger.info("Successfully saved analysis to history")
            except Exception as e:
                logger.error(f"Failed to save analysis history: {str(e)}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in analyze_prompt: {str(e)}")
            raise

    async def compare_prompts(self, original_prompt: str, enhanced_prompt: str, context: Optional[Dict] = None) -> Dict:
        """Compare original and enhanced prompts."""
        try:
            logger.info("Starting prompt comparison")
            
            # Use the model specified in context, or default to deepseek
            model_name = context.get("model", "deepseek-chat") if context else "deepseek-chat"
            model_service = self.model_factory.create_model_service(model_name)
            
            return await model_service.compare_prompts(original_prompt, enhanced_prompt, context)
            
        except Exception as e:
            logger.error(f"Error in compare_prompts: {str(e)}")
            raise 