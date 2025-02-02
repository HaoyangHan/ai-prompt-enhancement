from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging

from ...services.synthetic_data import generator, history
from ...schemas.synthetic_data import GenerationRecord
from ...services.synthetic_data.history_service import history_service
from ...schemas.synthetic_data_history import (
    SyntheticDataHistoryEntry,
    SyntheticDataHistorySession
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/synthetic-data", tags=["synthetic-data"])

class SyntheticDataRequest(BaseModel):
    template: str = Field(..., description="The template for data generation")
    model: str = Field("gpt-4", description="The model to use for generation")
    batch_size: int = Field(1, ge=1, description="Number of data points to generate")
    additional_instructions: str = Field(..., description="Additional instructions for generation")
    force_refresh: bool = Field(False, description="Force refresh for generation")

class GenerateSimilarRequest(SyntheticDataRequest):
    reference_content: str = Field(..., description="The reference content to generate similar variations of")

class UpdateTagsRequest(BaseModel):
    tags: List[str] = Field(..., description="Updated list of tags")

class UpdateNotesRequest(BaseModel):
    notes: str = Field(..., description="Updated notes content")

@router.post("/generate", response_model=GenerationRecord)
async def generate_data(request: SyntheticDataRequest):
    """Generate synthetic data based on the provided template."""
    try:
        result = await generator.generate_synthetic_data(
            template=request.template,
            model=request.model,
            batch_size=request.batch_size,
            additional_instructions=request.additional_instructions,
            force_refresh=request.force_refresh
        )
        return result
    except Exception as e:
        logger.error(f"Error generating synthetic data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-similar", response_model=GenerationRecord)
async def generate_similar_data(request: GenerateSimilarRequest):
    """Generate synthetic data similar to a reference example."""
    try:
        result = await generator.generate_synthetic_data(
            template=request.template,
            model=request.model,
            batch_size=request.batch_size,
            reference_content=request.reference_content,
            additional_instructions=request.additional_instructions,
            force_refresh=request.force_refresh
        )
        return result
    except Exception as e:
        logger.error(f"Error generating similar data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=List[SyntheticDataHistoryEntry])
async def get_history(
    session_id: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = 100
):
    """Get synthetic data generation history."""
    try:
        return history_service.get_entries(session_id=session_id, type=type, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/sessions", response_model=List[SyntheticDataHistorySession])
async def get_sessions(limit: int = 100):
    """Get synthetic data generation sessions."""
    try:
        return history_service.get_sessions(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history/{entry_id}")
async def delete_history_entry(entry_id: str):
    """Delete a history entry."""
    try:
        history_service.delete_entry(entry_id)
        return {"message": "Entry deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a session."""
    try:
        history_service.delete_session(session_id)
        return {"message": "Session deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/history/{entry_id}/tags")
async def update_entry_tags(entry_id: str, request: UpdateTagsRequest):
    """Update tags for a history entry."""
    try:
        history_service.update_entry_tags(entry_id, request.tags)
        return {"message": "Tags updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/history/{entry_id}/notes")
async def update_entry_notes(entry_id: str, request: UpdateNotesRequest):
    """Update notes for a history entry."""
    try:
        history_service.update_entry_notes(entry_id, request.notes)
        return {"message": "Notes updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 