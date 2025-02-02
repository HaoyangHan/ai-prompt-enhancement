"""Factory for creating model service instances."""
from typing import Union, Any
from loguru import logger

logger = logger.bind(service="model_factory")

class ModelFactory:
    @staticmethod
    def create_model_service(model_name: str) -> Any:
        """Create and return appropriate model service based on model name."""
        logger.info(f"Creating model service for: {model_name}")
        
        # Use lazy imports to avoid circular dependencies
        if model_name.startswith("deepseek"):
            from .deepseek_service import DeepseekService
            logger.info("Using DeepseekService")
            return DeepseekService()
        elif model_name in ["gpt-4", "gpt-3.5-turbo", "gpt-4o-mini"]:
            from .openai_service import OpenAIService
            logger.info("Using OpenAIService")
            return OpenAIService()
        else:
            raise ValueError(f"Unsupported model: {model_name}")

# Create and export a global instance
model_factory = ModelFactory() 