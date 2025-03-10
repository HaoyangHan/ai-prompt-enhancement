from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Dict, Any
from enum import Enum
import json
import os
from datetime import datetime

from ai_prompt_enhancement.services.prompt_refinement import StellarService
from ai_prompt_enhancement.schemas.prompt import (
    PromptAnalyzeRequest,
    PromptAnalysisResponse,
    PromptComparisonRequest,
    PromptComparisonResponse,
)

router = APIRouter(
    prefix="/stellar",
    tags=["stellar"]
)

# History directories
ANALYSIS_HISTORY_DIR = "data/analysis_history"
COMPARISON_HISTORY_DIR = "data/comparison_history"

# Ensure history directories exist
os.makedirs(ANALYSIS_HISTORY_DIR, exist_ok=True)
os.makedirs(COMPARISON_HISTORY_DIR, exist_ok=True)

async def get_stellar_service():
    """
    Dependency to get an initialized Stellar service.
    """
    service = StellarService()
    await service.initialize_client()
    return service

@router.post(
    "/analyze",
    response_model=PromptAnalysisResponse,
    summary="Analyze prompt with Stellar",
    description="""
    Analyze a prompt using the Stellar model.
    
    This endpoint evaluates the prompt based on various criteria such as clarity,
    specificity, context, constraints, examples, tone, structure, and conciseness.
    It returns scores and suggestions for improvement.
    """
)
async def analyze_prompt(
    request: PromptAnalyzeRequest,
    stellar_service: StellarService = Depends(get_stellar_service)
):
    """
    Analyze a prompt using the Stellar model.
    """
    result = await stellar_service.analyze_prompt(request.prompt_text, model=request.preferences.get("model"))
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Save analysis to history
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"stellar_analysis_{timestamp}.json"
    filepath = os.path.join(ANALYSIS_HISTORY_DIR, filename)
    
    with open(filepath, "w") as f:
        json.dump(result, f, indent=2)
    
    return result

@router.post(
    "/enhance",
    response_model=Dict[str, Any],
    summary="Enhance prompt with Stellar",
    description="""
    Enhance a prompt using the Stellar model.
    
    This endpoint takes an original prompt and optional enhancement instructions,
    then generates an improved version with explanations of the changes made.
    """
)
async def enhance_prompt(
    request: PromptAnalyzeRequest,
    instruction: Optional[str] = None,
    stellar_service: StellarService = Depends(get_stellar_service)
):
    """
    Enhance a prompt using the Stellar model.
    """
    result = await stellar_service.enhance_prompt(
        request.prompt_text, 
        instruction=instruction,
        model=request.preferences.get("model")
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.post(
    "/compare",
    response_model=PromptComparisonResponse,
    summary="Compare prompts with Stellar",
    description="""
    Compare an original prompt with an enhanced version using the Stellar model.
    
    This endpoint analyzes both prompts and provides a detailed comparison
    of their strengths and weaknesses, highlighting the improvements made.
    """
)
async def compare_prompts(
    request: PromptComparisonRequest,
    stellar_service: StellarService = Depends(get_stellar_service)
):
    """
    Compare prompts using the Stellar model.
    """
    original_prompt = request.analysis_result.get("original_prompt", "")
    enhanced_prompt = request.analysis_result.get("enhanced_prompt", "")
    model = request.preferences.get("model")
    
    result = await stellar_service.compare_prompts(original_prompt, enhanced_prompt, model=model)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Save comparison to history
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"stellar_comparison_{timestamp}.json"
    filepath = os.path.join(COMPARISON_HISTORY_DIR, filename)
    
    with open(filepath, "w") as f:
        json.dump(result, f, indent=2)
    
    return result

@router.get(
    "/history/analysis",
    response_model=List[Dict[str, Any]],
    summary="Get Stellar analysis history",
    description="""
    Retrieve the history of prompt analyses performed with the Stellar model.
    
    Returns a list of all previous prompt analyses with their results,
    sorted by timestamp (most recent first).
    """
)
async def get_analysis_history():
    """
    Get the history of Stellar prompt analyses.
    """
    history = []
    
    for filename in os.listdir(ANALYSIS_HISTORY_DIR):
        if filename.startswith("stellar_analysis_") and filename.endswith(".json"):
            filepath = os.path.join(ANALYSIS_HISTORY_DIR, filename)
            with open(filepath, "r") as f:
                analysis = json.load(f)
                # Add the filename as ID for reference
                analysis["id"] = filename.replace(".json", "")
                history.append(analysis)
    
    # Sort by timestamp (most recent first)
    history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return history

@router.get(
    "/history/comparison",
    response_model=List[Dict[str, Any]],
    summary="Get Stellar comparison history",
    description="""
    Retrieve the history of prompt comparisons performed with the Stellar model.
    
    Returns a list of all previous prompt comparisons with their results,
    sorted by timestamp (most recent first).
    """
)
async def get_comparison_history():
    """
    Get the history of Stellar prompt comparisons.
    """
    history = []
    
    for filename in os.listdir(COMPARISON_HISTORY_DIR):
        if filename.startswith("stellar_comparison_") and filename.endswith(".json"):
            filepath = os.path.join(COMPARISON_HISTORY_DIR, filename)
            with open(filepath, "r") as f:
                comparison = json.load(f)
                # Add the filename as ID for reference
                comparison["id"] = filename.replace(".json", "")
                history.append(comparison)
    
    # Sort by timestamp (most recent first)
    history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return history 