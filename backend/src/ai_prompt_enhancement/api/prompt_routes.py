from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict

from ..schemas.prompt import (
    PromptAnalyzeRequest,
    PromptAnalysisResponse,
    PromptComparisonRequest,
    PromptComparisonResponse,
)
from ..services.prompt_service import PromptService

router = APIRouter(prefix="/api/v1/prompts", tags=["prompts"])

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
        return await prompt_service.compare_prompts(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 