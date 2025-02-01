from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Union
import logging

from ..schemas.prompt import (
    PromptAnalyzeRequest,
    PromptAnalysisResponse,
    PromptComparisonRequest,
    PromptComparisonResponse,
)
from ..services.prompt_service import PromptService

router = APIRouter(
    prefix="/prompts",
    tags=["prompts"]
)

# OpenAPI Tags Metadata
tags_metadata = [
    {
        "name": "prompts",
        "description": """
        Core endpoints for prompt analysis and comparison.
        These endpoints allow you to:
        - Analyze prompts for quality and effectiveness
        - Compare original and enhanced prompts
        - Track analysis and comparison history
        - Get detailed metrics and suggestions
        """
    }
]

logger = logging.getLogger(__name__)

@router.post(
    "/analyze",
    response_model=PromptAnalysisResponse,
    summary="Analyze prompt quality",
    description="""
    Analyze a prompt for quality and provide improvement suggestions.
    
    This endpoint evaluates prompts based on multiple criteria:
    - Clarity and specificity
    - Structure and organization
    - Example usage
    - Output specification
    - Overall effectiveness
    
    The analysis includes:
    - Detailed metrics with scores
    - Specific improvement suggestions
    - Enhanced version of the prompt
    """,
    response_description="Detailed analysis of the prompt with metrics and suggestions",
    responses={
        200: {
            "description": "Successfully analyzed prompt",
            "content": {
                "application/json": {
                    "example": {
                        "metrics": {
                            "clarity": {
                                "score": 0.85,
                                "description": "The prompt is clear but could be more specific",
                                "suggestions": ["Add more context about the desired output"]
                            },
                            "structure": {
                                "score": 0.9,
                                "description": "Well-structured with clear sections",
                                "suggestions": ["Consider adding bullet points"]
                            }
                        },
                        "suggestions": [
                            "Add specific examples",
                            "Include output format requirements"
                        ],
                        "enhanced_prompt": "Enhanced version of the prompt...",
                        "model_used": "gpt-4"
                    }
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to analyze prompt"}
                }
            }
        }
    }
)
async def analyze_prompt(
    request: Union[PromptAnalyzeRequest, Dict] = Body(
        ...,
        example={
            "prompt_text": "Generate a professional email...",
            "preferences": {
                "style": "professional",
                "tone": "neutral",
                "model": "gpt-4"
            }
        }
    ),
    prompt_service: PromptService = Depends()
) -> PromptAnalysisResponse:
    """
    Analyze a prompt for quality and provide improvement suggestions.
    Accepts both structured PromptAnalyzeRequest and simplified dictionary format.
    """
    try:
        return await prompt_service.analyze_prompt(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/compare",
    response_model=PromptComparisonResponse,
    summary="Compare prompt versions",
    description="""
    Compare the original and enhanced versions of a prompt.
    
    This endpoint provides a detailed comparison between two prompt versions:
    - Metrics comparison
    - Highlighted differences
    - Improvement analysis
    - Specific strengths and weaknesses
    
    Use this to understand how the enhanced version improves upon the original.
    """,
    response_description="Detailed comparison between original and enhanced prompts",
    responses={
        200: {
            "description": "Successfully compared prompts",
            "content": {
                "application/json": {
                    "example": {
                        "original_prompt": {
                            "prompt": "Original prompt text...",
                            "metrics": {
                                "clarity": {
                                    "score": 0.7,
                                    "description": "Somewhat clear but could be improved",
                                    "suggestions": ["Be more specific"]
                                }
                            }
                        },
                        "enhanced_prompt": {
                            "prompt": "Enhanced prompt text...",
                            "metrics": {
                                "clarity": {
                                    "score": 0.9,
                                    "description": "Very clear and specific",
                                    "suggestions": []
                                }
                            },
                            "highlighted_prompt": "<span>Enhanced</span> prompt text..."
                        },
                        "model_used": "gpt-4"
                    }
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to compare prompts"}
                }
            }
        }
    }
)
async def compare_prompts(
    request: PromptComparisonRequest = Body(
        ...,
        example={
            "analysis_result": {
                "original_prompt": "Original text...",
                "enhanced_prompt": "Enhanced text...",
                "metrics": {},
                "model_used": "gpt-4"
            },
            "preferences": {
                "style": "professional",
                "tone": "neutral"
            }
        }
    ),
    prompt_service: PromptService = Depends()
) -> PromptComparisonResponse:
    """Compare the original and enhanced versions of a prompt."""
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

@router.get(
    "/history/analysis",
    response_model=List[Dict],
    summary="Get analysis history",
    description="""
    Retrieve the history of prompt analyses.
    
    Returns a list of previous prompt analysis results, including:
    - Original prompts
    - Analysis metrics
    - Suggestions
    - Enhanced versions
    - Timestamps
    """,
    response_description="List of historical prompt analyses",
    responses={
        200: {
            "description": "Successfully retrieved analysis history",
            "content": {
                "application/json": {
                    "example": [{
                        "timestamp": "2024-02-01T12:00:00",
                        "original_prompt": "Original prompt...",
                        "enhanced_prompt": "Enhanced prompt...",
                        "metrics": {
                            "clarity": {"score": 0.8}
                        },
                        "model_used": "gpt-4"
                    }]
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to retrieve analysis history"}
                }
            }
        }
    }
)
async def get_analysis_history(
    prompt_service: PromptService = Depends()
) -> List[Dict]:
    """Retrieve the history of prompt analyses."""
    try:
        return prompt_service.get_analysis_history()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/history/comparison",
    response_model=List[Dict],
    summary="Get comparison history",
    description="""
    Retrieve the history of prompt comparisons.
    
    Returns a list of previous prompt comparisons, including:
    - Original and enhanced prompts
    - Comparison metrics
    - Highlighted differences
    - Timestamps
    """,
    response_description="List of historical prompt comparisons",
    responses={
        200: {
            "description": "Successfully retrieved comparison history",
            "content": {
                "application/json": {
                    "example": [{
                        "timestamp": "2024-02-01T12:00:00",
                        "original_prompt": {
                            "prompt": "Original text...",
                            "metrics": {}
                        },
                        "enhanced_prompt": {
                            "prompt": "Enhanced text...",
                            "metrics": {}
                        },
                        "model_used": "gpt-4"
                    }]
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to retrieve comparison history"}
                }
            }
        }
    }
)
async def get_comparison_history(
    prompt_service: PromptService = Depends()
) -> List[Dict]:
    """Retrieve the history of prompt comparisons."""
    try:
        return prompt_service.get_comparison_history()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 