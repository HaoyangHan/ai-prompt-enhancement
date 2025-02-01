from typing import Dict, Any, List, Optional
import json
import hashlib
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class SyntheticDataCache:
    def __init__(self):
        """Initialize the cache service."""
        self.cache_dir = Path("data/synthetic_data_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        logger.info("[CACHE] Initialized directory: %s", self.cache_dir)
    
    def get_cached_result(
        self,
        template: str,
        model: str,
        batch_size: int,
        reference_content: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Get cached result if available."""
        try:
            cache_key = self._generate_cache_key(template, model, batch_size, reference_content)
            cache_file = self.cache_dir / f"{cache_key}.json"
            
            if not cache_file.exists():
                logger.debug("[CACHE] No cache found for key: %s", cache_key)
                return None
            
            with cache_file.open('r', encoding='utf-8') as f:
                cached_data = json.load(f)
                
            # Check if cache is still valid
            if self._is_cache_valid(cached_data):
                logger.info("[CACHE] Cache hit for key: %s", cache_key)
                return cached_data
            
            # Remove expired cache
            logger.debug("[CACHE] Removing expired cache: %s", cache_key)
            cache_file.unlink()
            return None
            
        except Exception as e:
            logger.error("[CACHE] Error reading cache: %s", str(e))
            return None
    
    def cache_result(
        self,
        template: str,
        model: str,
        batch_size: int,
        reference_content: Optional[str],
        data: List[Dict[str, Any]]
    ) -> None:
        """Cache the generation result."""
        try:
            cache_key = self._generate_cache_key(template, model, batch_size, reference_content)
            cache_file = self.cache_dir / f"{cache_key}.json"
            
            cache_data = {
                "data": data,
                "timestamp": datetime.now().isoformat(),
                "generation_time": 0  # Not tracking generation time for cached results
            }
            
            with cache_file.open('w', encoding='utf-8') as f:
                json.dump(cache_data, f, indent=2, ensure_ascii=False)
                
            logger.debug("[CACHE] Saved result: %s", cache_key)
            
        except Exception as e:
            logger.error("[CACHE] Error caching result: %s", str(e))
    
    def _generate_cache_key(
        self,
        template: str,
        model: str,
        batch_size: int,
        reference_content: Optional[str]
    ) -> str:
        """Generate a unique cache key."""
        key_parts = [
            hashlib.md5(template.encode()).hexdigest()[:8],
            model,
            str(batch_size)
        ]
        if reference_content:
            key_parts.append(hashlib.md5(reference_content.encode()).hexdigest()[:8])
        return "_".join(key_parts)
    
    def _is_cache_valid(self, cached_data: Dict[str, Any]) -> bool:
        """Check if cached data is still valid (not older than 24 hours)."""
        try:
            cache_time = datetime.fromisoformat(cached_data["timestamp"])
            age = datetime.now() - cache_time
            return age.total_seconds() < 24 * 60 * 60  # 24 hours
        except Exception as e:
            logger.error("[CACHE] Error checking cache validity: %s", str(e))
            return False

# Global instance
cache = SyntheticDataCache() 