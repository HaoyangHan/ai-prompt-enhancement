from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

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

class SyntheticDataRequest(BaseModel):
    template: str = Field(..., description="The template to generate data from")
    model: str = Field("gpt-4", description="The model to use for generation")
    batch_size: int = Field(1, ge=1, description="Number of data points to generate")
    additional_instructions: Optional[str] = Field(None, description="Additional instructions for generation")
    force_refresh: bool = Field(False, description="Whether to bypass cache and force new generation") 