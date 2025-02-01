from typing import Dict, List, Any, Optional
from pydantic import BaseModel

class GenerationRecord(BaseModel):
    """Model for a synthetic data generation record."""
    id: str
    timestamp: str
    template: str
    model: str
    data: List[Dict[str, Any]]
    generation_time: float
    is_cached: bool = False
    cached_at: Optional[str] = None
    reference_content: Optional[str] = None 