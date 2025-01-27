from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class PromptPreferences(BaseModel):
    style: str = Field(default="professional", description="The desired writing style")
    tone: str = Field(default="neutral", description="The desired tone of voice")

class PromptAnalyzeRequest(BaseModel):
    prompt_text: str = Field(..., description="The prompt text to analyze")
    context: Optional[str] = Field(default=None, description="Optional context for the prompt")
    preferences: Optional[PromptPreferences] = Field(default_factory=PromptPreferences)

class AnalysisMetric(BaseModel):
    score: float = Field(..., ge=0, le=1, description="Score between 0 and 1")
    description: str = Field(..., description="Description of the metric result")
    suggestions: List[str] = Field(default_factory=list, description="Improvement suggestions")

class PromptAnalysisResponse(BaseModel):
    metrics: Dict[str, AnalysisMetric] = Field(..., description="Analysis metrics")
    suggestions: List[str] = Field(..., description="Overall improvement suggestions")
    enhanced_prompt: Optional[str] = Field(None, description="Enhanced version of the prompt") 