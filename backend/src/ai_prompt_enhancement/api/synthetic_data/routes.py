from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging

from ...services.synthetic_data import generator, history
from ...schemas.synthetic_data import GenerationRecord

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/synthetic-data", tags=["synthetic-data"])

class SyntheticDataRequest(BaseModel):
    template: str = Field(..., description="The template for data generation")
    model: str = Field("gpt-4", description="The model to use for generation")
    batch_size: int = Field(1, ge=1, description="Number of data points to generate")

class GenerateSimilarRequest(SyntheticDataRequest):
    reference_content: str = Field(..., description="The reference content to generate similar variations of")

@router.post("/generate", response_model=GenerationRecord)
async def generate_data(request: SyntheticDataRequest):
    """Generate synthetic data based on the provided template."""
    try:
        result = generator.generate_synthetic_data(
            template=request.template,
            model=request.model,
            batch_size=request.batch_size
        )
        return result
    except Exception as e:
        logger.error(f"Error generating synthetic data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-similar", response_model=GenerationRecord)
async def generate_similar_data(request: GenerateSimilarRequest):
    """Generate synthetic data similar to a reference example."""
    try:
        result = generator.generate_synthetic_data(
            template=request.template,
            model=request.model,
            batch_size=request.batch_size,
            reference_content=request.reference_content
        )
        return result
    except Exception as e:
        logger.error(f"Error generating similar data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=List[GenerationRecord])
async def get_history(
    limit: Optional[int] = Query(100, description="Maximum number of records to return")
):
    """Get generation history records."""
    try:
        records = history.get_records(limit=limit)
        return records
    except Exception as e:
        logger.error(f"Error getting history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history/{record_id}")
async def delete_history_record(record_id: str):
    """Delete a specific history record."""
    try:
        logger.info(f"[HISTORY] Attempting to delete record: {record_id}")
        if history.delete_record(record_id):
            logger.info(f"[HISTORY] Successfully deleted record: {record_id}")
            return {"status": "success", "message": f"Record {record_id} deleted"}
        logger.warning(f"[HISTORY] Record not found: {record_id}")
        raise HTTPException(status_code=404, detail=f"Record {record_id} not found")
    except Exception as e:
        logger.error(f"[HISTORY] Error deleting history record: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/history")
async def clear_history():
    """Clear all history records."""
    try:
        logger.info("[HISTORY] Attempting to clear all history records")
        if history.clear_history():
            logger.info("[HISTORY] Successfully cleared all history records")
            return {"status": "success", "message": "History cleared"}
        logger.error("[HISTORY] Failed to clear history")
        raise HTTPException(status_code=500, detail="Failed to clear history")
    except Exception as e:
        logger.error(f"[HISTORY] Error clearing history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 