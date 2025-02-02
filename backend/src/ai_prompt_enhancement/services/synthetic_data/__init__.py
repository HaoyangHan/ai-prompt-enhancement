"""
Synthetic data generation services.
"""
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Ensure required directories exist
HISTORY_DIR = Path("data/synthetic_data_history")
CACHE_DIR = Path("data/synthetic_data_cache")

try:
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("[HISTORY] Initialized synthetic data directories:")
    logger.info(f"[HISTORY]   History: {HISTORY_DIR}")
    logger.info(f"[HISTORY]   Cache: {CACHE_DIR}")
except Exception as e:
    logger.error(f"[HISTORY] Failed to create directories: {str(e)}")
    raise

from .generation_service import generator
from .history_service import history_service as history
from .cache_service import cache

__all__ = ['generator', 'history', 'cache'] 