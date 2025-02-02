"""Cache service for synthetic data generation."""
from typing import Dict, List, Optional, Any
from loguru import logger
import json
from datetime import datetime, timedelta
import hashlib

logger = logger.bind(service="cache")

class CacheService:
    def __init__(self):
        """Initialize the cache service."""
        self._cache: Dict[str, Any] = {}
        self.ttl = timedelta(hours=24)  # Cache TTL of 24 hours
        logger.info("Cache service initialized")
    
    def _generate_cache_key(self, template: str, model: str, batch_size: int, reference_content: Optional[str] = None) -> str:
        """Generate a unique cache key based on input parameters."""
        key_parts = [
            template,
            model,
            str(batch_size),
            reference_content or ""
        ]
        key_string = "|".join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def get_result(self, template: str, model: str, batch_size: int, reference_content: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get cached result if it exists and is not expired."""
        try:
            cache_key = self._generate_cache_key(template, model, batch_size, reference_content)
            cached_data = self._cache.get(cache_key)
            
            if not cached_data:
                logger.debug(f"Cache miss for key: {cache_key}")
                return None
            
            cached_at = datetime.fromisoformat(cached_data.get("cached_at", ""))
            if datetime.now() - cached_at > self.ttl:
                logger.debug(f"Cache expired for key: {cache_key}")
                del self._cache[cache_key]
                return None
            
            logger.info(f"Cache hit for key: {cache_key}")
            return cached_data
            
        except Exception as e:
            logger.error(f"Error retrieving from cache: {str(e)}")
            return None
    
    def cache_result(self, template: str, model: str, batch_size: int, 
                    reference_content: Optional[str], data: List[Dict[str, Any]]) -> None:
        """Cache the generation result."""
        try:
            cache_key = self._generate_cache_key(template, model, batch_size, reference_content)
            
            cached_data = {
                "id": cache_key,  # Use cache key as ID
                "template": template,
                "model": model,
                "data": data,
                "generation_time": 0.0,  # Default value for cached results
                "cached_at": datetime.now().isoformat(),
                "is_cached": True,
                "reference_content": reference_content
            }
            
            self._cache[cache_key] = cached_data
            logger.info(f"Successfully cached result with key: {cache_key}")
            
        except Exception as e:
            logger.error(f"Error caching result: {str(e)}")
            raise

# Create and export a global instance
cache = CacheService() 