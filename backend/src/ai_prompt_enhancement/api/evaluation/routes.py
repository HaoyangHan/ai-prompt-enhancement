from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from loguru import logger
import json

from ...services.evaluation.evaluation_service import EvaluationService
from ...core.config import get_settings

router = APIRouter(
    prefix="/evaluation",
    tags=["prompt-evaluation"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)

# OpenAPI Tags Metadata
tags_metadata = [
    {
        "name": "prompt-evaluation",
        "description": """
        Endpoints for evaluating prompt quality and effectiveness.
        These endpoints allow you to:
        - Evaluate individual prompts against custom criteria
        - Perform batch evaluations on multiple prompts
        - Access pre-defined evaluation templates
        - Get detailed feedback and scores
        """
    }
]

class EvaluationCriteria(BaseModel):
    """Model for evaluation criteria configuration."""
    name: str = Field(..., description="Name of the evaluation criterion")
    weight: float = Field(..., ge=0, le=1, description="Weight of the criterion (0-1)")
    description: str = Field(..., description="Description of what the criterion measures")
    threshold: Optional[float] = Field(None, ge=0, le=1, description="Minimum acceptable score (0-1)")

    class Config:
        schema_extra = {
            "example": {
                "name": "clarity",
                "weight": 0.4,
                "description": "Measures how clear and unambiguous the prompt is",
                "threshold": 0.7
            }
        }

class EvaluationRequest(BaseModel):
    """Request model for prompt evaluation."""
    prompt: str = Field(..., description="The prompt to evaluate", min_length=1)
    criteria: List[EvaluationCriteria] = Field(..., description="List of evaluation criteria")
    context: Optional[Dict] = Field(None, description="Optional context for evaluation")

    class Config:
        schema_extra = {
            "example": {
                "prompt": "Generate a professional email to a client...",
                "criteria": [
                    {
                        "name": "clarity",
                        "weight": 0.4,
                        "description": "Measures clarity",
                        "threshold": 0.7
                    },
                    {
                        "name": "professionalism",
                        "weight": 0.6,
                        "description": "Measures professional tone",
                        "threshold": 0.8
                    }
                ],
                "context": {
                    "domain": "business",
                    "audience": "clients"
                }
            }
        }

class EvaluationResult(BaseModel):
    """
    Model for evaluation results.
    """
    overall_score: float = Field(..., ge=0, le=1, description="Overall evaluation score (0-1)")
    criteria_scores: Dict[str, float] = Field(..., description="Individual scores for each criterion")
    feedback: List[str] = Field(..., description="List of feedback points")
    passed_thresholds: bool = Field(..., description="Whether all thresholds were met")

    class Config:
        schema_extra = {
            "example": {
                "overall_score": 0.85,
                "criteria_scores": {
                    "clarity": 0.9,
                    "professionalism": 0.8
                },
                "feedback": [
                    "Clear and well-structured prompt",
                    "Professional tone maintained throughout"
                ],
                "passed_thresholds": True
            }
        }

class BatchEvaluationResult(BaseModel):
    """
    Model for batch evaluation results.
    """
    total_prompts: int = Field(..., description="Total number of prompts evaluated")
    passed_prompts: int = Field(..., description="Number of prompts that passed all thresholds")
    average_score: float = Field(..., description="Average overall score across all prompts")
    results: Dict[str, EvaluationResult] = Field(..., description="Individual results for each prompt")

    class Config:
        schema_extra = {
            "example": {
                "total_prompts": 10,
                "passed_prompts": 8,
                "average_score": 0.82,
                "results": {
                    "prompt_1": {
                        "overall_score": 0.85,
                        "criteria_scores": {"clarity": 0.9},
                        "feedback": ["Well-structured prompt"],
                        "passed_thresholds": True
                    }
                }
            }
        }

class EvaluationPromptResponse(BaseModel):
    """Model for evaluation prompt response."""
    id: str = Field(..., description="Unique identifier for the prompt")
    name: str = Field(..., description="Name of the evaluation prompt")
    description: str = Field(..., description="Description of what the prompt evaluates")
    prompt: str = Field(..., description="The prompt template")
    variables: List[str] = Field(..., description="List of variables used in the prompt")

    class Config:
        schema_extra = {
            "example": {
                "id": "template_1",
                "name": "Customer Service Email",
                "description": "Template for evaluating customer service email prompts",
                "prompt": "Evaluate this customer service email: {email_text}",
                "variables": ["email_text"]
            }
        }

@router.post(
    "/evaluate",
    response_model=EvaluationResult,
    summary="Evaluate a single prompt",
    description="""
    Evaluate a prompt against specified criteria.
    
    This endpoint allows you to:
    - Define custom evaluation criteria with weights
    - Set minimum score thresholds
    - Get detailed feedback on each criterion
    - Receive an overall quality score
    
    The evaluation considers:
    - Clarity and specificity
    - Contextual appropriateness
    - Effectiveness for intended use
    - Compliance with best practices
    """,
    response_description="Detailed evaluation results with scores and feedback",
    responses={
        200: {
            "description": "Successfully evaluated prompt",
            "content": {
                "application/json": {
                    "example": {
                        "overall_score": 0.85,
                        "criteria_scores": {
                            "clarity": 0.9,
                            "professionalism": 0.8
                        },
                        "feedback": [
                            "Clear and well-structured prompt",
                            "Professional tone maintained throughout"
                        ],
                        "passed_thresholds": True
                    }
                }
            }
        },
        422: {
            "description": "Validation error",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid criteria weights"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Evaluation service error"}
                }
            }
        }
    }
)
async def evaluate_prompt(
    request: EvaluationRequest,
    evaluation_service: EvaluationService = Depends(lambda: EvaluationService())
) -> EvaluationResult:
    """Evaluate a single prompt against specified criteria."""
    try:
        return await evaluation_service.evaluate_prompt(
            prompt=request.prompt,
            criteria=request.criteria,
            context=request.context
        )
    except Exception as e:
        logger.error(f"Error evaluating prompt: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post(
    "/evaluate/batch",
    response_model=BatchEvaluationResult,
    summary="Evaluate multiple prompts",
    description="""
    Perform batch evaluation on multiple prompts.
    
    Upload a CSV file containing prompts to evaluate them all against
    the same set of criteria. The CSV should have columns:
    - prompt_id: Unique identifier for each prompt
    - prompt_text: The prompt to evaluate
    
    Additional columns will be treated as context variables.
    """,
    response_description="Batch evaluation results with individual and aggregate scores",
    responses={
        200: {
            "description": "Successfully evaluated prompts",
            "content": {
                "application/json": {
                    "example": {
                        "total_prompts": 10,
                        "passed_prompts": 8,
                        "average_score": 0.82,
                        "results": {
                            "prompt_1": {
                                "overall_score": 0.85,
                                "criteria_scores": {"clarity": 0.9},
                                "feedback": ["Well-structured prompt"],
                                "passed_thresholds": True
                            }
                        }
                    }
                }
            }
        },
        400: {
            "description": "Invalid file format",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid CSV format"}
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Batch evaluation failed"}
                }
            }
        }
    }
)
async def evaluate_prompts_batch(
    file: UploadFile = File(...),
    criteria: str = Form(...),
    evaluation_service: EvaluationService = Depends(lambda: EvaluationService())
) -> BatchEvaluationResult:
    """Evaluate multiple prompts in batch mode."""
    try:
        criteria_list = json.loads(criteria)
        return await evaluation_service.evaluate_prompts_batch(file, criteria_list)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid criteria JSON format")
    except Exception as e:
        logger.error(f"Error in batch evaluation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/prompts",
    response_model=List[EvaluationPromptResponse],
    summary="Get evaluation templates",
    description="""
    Retrieve available evaluation prompt templates.
    
    These templates provide pre-defined evaluation criteria and
    prompts for common use cases. Each template includes:
    - Template name and description
    - Required variables
    - Default criteria and thresholds
    - Usage examples
    """,
    response_description="List of available evaluation templates",
    responses={
        200: {
            "description": "Successfully retrieved templates",
            "content": {
                "application/json": {
                    "example": [{
                        "id": "template_1",
                        "name": "Customer Service Email",
                        "description": "Template for evaluating customer service email prompts",
                        "prompt": "Evaluate this customer service email: {email_text}",
                        "variables": ["email_text"]
                    }]
                }
            }
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {"detail": "Failed to retrieve templates"}
                }
            }
        }
    }
)
async def get_evaluation_prompts(
    evaluation_service: EvaluationService = Depends(lambda: EvaluationService())
) -> List[EvaluationPromptResponse]:
    """Retrieve available evaluation prompt templates."""
    try:
        return await evaluation_service.get_evaluation_prompts()
    except Exception as e:
        logger.error(f"Error retrieving evaluation prompts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 