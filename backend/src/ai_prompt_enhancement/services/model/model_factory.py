"""Factory for creating model service instances."""
from typing import Union
from loguru import logger

from .deepseek_service import DeepseekService
from .openai_service import OpenAIService

class ModelFactory:
    @staticmethod
    def create_model_service(model_name: str) -> Union[DeepseekService, OpenAIService]:
        """Create and return appropriate model service based on model name."""
        logger.info(f"Creating model service for: {model_name}")
        
        if model_name.startswith("deepseek"):
            logger.info("Using DeepseekService")
            return DeepseekService()
        elif model_name in ["gpt-4o-mini", "gpt-3.5-turbo"]:
            logger.info("Using OpenAIService")
            return OpenAIService()
        else:
            raise ValueError(f"Unsupported model: {model_name}") 