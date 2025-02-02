from pydantic import BaseModel, Field, field_validator
from typing import Dict, List, Any, Optional, Union
from datetime import datetime

class GeneratedItem(BaseModel):
    """Model for a single generated item."""
    content: str = Field(..., description="The generated content")
    score: float = Field(default=0.0, description="Quality score of the generated content (0-1)")
    index: int = Field(..., description="Index in the batch")
    timestamp: str = Field(..., description="Generation timestamp")

    @classmethod
    def __get_validators__(cls):
        yield cls.validate_input

    @classmethod
    def validate_input(cls, v):
        if isinstance(v, str):
            return cls(
                content=v,
                score=0.0,
                index=0,
                timestamp=datetime.now().isoformat()
            )
        return v

class GenerationRecord(BaseModel):
    """Model for a synthetic data generation record."""
    id: str = Field(..., description="Unique identifier for the record")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    template: str = Field(..., description="The template used for generation")
    model: str = Field(..., description="The model used for generation")
    data: List[Union[GeneratedItem, Dict[str, Any]]] = Field(..., description="Generated data points")
    generation_time: float = Field(..., description="Time taken for generation in seconds")
    is_cached: bool = Field(default=False, description="Whether this result was served from cache")
    cached_at: Optional[str] = None
    reference_content: Optional[str] = None

    @field_validator('data')
    @classmethod
    def validate_data(cls, v):
        if not v:
            return v
        result = []
        for item in v:
            if isinstance(item, str):
                result.append({
                    'content': item,
                    'index': len(result),
                    'timestamp': datetime.now().isoformat()
                })
            elif isinstance(item, dict):
                result.append(item)
            else:
                result.append(item.model_dump())
        return result

class SyntheticDataRequest(BaseModel):
    """Request model for synthetic data generation."""
    template: str = Field(..., description="The template for data generation")
    model: str = Field("gpt-4", description="The model to use for generation")
    batch_size: int = Field(1, ge=1, description="Number of data points to generate")

class GenerateSimilarRequest(SyntheticDataRequest):
    """Request model for generating data similar to a reference."""
    reference_content: str = Field(..., description="The reference content to generate similar variations of") 