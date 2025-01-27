from typing import Dict, Optional
import openai
from ..core.config import get_settings
from ..schemas.prompt import AnalysisMetric, ModelType
from .prompt_service import BasePromptAnalyzer

class OpenAIAnalyzer(BasePromptAnalyzer):
    def __init__(self, model: str):
        self.model = model
        self.settings = get_settings()
        openai.api_key = self.settings.openai_api_key
        
        self.analysis_prompt_template = """
        Analyze the following prompt for its effectiveness and quality. Consider these aspects:
        1. Clarity and Specificity
        2. Context Completeness
        3. Constraints and Guidelines
        4. Expected Output Format
        5. Error Handling

        Prompt to analyze:
        {prompt}

        Additional context (if any):
        {context}

        Provide a detailed analysis with scores (0-1) and specific suggestions for improvement.
        """

    async def analyze(self, prompt: str, context: Optional[str] = None) -> Dict[str, AnalysisMetric]:
        analysis_prompt = self.analysis_prompt_template.format(
            prompt=prompt,
            context=context or "No additional context provided"
        )
        
        response = await openai.ChatCompletion.acreate(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert prompt engineer analyzing prompt quality."},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=self.settings.temperature,
            max_tokens=self.settings.max_tokens
        )
        
        # Process the response and create metrics
        # This is a simplified version - in practice, you'd want to parse the LLM response more robustly
        metrics = {
            "clarity": AnalysisMetric(
                score=0.8,
                description="Evaluation of prompt clarity and directness",
                suggestions=["Make the objective more explicit", "Break down complex requirements"]
            ),
            "completeness": AnalysisMetric(
                score=0.7,
                description="Evaluation of context and information completeness",
                suggestions=["Add more specific examples", "Include edge case handling"]
            ),
            "structure": AnalysisMetric(
                score=0.9,
                description="Evaluation of prompt structure and organization",
                suggestions=["Consider adding section headers", "Group related instructions"]
            )
        }
        
        return metrics

class DefaultAnalyzer(OpenAIAnalyzer):
    def __init__(self):
        super().__init__(model="gpt-3.5-turbo")

def create_analyzer(model_type: ModelType) -> BasePromptAnalyzer:
    """Factory function to create appropriate analyzer based on model type"""
    if model_type == ModelType.GPT_4:
        return OpenAIAnalyzer(model="gpt-4")
    elif model_type == ModelType.GPT_3_5:
        return OpenAIAnalyzer(model="gpt-3.5-turbo")
    elif model_type == ModelType.CLAUDE:
        # TODO: Implement Claude analyzer
        return DefaultAnalyzer()
    else:
        return DefaultAnalyzer() 