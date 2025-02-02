from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class SyntheticDataHistoryInput(BaseModel):
    """Input parameters for synthetic data generation."""
    template: str = Field(..., description="The template used for generation")
    model: str = Field(..., description="The model used for generation")
    batch_size: int = Field(..., description="Number of items generated")
    additional_instructions: Optional[str] = Field(None, description="Additional style or format instructions")
    reference_content: Optional[str] = Field(None, description="Reference content for similar content generation")

class SyntheticDataHistoryOutput(BaseModel):
    """Output results from synthetic data generation."""
    generated_items: List[dict] = Field(..., description="List of generated items with their metadata")
    generation_time: float = Field(..., description="Time taken for generation in seconds")
    is_cached: bool = Field(default=False, description="Whether this result was served from cache")
    cached_at: Optional[str] = Field(None, description="Timestamp when this result was cached")

class SyntheticDataHistoryEntry(BaseModel):
    """A single entry in the synthetic data generation history."""
    id: str = Field(..., description="Unique identifier for this history entry")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    session_id: Optional[str] = Field(None, description="Session identifier for grouped generations")
    input: SyntheticDataHistoryInput = Field(..., description="Input parameters used")
    output: SyntheticDataHistoryOutput = Field(..., description="Generation results")
    type: str = Field(default="synthetic", description="Type of generation (synthetic or similar)")
    tags: List[str] = Field(default_factory=list, description="User-defined tags for organization")
    notes: Optional[str] = Field(None, description="User notes about this generation")

class SyntheticDataHistorySession(BaseModel):
    """A session of related synthetic data generations."""
    session_id: str = Field(..., description="Unique identifier for this session")
    name: str = Field(..., description="User-defined session name")
    description: Optional[str] = Field(None, description="Session description")
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    entries: List[str] = Field(default_factory=list, description="List of entry IDs in this session") 