"""OpenAI service for prompt analysis and comparison."""
import json
import logging
import re
from typing import Dict, List, Optional, Union

from openai import OpenAI

from ai_prompt_enhancement.config.settings import get_settings
from ai_prompt_enhancement.services.prompt_refinement.prompt_templates import (
    ANALYSIS_TEMPLATE,
    COMPARISON_TEMPLATE,
)

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        """Initialize the OpenAIService with configuration and OpenAI client."""
        self.settings = get_settings()
        logger.info(f"Initializing OpenAIService with base_url: {self.settings.openai_base_url}")
        
        self.client = OpenAI(
            api_key=self.settings.openai_api_key,
            base_url=self.settings.openai_base_url
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
                # Remove newlines and extra spaces before parsing
                data = data.replace("\n", "").replace("    ", "").strip()
                data = json.loads(data)
            
            # Convert back to string with minimal whitespace
            cleaned_str = json.dumps(data, separators=(',', ':'), ensure_ascii=False)
            # Remove any whitespace around JSON keys
            cleaned_str = re.sub(r'\s*"([^"]+)"\s*:', r'"\1":', cleaned_str)
            # Parse back to dict
            return json.loads(cleaned_str)
        except (json.JSONDecodeError, TypeError) as e:
            logger.error(f"Error cleaning JSON: {str(e)}")
            logger.error(f"Raw data that failed to parse: {data}")
            raise ValueError(f"Invalid JSON format: {str(e)}")

    async def analyze_prompt(self, prompt: str, context: Optional[str] = None) -> Dict:
        """Analyze a prompt using the OpenAI model."""
        try:
            logger.info("=== Starting prompt analysis in OpenAIService ===")
            logger.info(f"Input prompt: '{prompt}'")
            logger.info(f"Input context: '{context}'")
            
            formatted_prompt = ANALYSIS_TEMPLATE.format(
                prompt=self._clean_text(prompt),
                context=self._clean_text(context) if context else "No additional context provided"
            )
            logger.info("Formatted prompt for model:")
            logger.info(formatted_prompt)
            
            # Make API request
            logger.info("Making API request to model...")
            response = self.client.chat.completions.create(
                model=self.settings.openai_model,
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
                temperature=0.7,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            logger.info("Received response from model")
            
            # Process response
            content = response.choices[0].message.content
            logger.info("Raw model response:")
            logger.info(content)
            
            try:
                # Parse and validate response
                logger.info("Parsing model response...")
                analysis = self._clean_json(content)
                logger.info("Successfully parsed response to JSON")
                
                # Ensure the response has the required structure
                if not isinstance(analysis, dict):
                    logger.warning("Response is not a dictionary, creating error response")
                    return self._create_analyze_error_response(
                        "Failed to get valid response",
                        ["The model response was not in the correct format"],
                        prompt
                    )
                
                # Initialize default structure if missing
                if "metrics" not in analysis or not isinstance(analysis["metrics"], dict):
                    logger.warning("Missing or invalid metrics, using defaults")
                    analysis["metrics"] = {
                        "clarity": {
                            "score": 0.5,
                            "description": "Analysis incomplete",
                            "suggestions": ["Make the prompt more clear and concise", "Remove ambiguous terms"]
                        },
                        "structure": {
                            "score": 0.5,
                            "description": "Analysis incomplete",
                            "suggestions": ["Organize the prompt into clear sections", "Use bullet points or numbering"]
                        },
                        "examples": {
                            "score": 0.5,
                            "description": "Analysis incomplete",
                            "suggestions": ["Add relevant examples", "Include sample inputs and outputs"]
                        },
                        "formatting": {
                            "score": 0.5,
                            "description": "Analysis incomplete",
                            "suggestions": ["Use proper markdown formatting", "Add line breaks for readability"]
                        },
                        "output_spec": {
                            "score": 0.5,
                            "description": "Analysis incomplete",
                            "suggestions": ["Specify desired output format", "Define response structure"]
                        }
                    }
                if "suggestions" not in analysis:
                    analysis["suggestions"] = ["Consider adding more details to your prompt"]
                if "enhanced_prompt" not in analysis:
                    analysis["enhanced_prompt"] = prompt
                
                analysis["model_used"] = self.settings.openai_model
                logger.info("Successfully prepared analysis result")
                return analysis
                
            except (json.JSONDecodeError, ValueError) as e:
                logger.error(f"Failed to parse model response: {str(e)}")
                return self._create_analyze_error_response(
                    "Failed to parse model response",
                    ["The model response was not valid JSON", "Try simplifying your prompt"],
                    prompt
                )
                
        except Exception as e:
            logger.error(f"API request failed: {str(e)}")
            return self._create_analyze_error_response(
                "API request failed",
                ["Please check your API settings and try again", "The service might be temporarily unavailable"],
                prompt
            )

    def _create_analyze_error_response(self, description: str, suggestions: List[str], prompt: str) -> Dict:
        """Create a standardized error response for analyze endpoint."""
        return {
            "metrics": {
                "clarity": {
                    "score": 0.0,
                    "description": description,
                    "suggestions": suggestions
                },
                "structure": {
                    "score": 0.0,
                    "description": description,
                    "suggestions": suggestions
                },
                "examples": {
                    "score": 0.0,
                    "description": description,
                    "suggestions": suggestions
                },
                "formatting": {
                    "score": 0.0,
                    "description": description,
                    "suggestions": suggestions
                },
                "output_spec": {
                    "score": 0.0,
                    "description": description,
                    "suggestions": suggestions
                }
            },
            "suggestions": suggestions,
            "enhanced_prompt": prompt,
            "model_used": self.settings.openai_model
        }

    async def compare_prompts(self, original_prompt: str, enhanced_prompt: str, context: Optional[Dict] = None) -> Dict:
        """Compare original and enhanced prompts."""
        logger.info("Starting prompt comparison")
        logger.debug(f"Original prompt: {original_prompt}")
        logger.debug(f"Enhanced prompt: {enhanced_prompt}")
        logger.debug(f"Context: {context}")
        
        try:
            # Prepare the analysis result
            analysis_result = {
                "metrics": {},
                "suggestions": [],
                "original_prompt": original_prompt,
                "enhanced_prompt": enhanced_prompt,
                "context": context
            }
            
            # Clean the analysis result
            cleaned_result = self._clean_json(analysis_result)
            
            try:
                # Make API request with the template in the system message
                response = self.client.chat.completions.create(
                    model=self.settings.openai_model,
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
                    temperature=0.7,
                    max_tokens=2000,
                    response_format={"type": "json_object"}
                )
                
                # Process and validate response
                content = response.choices[0].message.content
                logger.debug(f"Raw API response:\n{content}")
                comparison = self._clean_json(content)
                
                # Add model information
                comparison["model_used"] = self.settings.openai_model
                
                return comparison
                
            except Exception as e:
                logger.error(f"API request failed: {str(e)}")
                return self._create_error_response(
                    "API request failed",
                    ["Please check your network connection and API settings"],
                    original_prompt,
                    str(e)
                )
                
        except Exception as e:
            logger.error(f"Error during prompt comparison: {str(e)}")
            return self._create_error_response(
                "Error during comparison",
                ["An unexpected error occurred during the comparison"],
                original_prompt,
                str(e)
            )

    def _create_error_response(self, description: str, suggestions: List[str], prompt: str, error: str) -> Dict:
        """Create a standardized error response that matches the expected schema exactly."""
        error_metrics = {
            "clarity": {
                "score": 0.0,
                "description": description,
                "suggestions": suggestions
            },
            "structure": {
                "score": 0.0,
                "description": description,
                "suggestions": suggestions
            }
        }
        
        return {
            "original_prompt": {
                "prompt": prompt,
                "metrics": error_metrics,
                "suggestions": suggestions
            },
            "enhanced_prompt": {
                "prompt": prompt,
                "metrics": error_metrics,
                "suggestions": suggestions,
                "comparison": "Error occurred during comparison"
            },
            "model_used": self.settings.openai_model
        } 