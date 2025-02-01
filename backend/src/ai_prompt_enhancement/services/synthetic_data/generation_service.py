import logging
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

from ...models.synthetic_data import GenerationRecord
from ..model.openai_service import openai_service
from .cache_service import cache
from .history_service import history

logger = logging.getLogger(__name__)

class SyntheticDataGenerator:
    def generate_synthetic_data(
        self,
        template: str,
        model: str = "gpt-4",
        batch_size: int = 1,
        reference_content: Optional[str] = None
    ) -> GenerationRecord:
        """Generate synthetic data based on the given template."""
        try:
            # Log request details
            logger.info("[GEN] Starting generation: model=%s, batch_size=%d", model, batch_size)
            if reference_content:
                logger.info("[GEN] Using reference content: %s...", reference_content[:50])

            # Check cache first
            cached_result = cache.get_cached_result(template, model, batch_size, reference_content)
            if cached_result:
                logger.info("[GEN] Using cached result")
                return history.save_record(
                    template=template,
                    model=model,
                    data=cached_result["data"],
                    generation_time=0,
                    is_cached=True,
                    cached_at=cached_result["timestamp"],
                    reference_content=reference_content
                )
            
            # Generate new data
            start_time = time.time()
            logger.info("[GEN] Generating new data")
            
            # Generate data using OpenAI
            data = []
            for i in range(batch_size):
                logger.debug("[GEN] Generating item %d/%d", i+1, batch_size)
                response = openai_service.generate_content(
                    template=template,
                    reference_content=reference_content
                )
                data.append(response)
            
            generation_time = time.time() - start_time
            logger.info("[GEN] Generation completed in %.2fs", generation_time)
            
            # Cache the result
            logger.debug("[GEN] Caching result")
            cache.cache_result(
                template=template,
                model=model,
                batch_size=batch_size,
                reference_content=reference_content,
                data=data
            )
            
            # Save to history and return
            logger.debug("[GEN] Saving to history")
            return history.save_record(
                template=template,
                model=model,
                data=data,
                generation_time=generation_time,
                reference_content=reference_content
            )
            
        except Exception as e:
            logger.error("[GEN] Error generating synthetic data: %s", str(e))
            raise

# Global instance
generator = SyntheticDataGenerator() 