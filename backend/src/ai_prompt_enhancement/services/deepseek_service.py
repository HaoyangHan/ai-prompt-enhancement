from openai import OpenAI
from typing import List, Dict, Optional, Any, Union
from loguru import logger
from ..core.config import get_settings
from .prompt_templates import ANALYSIS_TEMPLATE, COMPARISON_TEMPLATE
import json
import ast
import re

class DeepseekService:
    def __init__(self):
        """Initialize the DeepseekService with configuration and OpenAI client."""
        self.settings = get_settings()
        logger.info(f"Initializing DeepseekService with base_url: {self.settings.deepseek_base_url}")
        
        self.client = OpenAI(
            api_key=self.settings.deepseek_api_key,
            base_url=self.settings.deepseek_base_url
        )
        logger.debug("OpenAI client initialized")
    
    @staticmethod
    def _clean_text(text: str) -> str:
        """Clean text by removing extra whitespace and normalizing newlines."""
        if not isinstance(text, str):
            return str(text)
        # Remove all whitespace and normalize
        return ' '.join(text.split())

    @staticmethod
    def _clean_json(data: Union[Dict, str]) -> Dict:
        """Clean and normalize JSON data, handling both string and dict inputs."""
        try:
            # Convert to dict if string
            if isinstance(data, str):
                data = json.loads(data)
            
            # Convert back to string with minimal whitespace
            cleaned_str = json.dumps(data, separators=(',', ':'), ensure_ascii=False)
            # Remove any whitespace around JSON keys
            cleaned_str = re.sub(r'\s*"([^"]+)"\s*:', r'"\1":', cleaned_str)
            # Parse back to dict
            return json.loads(cleaned_str)
        except (json.JSONDecodeError, TypeError) as e:
            logger.error(f"Error cleaning JSON: {str(e)}")
            raise ValueError(f"Invalid JSON format: {str(e)}")

    def _prepare_template(self, template: str, context: Dict) -> tuple[str, str]:
        """Prepare template and context for formatting."""
        logger.debug("Starting template preparation")
        
        # Log the original template and context
        logger.debug(f"Original template:\n{template}")
        logger.debug(f"Original context:\n{json.dumps(context, indent=2)}")
        
        # Clean template - preserve structure but normalize whitespace
        template = template.strip()
        # Replace multiple newlines with single newline
        template = re.sub(r'\n\s*\n', '\n', template)
        # Normalize whitespace around punctuation
        template = re.sub(r'\s*([,:{}])\s*', r'\1 ', template)
        
        # Clean and prepare context
        cleaned_context = self._clean_json(context)
        # Convert to string with minimal whitespace and proper escaping
        context_str = json.dumps(cleaned_context, separators=(',', ':'))
        # Double the curly braces to escape them for string formatting
        context_str = context_str.replace("{", "{{").replace("}", "}}")
        
        logger.debug(f"Cleaned template:\n{template}")
        logger.debug(f"Prepared context:\n{context_str}")
        
        return template, context_str

    async def analyze_prompt(self, prompt: str, context: Optional[str] = None) -> Dict:
        """Analyze a prompt using the Deepseek model."""
        logger.info("Starting prompt analysis")
        logger.debug(f"Input prompt: {prompt}")
        logger.debug(f"Context provided: {context}")
        
        formatted_prompt = ANALYSIS_TEMPLATE.format(
            prompt=self._clean_text(prompt),
            context=self._clean_text(context) if context else "No additional context provided"
        )
        logger.debug(f"Complete formatted prompt sent to model:\n{formatted_prompt}")
        
        try:
            # Make API request
            logger.info(f"Making API request to {self.settings.deepseek_base_url}")
            response = self.client.chat.completions.create(
                model=self.settings.deepseek_model,
                messages=[
                    {
                        "role": "system", 
                        "content": """You are an expert prompt engineer specializing in analyzing and improving prompts.
                        You must ALWAYS respond with ONLY valid JSON, no other text or explanations.
                        Your response must exactly match the structure specified in the user's message.
                        Do not include any markdown formatting, only pure JSON."""
                    },
                    {"role": "user", "content": formatted_prompt}
                ],
                stream=False,
                temperature=0.7,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            logger.debug("API request successful")
            
            # Process response
            content = response.choices[0].message.content
            logger.debug(f"Complete raw response from model:\n{content}")
            
            try:
                # Parse and validate response
                analysis = self._clean_json(content)
                if "metrics" not in analysis:
                    raise ValueError("Invalid response format - missing metrics")
                return analysis
                
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing error: {str(e)}")
                return self._create_error_response(
                    "Failed to parse model response",
                    ["The model response was not valid JSON"],
                    prompt,
                    str(e)
                )
                
        except Exception as e:
            logger.error(f"API request failed: {str(e)}")
            return self._create_error_response(
                "API request failed",
                ["Please check your API settings and try again"],
                prompt,
                str(e)
            )

    def _create_error_response(self, description: str, suggestions: List[str], prompt: str, error: str) -> Dict:
        """Create a standardized error response that matches the expected schema exactly."""
        error_metrics = {
            "error": {
                "score": 0.0,
                "description": description,
                "suggestions": suggestions
            }
        }
        
        return {
            "metrics": error_metrics,
            "suggestions": suggestions,
            "enhanced_prompt": prompt,
            "model_used": self.settings.deepseek_model
        }

    async def compare_prompts(self, analysis_result: Dict) -> Dict:
        """Compare the original and enhanced prompts using the analysis result."""
        logger.info("Starting prompt comparison")
        logger.debug(f"Raw analysis result:\n{json.dumps(analysis_result, indent=2)}")
        
        # Validate input
        if not isinstance(analysis_result, dict):
            raise ValueError("Analysis result must be a dictionary")
            
        required_fields = ['metrics', 'suggestions', 'original_prompt', 'enhanced_prompt']
        missing_fields = [field for field in required_fields if field not in analysis_result]
        if missing_fields:
            raise ValueError(f"Missing required fields: {missing_fields}")
            
        try:
            # Clean the analysis result
            cleaned_result = self._clean_json(analysis_result)
            
            try:
                # Make API request with the template in the system message
                response = self.client.chat.completions.create(
                    model=self.settings.deepseek_model,
                    messages=[
                        {
                            "role": "system", 
                            "content": f"""You are an expert prompt engineer specializing in analyzing and comparing prompts.
                            You must ALWAYS respond with ONLY valid JSON, no other text or explanations.
                            Your response must follow this template structure:
                            {COMPARISON_TEMPLATE}
                            
                            Ensure proper markdown formatting in the comparison text.
                            The response must include 'original_prompt' and 'enhanced_prompt' objects."""
                        },
                        {"role": "user", "content": json.dumps(cleaned_result)}
                    ],
                    stream=False,
                    temperature=0.7,
                    max_tokens=2000,
                    response_format={"type": "json_object"}
                )
            except Exception as e:
                logger.error(f"API request failed: {str(e)}")
                return self._create_error_response(
                    "API request failed",
                    ["Please check your network connection and API settings"],
                    analysis_result.get("original_prompt", ""),
                    str(e)
                )
            
            # Process and validate response
            content = response.choices[0].message.content
            logger.debug(f"Raw API response:\n{content}")
            comparison = self._clean_json(content)
            
            if not all(k in comparison for k in ["original_prompt", "enhanced_prompt"]):
                raise ValueError("Invalid comparison format - missing required fields")
            
            # Transform response to match expected schema
            transformed_response = {
                "original_prompt": comparison["original_prompt"],
                "enhanced_prompt": comparison["enhanced_prompt"],
                "model_used": self.settings.deepseek_model
            }
            
            # Extract suggestions from metrics for both prompts
            for prompt_type in ["original_prompt", "enhanced_prompt"]:
                suggestions = []
                if "metrics" in transformed_response[prompt_type]:
                    for metric in transformed_response[prompt_type]["metrics"].values():
                        if isinstance(metric, dict) and "suggestions" in metric:
                            suggestions.extend(metric["suggestions"])
                transformed_response[prompt_type]["suggestions"] = suggestions or ["No specific suggestions available"]
            
            logger.debug(f"Transformed response:\n{json.dumps(transformed_response, indent=2)}")
            return transformed_response
                
        except Exception as e:
            logger.error(f"Comparison failed: {str(e)}")
            return self._create_error_response(
                "Comparison failed",
                ["Please try again"],
                analysis_result.get("original_prompt", ""),
                str(e)
            )