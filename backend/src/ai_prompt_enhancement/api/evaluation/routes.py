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

class EvaluationCriteria(BaseModel):
    """
    Model for evaluation criteria configuration.
    """
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
    """
    Request model for prompt evaluation.
    """
    prompt: str = Field(..., description="The prompt to evaluate", min_length=1)
    criteria: List[EvaluationCriteria] = Field(..., description="List of evaluation criteria")
    context: Optional[Dict] = Field(None, description="Optional context for evaluation")

    class Config:
        schema_extra = {
            "example": {
                "prompt": "Write a function to sort an array",
                "criteria": [
                    {
                        "name": "clarity",
                        "weight": 0.4,
                        "description": "Measures clarity",
                        "threshold": 0.7
                    },
                    {
                        "name": "specificity",
                        "weight": 0.6,
                        "description": "Measures specificity",
                        "threshold": 0.8
                    }
                ],
                "context": {"domain": "programming", "level": "intermediate"}
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
                    "specificity": 0.8
                },
                "feedback": [
                    "Prompt is clear and well-structured",
                    "Could be more specific about the sorting algorithm"
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
                        "criteria_scores": {"clarity": 0.9, "specificity": 0.8},
                        "feedback": ["Prompt is clear", "Could be more specific"],
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
                "id": "sentiment",
                "name": "Sentiment Analysis",
                "description": "Evaluate the sentiment of text",
                "prompt": "Analyze the sentiment of the following text: {text}",
                "variables": ["text"]
            }
        }

@router.post("/evaluate", response_model=EvaluationResult)
async def evaluate_prompt(
    request: EvaluationRequest,
    evaluation_service: EvaluationService = Depends(lambda: EvaluationService())
) -> EvaluationResult:
    """
    Evaluate a single prompt against specified criteria.

    Args:
        request (EvaluationRequest): The evaluation request containing prompt and criteria

    Returns:
        EvaluationResult: Evaluation results including scores and feedback

    Raises:
        HTTPException: If evaluation fails or input is invalid
    """
    try:
        logger.info(f"Evaluating prompt: {request.prompt[:100]}...")
        result = await evaluation_service.evaluate_prompt(
            prompt=request.prompt,
            criteria=request.criteria,
            context=request.context
        )
        return EvaluationResult(**result)
    except Exception as e:
        logger.error(f"Error evaluating prompt: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate prompt: {str(e)}"
        )

@router.post("/evaluate/batch", response_model=BatchEvaluationResult)
async def evaluate_prompts_batch(
    file: UploadFile = File(...),
    criteria: str = Form(...),
    evaluation_service: EvaluationService = Depends(lambda: EvaluationService())
) -> BatchEvaluationResult:
    """
    Evaluate multiple prompts from a file against specified criteria.

    Args:
        file (UploadFile): CSV file containing prompts to evaluate
        criteria (str): JSON string of evaluation criteria
        evaluation_service (EvaluationService): Service for evaluating prompts

    Returns:
        BatchEvaluationResult: Batch evaluation results

    Raises:
        HTTPException: If evaluation fails or input is invalid
    """
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only CSV files are supported."
            )

        # Read and validate file content
        content = await file.read()
        if not content.strip():
            raise HTTPException(
                status_code=400,
                detail="File is empty"
            )

        try:
            criteria_list = json.loads(criteria)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Invalid criteria format. Must be valid JSON."
            )

        logger.info(f"Evaluating prompts batch from file: {file.filename}")
        result = await evaluation_service.evaluate_prompts_batch(
            file_content=content.decode(),
            criteria=criteria_list
        )
        return BatchEvaluationResult(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error evaluating prompts batch: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to evaluate prompts batch: {str(e)}"
        )

@router.get("/prompts", response_model=List[EvaluationPromptResponse])
async def get_evaluation_prompts(
    evaluation_service: EvaluationService = Depends(lambda: EvaluationService())
) -> List[EvaluationPromptResponse]:
    """
    Get all available evaluation prompts.

    Returns:
        List[EvaluationPromptResponse]: List of available evaluation prompts

    Raises:
        HTTPException: If retrieving prompts fails
    """
    try:
        prompts = evaluation_service.get_all_prompts()
        return [EvaluationPromptResponse(**prompt) for prompt in prompts]
    except Exception as e:
        logger.error(f"Error retrieving evaluation prompts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load evaluation prompts: {str(e)}"
        ) 