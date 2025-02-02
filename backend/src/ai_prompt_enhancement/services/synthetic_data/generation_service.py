"""Service for synthetic data generation."""
import uuid
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
from loguru import logger

from ...core.config import get_settings
from ..model.model_factory import model_factory
from .cache import cache
from .history_service import history_service
from .prompt_templates import SYNTHETIC_DATA_TEMPLATE, SIMILAR_CONTENT_TEMPLATE

logger = logger.bind(service="generation")

class SyntheticDataGenerator:
    def __init__(self):
        """Initialize the generator with configuration."""
        self.settings = get_settings()
        logger.info("SyntheticDataGenerator initialized")

    async def generate_synthetic_data(
        self,
        template: str,
        model: str = "gpt-4o-mini",
        batch_size: int = 1,
        reference_content: Optional[str] = None,
        additional_instructions: Optional[str] = None,
        session_id: Optional[str] = None,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """Generate synthetic data based on template and parameters."""
        generation_id = str(uuid.uuid4())
        logger.info(f"[GEN:{generation_id}] Starting generation with model {model}")

        try:
            # Get the appropriate model service
            model_service = model_factory.create_model_service(model)
            
            start_time = time.time()
            data: List[Dict[str, Any]] = []
            
            # Check cache only if force_refresh is False
            if not force_refresh:
                try:
                    cached_result = cache.get_result(
                        template=template,
                        model=model,
                        batch_size=batch_size,
                        reference_content=reference_content
                    )
                    if cached_result:
                        logger.info(f"[GEN:{generation_id}] Using cached result")
                        # Ensure all required fields are present
                        if "id" not in cached_result:
                            cached_result["id"] = generation_id
                        if "generation_time" not in cached_result:
                            cached_result["generation_time"] = 0.0
                        return cached_result
                except Exception as e:
                    logger.error(f"[GEN:{generation_id}] Cache error: {str(e)}")
            
            # Generate new data
            try:
                # Format the appropriate template
                if reference_content:
                    formatted_template = SIMILAR_CONTENT_TEMPLATE.format(
                        reference_content=reference_content,
                        template=template,
                        instructions=additional_instructions or "Follow the template structure and style.",
                        batch_size=batch_size
                    )
                    logger.debug(f"[GEN:{generation_id}] Using similar content template")
                else:
                    formatted_template = SYNTHETIC_DATA_TEMPLATE.format(
                        template=template,
                        instructions=additional_instructions or "Follow the template structure and style.",
                        batch_size=batch_size
                    )
                    logger.debug(f"[GEN:{generation_id}] Using synthetic data template")

                logger.debug(f"[GEN:{generation_id}] Formatted template: {formatted_template}")
                
                # Generate content with score
                response = await model_service.generate_content(
                    template=formatted_template,
                    batch_size=batch_size
                )
                
                logger.debug(f"[GEN:{generation_id}] Raw service response: {response}")
                
                # Process all generated content
                data = []
                for idx, item in enumerate(response.get("all_content", [])):
                    generated_item = {
                        "content": item["content"],
                        "score": item["score"],
                        "index": idx,
                        "timestamp": datetime.now().isoformat()
                    }
                    logger.debug(f"[GEN:{generation_id}] Created item {idx}: {generated_item}")
                    data.append(generated_item)
                
                if not data:  # Fallback to single item for backward compatibility
                    generated_item = {
                        "content": response["content"],
                        "score": response["score"],
                        "index": 0,
                        "timestamp": datetime.now().isoformat()
                    }
                    logger.debug(f"[GEN:{generation_id}] Created single item: {generated_item}")
                    data.append(generated_item)
                
                total_time = time.time() - start_time
                logger.info(f"[GEN:{generation_id}] Generation completed in {total_time:.2f}s")
                
                # Create history entry
                try:
                    history_service.add_entry(
                        template=template,
                        model=model,
                        batch_size=batch_size,
                        generated_items=data,
                        generation_time=total_time,
                        is_cached=False,
                        session_id=session_id,
                        additional_instructions=additional_instructions,
                        reference_content=reference_content
                    )
                except Exception as e:
                    logger.error(f"[GEN:{generation_id}] History error: {str(e)}")
                
                # Create result record
                result = {
                    "id": generation_id,
                    "timestamp": datetime.now().isoformat(),
                    "template": template,
                    "model": model,
                    "data": data,
                    "generation_time": total_time,
                    "is_cached": False,
                    "cached_at": None,
                    "reference_content": reference_content
                }
                
                # Cache result if not force_refresh
                if not force_refresh:
                    try:
                        cache.cache_result(
                            template=template,
                            model=model,
                            batch_size=batch_size,
                            reference_content=reference_content,
                            data=data
                        )
                        logger.info(f"[GEN:{generation_id}] Result cached successfully")
                    except Exception as e:
                        logger.error(f"[GEN:{generation_id}] Cache error: {str(e)}")
                
                return result
                
            except Exception as e:
                logger.error(f"[GEN:{generation_id}] Generation error: {str(e)}")
                raise
            
        except Exception as e:
            logger.error(f"[GEN:{generation_id}] Process error: {str(e)}")
            raise

# Create and export a global instance
generator = SyntheticDataGenerator() 