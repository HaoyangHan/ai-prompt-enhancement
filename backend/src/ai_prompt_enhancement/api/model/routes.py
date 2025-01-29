from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, ValidationError
from typing import Dict, List, Optional
from loguru import logger

from ...services.model.deepseek_service import DeepseekService
from ...core.config import get_settings

router = APIRouter(
    prefix="/models",
    tags=["model-management"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)

class ModelCapabilities(BaseModel):
    """
    Model for representing AI model capabilities.
    """
    name: str = Field(..., description="Name of the model")
    version: str = Field(..., description="Model version")
    capabilities: List[str] = Field(..., description="List of model capabilities")
    max_tokens: int = Field(..., description="Maximum tokens the model can process")
    supported_languages: List[str] = Field(..., description="Languages supported by the model")

    class Config:
        schema_extra = {
            "example": {
                "name": "deepseek-chat",
                "version": "1.0.0",
                "capabilities": ["prompt analysis", "code generation", "text completion"],
                "max_tokens": 8192,
                "supported_languages": ["en", "zh"]
            }
        }

class ModelStatus(BaseModel):
    """
    Model for representing AI model status.
    """
    name: str = Field(..., description="Name of the model")
    status: str = Field(..., description="Current status of the model")
    latency: float = Field(..., description="Current average latency in seconds")
    requests_per_minute: int = Field(..., description="Current requests per minute")
    error_rate: float = Field(..., description="Current error rate percentage")

    class Config:
        schema_extra = {
            "example": {
                "name": "deepseek-chat",
                "status": "healthy",
                "latency": 0.5,
                "requests_per_minute": 100,
                "error_rate": 0.1
            }
        }

@router.get("/capabilities", response_model=List[ModelCapabilities])
async def get_model_capabilities(
    deepseek_service: DeepseekService = Depends(lambda: DeepseekService())
) -> List[ModelCapabilities]:
    """
    Get capabilities of all available AI models.

    Returns:
        List[ModelCapabilities]: List of model capabilities

    Raises:
        HTTPException: If retrieving capabilities fails
    """
    try:
        logger.info("Retrieving model capabilities...")
        capabilities = await deepseek_service.get_capabilities()
        try:
            return [ModelCapabilities(**cap) for cap in capabilities]
        except ValidationError as e:
            logger.error(f"Validation error in model capabilities: {str(e)}")
            raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving model capabilities: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve model capabilities: {str(e)}"
        )

@router.get("/status", response_model=List[ModelStatus])
async def get_model_status(
    deepseek_service: DeepseekService = Depends(lambda: DeepseekService())
) -> List[ModelStatus]:
    """
    Get current status of all AI models.

    Returns:
        List[ModelStatus]: List of model status information

    Raises:
        HTTPException: If retrieving status fails
    """
    try:
        logger.info("Retrieving model status...")
        status = await deepseek_service.get_status()
        try:
            return [ModelStatus(**stat) for stat in status]
        except ValidationError as e:
            logger.error(f"Validation error in model status: {str(e)}")
            raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving model status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve model status: {str(e)}"
        ) 