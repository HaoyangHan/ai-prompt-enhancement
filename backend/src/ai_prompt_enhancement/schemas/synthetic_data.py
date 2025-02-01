from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime

class GenerationRecord(BaseModel):
    """Model for a synthetic data generation record."""
    id: str = Field(..., description="Unique identifier for the record")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    template: str = Field(..., description="The template used for generation")
    model: str = Field(..., description="The model used for generation")
    data: List[Dict[str, Any]] = Field(..., description="Generated data points")
    generation_time: float = Field(..., description="Time taken for generation in seconds")
    is_cached: bool = Field(default=False, description="Whether this result was served from cache")
    cached_at: Optional[str] = None
    reference_content: Optional[str] = None

class SyntheticDataRequest(BaseModel):
    """Request model for synthetic data generation."""
    template: str = Field(..., description="The template for data generation")
    model: str = Field("gpt-4", description="The model to use for generation")
    batch_size: int = Field(1, ge=1, description="Number of data points to generate")

class GenerateSimilarRequest(SyntheticDataRequest):
    """Request model for generating data similar to a reference."""
    reference_content: str = Field(..., description="The reference content to generate similar variations of") 