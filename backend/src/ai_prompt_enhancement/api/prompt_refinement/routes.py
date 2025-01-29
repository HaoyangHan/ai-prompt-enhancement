from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Optional, List
from loguru import logger

from ...services.prompt_refinement.refinement_service import RefinementService
from ...core.config import get_settings

router = APIRouter(
    prefix="/prompts/refinement",
    tags=["prompt-refinement"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)

class AnalyzeRequest(BaseModel):
    """
    Request model for prompt analysis.
    """
    prompt: str = Field(..., description="The prompt text to analyze", min_length=1)
    context: Optional[Dict] = Field(None, description="Optional context for analysis")
    metrics: Optional[List[str]] = Field(
        None, 
        description="Specific metrics to analyze. If not provided, all metrics will be analyzed."
    )

    class Config:
        schema_extra = {
            "example": {
                "prompt": "Write a function to calculate fibonacci numbers",
                "context": {"domain": "programming", "level": "intermediate"},
                "metrics": ["clarity", "specificity", "completeness"]
            }
        }

class AnalyzeResponse(BaseModel):
    """
    Response model for prompt analysis results.
    """
    metrics: Dict = Field(..., description="Analysis metrics and scores")
    suggestions: List[str] = Field(..., description="List of improvement suggestions")
    enhanced_prompt: Optional[str] = Field(None, description="Enhanced version of the prompt")

    class Config:
        schema_extra = {
            "example": {
                "metrics": {
                    "clarity": 0.85,
                    "specificity": 0.75,
                    "completeness": 0.90
                },
                "suggestions": [
                    "Consider specifying the return type of the function",
                    "Add example inputs and expected outputs"
                ],
                "enhanced_prompt": "Write a Python function that calculates the nth Fibonacci number. The function should return an integer and handle inputs n ≥ 0. Include error handling for invalid inputs."
            }
        }

class CompareRequest(BaseModel):
    """
    Request model for prompt comparison.
    """
    original_prompt: str = Field(..., description="The original prompt text", min_length=1)
    enhanced_prompt: str = Field(..., description="The enhanced prompt text", min_length=1)
    context: Optional[Dict] = Field(None, description="Optional context for comparison")

    class Config:
        schema_extra = {
            "example": {
                "original_prompt": "Write a sorting function",
                "enhanced_prompt": "Write a Python function that implements merge sort algorithm with O(n log n) time complexity",
                "context": {"domain": "algorithms", "level": "advanced"}
            }
        }

class CompareResponse(BaseModel):
    """
    Response model for prompt comparison results.
    """
    comparison_metrics: Dict = Field(..., description="Comparison metrics between prompts")
    improvements: List[str] = Field(..., description="List of identified improvements")
    recommendation: str = Field(..., description="Overall recommendation")

    class Config:
        schema_extra = {
            "example": {
                "comparison_metrics": {
                    "clarity_improvement": 0.3,
                    "specificity_improvement": 0.5,
                    "completeness_improvement": 0.4
                },
                "improvements": [
                    "Added specific programming language",
                    "Specified algorithm type",
                    "Added performance requirements"
                ],
                "recommendation": "The enhanced prompt is significantly more specific and clearer. Recommended to use the enhanced version."
            }
        }

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_prompt(
    request: AnalyzeRequest,
    refinement_service: RefinementService = Depends(lambda: RefinementService())
) -> AnalyzeResponse:
    """
    Analyze a prompt for quality metrics and get improvement suggestions.

    Args:
        request (AnalyzeRequest): The analysis request containing the prompt and optional parameters

    Returns:
        AnalyzeResponse: Analysis results including metrics, suggestions, and enhanced prompt

    Raises:
        HTTPException: If analysis fails or input is invalid
    """
    try:
        logger.info(f"Analyzing prompt: {request.prompt[:100]}...")
        result = await refinement_service.analyze_prompt(
            prompt=request.prompt,
            context=request.context,
            metrics=request.metrics
        )
        return AnalyzeResponse(**result)
    except Exception as e:
        logger.error(f"Error analyzing prompt: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze prompt: {str(e)}"
        )

@router.post("/compare", response_model=CompareResponse)
async def compare_prompts(
    request: CompareRequest,
    refinement_service: RefinementService = Depends(lambda: RefinementService())
) -> CompareResponse:
    """
    Compare original and enhanced prompts to evaluate improvements.

    Args:
        request (CompareRequest): The comparison request containing both prompts

    Returns:
        CompareResponse: Comparison results including metrics and recommendations

    Raises:
        HTTPException: If comparison fails or input is invalid
    """
    try:
        logger.info("Comparing prompts...")
        result = await refinement_service.compare_prompts(
            original_prompt=request.original_prompt,
            enhanced_prompt=request.enhanced_prompt,
            context=request.context
        )
        return CompareResponse(**result)
    except Exception as e:
        logger.error(f"Error comparing prompts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compare prompts: {str(e)}"
        ) 