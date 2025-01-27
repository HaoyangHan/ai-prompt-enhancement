from fastapi import APIRouter, Depends, HTTPException
from typing import List

from ..schemas.prompt import (
    PromptAnalyzeRequest,
    PromptAnalysisResponse,
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