from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum

class ModelType(str, Enum):
    GPT_4 = "gpt-4"
    GPT_3_5 = "gpt-3.5-turbo"
    CLAUDE = "claude"
    DEFAULT = "default"

class PromptAnalyzeRequest(BaseModel):
    prompt_text: str = Field(..., description="The prompt text to analyze")
    model_type: Optional[ModelType] = Field(default=ModelType.DEFAULT, description="The model type to validate against")
    context: Optional[str] = Field(None, description="Additional context for prompt analysis")
    
class AnalysisMetric(BaseModel):
    score: float = Field(..., ge=0, le=1)
    description: str
    suggestions: List[str]

class PromptAnalysisResponse(BaseModel):
    overall_score: float = Field(..., ge=0, le=1)
    metrics: Dict[str, AnalysisMetric]
    suggestions: List[str]
    model_type: ModelType
    timestamp: str 