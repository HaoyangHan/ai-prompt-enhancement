"""Factory for creating model service instances."""
from typing import Union
from loguru import logger

from ...core.types import ModelType
from .deepseek_service import DeepseekService
from .openai_service import OpenAIService

class ModelFactory:
    @staticmethod
    def create_model_service(model_type: ModelType) -> Union[DeepseekService, OpenAIService]:
        """Create and return appropriate model service based on model type."""
        logger.info(f"Creating model service for: {model_type.value}")
        
        if model_type == ModelType.DEEPSEEK_CHAT:
            logger.info("Using DeepseekService")
            return DeepseekService()
        elif model_type in [ModelType.OPENAI_GPT4, ModelType.OPENAI_GPT35]:
            logger.info("Using OpenAIService")
            return OpenAIService()
        else:
            raise ValueError(f"Unsupported model type: {model_type}") 