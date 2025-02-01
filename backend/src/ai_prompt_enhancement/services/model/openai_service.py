"""OpenAI service for synthetic data generation."""
import logging
from typing import Dict, Any, Optional
from openai import OpenAI

from ...core.config import settings

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        """Initialize the OpenAIService with configuration and OpenAI client."""
        self.settings = settings
        logger.info(f"Initializing OpenAIService with base_url: {self.settings.openai_base_url}")
        
        self.client = OpenAI(
            api_key=self.settings.openai_api_key,
            base_url=self.settings.openai_base_url
        )
        logger.debug("OpenAI client initialized")
    
    def generate_content(
        self,
        template: str,
        reference_content: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate content using OpenAI."""
        try:
            # Format the prompt
            prompt = template
            if reference_content:
                prompt = f"{template}\n\nReference content: {reference_content}"
            
            # Make API request
            response = self.client.chat.completions.create(
                model=self.settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that generates high-quality content."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            # Extract and return the content
            content = response.choices[0].message.content
            return {"content": content}
            
        except Exception as e:
            logger.error(f"Error generating content: {str(e)}")
            raise

# Global instance
openai_service = OpenAIService() 