from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
import logging

from ..schemas.prompt import (
    PromptAnalyzeRequest,
    PromptAnalysisResponse,
    PromptComparisonRequest,
    PromptComparisonResponse,
)
from ..services.prompt_service import PromptService

router = APIRouter(prefix="/api/v1/prompts", tags=["prompts"])

logger = logging.getLogger(__name__)

@router.post("/analyze", response_model=PromptAnalysisResponse)
async def analyze_prompt(
    request: PromptAnalyzeRequest,
    prompt_service: PromptService = Depends()
) -> PromptAnalysisResponse:
    """
    Analyze a prompt for quality and provide improvement suggestions.
    """
    try:
        return await prompt_service.analyze_prompt(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare", response_model=PromptComparisonResponse)
async def compare_prompts(
    request: PromptComparisonRequest,
    prompt_service: PromptService = Depends()
) -> PromptComparisonResponse:
    """
    Compare the original and enhanced versions of a prompt.
    """
    try:
        logger.info("Received comparison request")
        logger.debug(f"Request type: {type(request)}")
        logger.debug(f"Request dict: {request.dict()}")
        logger.debug(f"Request JSON: {request.json()}")
        return await prompt_service.compare_prompts(request)
    except Exception as e:
        logger.error(f"Error in compare_prompts route: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/analysis", response_model=List[Dict])
async def get_analysis_history(
    prompt_service: PromptService = Depends()
) -> List[Dict]:
    """Retrieve the history of prompt analyses."""
    try:
        return prompt_service.get_analysis_history()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/comparison", response_model=List[Dict])
async def get_comparison_history(
    prompt_service: PromptService = Depends()
) -> List[Dict]:
    """Retrieve the history of prompt comparisons."""
    try:
        return prompt_service.get_comparison_history()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 