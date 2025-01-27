from openai import OpenAI
from typing import List, Dict, Optional
from ..core.config import get_settings

class DeepseekService:
    def __init__(self):
        self.settings = get_settings()
        self.client = OpenAI(
            api_key=self.settings.deepseek_api_key,
            base_url=self.settings.deepseek_base_url
        )
        
        self.analysis_prompt_template = """
        Analyze the following prompt for its effectiveness and quality. Consider these aspects:
        1. Clarity: Is the prompt clear and unambiguous?
        2. Completeness: Does it include all necessary information?
        3. Context: Is there sufficient context provided?
        4. Constraints: Are any necessary constraints or limitations specified?
        5. Output Format: Is the expected output format clearly defined?

        Prompt to analyze:
        {prompt}

        Additional context (if any):
        {context}

        Analyze each aspect and provide:
        1. A score between 0 and 1 for each aspect
        2. A brief description of your evaluation
        3. Specific suggestions for improvement
        4. An enhanced version of the prompt

        Format your response as JSON with the following structure:
        {{
            "metrics": {{
                "clarity": {{"score": float, "description": "string", "suggestions": ["string"]}},
                "completeness": {{"score": float, "description": "string", "suggestions": ["string"]}},
                "context": {{"score": float, "description": "string", "suggestions": ["string"]}},
                "constraints": {{"score": float, "description": "string", "suggestions": ["string"]}},
                "output_format": {{"score": float, "description": "string", "suggestions": ["string"]}}
            }},
            "suggestions": ["string"],
            "enhanced_prompt": "string"
        }}
        """
    
    async def analyze_prompt(self, prompt: str, context: Optional[str] = None) -> Dict:
        """
        Analyze a prompt using the Deepseek model.
        """
        formatted_prompt = self.analysis_prompt_template.format(
            prompt=prompt,
            context=context or "No additional context provided"
        )
        
        response = self.client.chat.completions.create(
            model=self.settings.deepseek_model,
            messages=[
                {"role": "system", "content": "You are an expert prompt engineer analyzing prompt quality."},
                {"role": "user", "content": formatted_prompt}
            ],
            stream=False
        )
        
        # Extract and parse the response
        analysis = response.choices[0].message.content
        
        # Note: In production, you'd want to add proper JSON parsing and error handling here
        # For now, we're returning a mock response until we verify the model's output format
        return {
            "metrics": {
                "clarity": {
                    "score": 0.8,
                    "description": "The prompt is generally clear but could be more specific",
                    "suggestions": ["Add more specific details about the desired output format"]
                },
                "completeness": {
                    "score": 0.7,
                    "description": "The prompt covers most necessary aspects",
                    "suggestions": ["Consider adding constraints or limitations"]
                }
            },
            "suggestions": [
                "Be more specific about the desired outcome",
                "Add examples of expected output",
                "Include any relevant constraints"
            ],
            "enhanced_prompt": f"{prompt}\n\nPlease provide the output in a clear, structured format."
        } 