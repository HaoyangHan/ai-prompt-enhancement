"""Deepseek service for prompt analysis and generation."""
from openai import OpenAI
from typing import Dict, List, Optional, Union, Any
from loguru import logger
from ...core.config import get_settings
from ..prompt_refinement.prompt_templates import (
    ANALYSIS_TEMPLATE,
    COMPARISON_TEMPLATE,
)
from ..synthetic_data.prompt_templates import SYNTHETIC_DATA_TEMPLATE, SIMILAR_CONTENT_TEMPLATE
import json
import re
from datetime import datetime

logger = logger.bind(service="deepseek")

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
        try:
            logger.info("=== Starting prompt analysis in DeepseekService ===")
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
                
                # Ensure all required fields are present
                analysis["model_used"] = self.settings.deepseek_model
                analysis["timestamp"] = datetime.now().isoformat()
                
                logger.info("Successfully prepared analysis result")
                logger.debug(f"Final analysis result: {json.dumps(analysis, indent=2)}")
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
            "model_used": self.settings.deepseek_model
        }

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
            "model_used": self.settings.deepseek_model
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
                    original_prompt,
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
                original_prompt,
                str(e)
            )

    async def generate_content(self, template: str, batch_size: int = 1) -> Dict[str, Any]:
        """Generate content using the Deepseek model."""
        try:
            logger.info("=== Starting content generation ===")
            logger.debug(f"Parameters: template_length={len(template)}, batch_size={batch_size}")
            
            # Generate content
            try:
                response = self.client.chat.completions.create(
                    model=self.settings.deepseek_model,
                    messages=[{
                        "role": "system",
                        "content": """You are a synthetic data generator that creates high-quality content based on templates.
                        You MUST return a valid JSON object with the following structure for EACH generated item:
                        {
                            "generated_content_1": {
                                "content": "your generated content here",
                                "score": 0.85  // float between 0 and 1
                            }
                        }"""
                    }, {
                        "role": "user",
                        "content": template
                    }],
                    temperature=0.7,
                    max_tokens=2000,
                    n=batch_size,  # Request multiple completions
                    response_format={"type": "json_object"}  # Ensure JSON response
                )
                
                # Log the complete response for debugging
                logger.debug("Raw API Response:")
                logger.debug(f"Status: {getattr(response, 'status', 'N/A')}")
                logger.debug(f"Model: {getattr(response, 'model', 'N/A')}")
                logger.debug(f"Usage: {getattr(response, 'usage', 'N/A')}")
                
                if not response.choices:
                    logger.error("No choices in response")
                    raise ValueError("Empty response from API")
                
                # Process all choices
                all_content = []
                for choice in response.choices:
                    content = choice.message.content
                    logger.debug(f"Raw generated content: {content}")
                    
                    # Attempt to clean and parse the content
                    try:
                        # Remove any markdown code block markers
                        content = re.sub(r'```json\s*|\s*```', '', content)
                        content = content.strip()
                        
                        if not content:
                            raise ValueError("Empty content after cleaning")
                        
                        # Parse JSON and extract content
                        parsed_content = json.loads(content)
                        logger.debug(f"Parsed content structure: {list(parsed_content.keys())}")
                        
                        # Get the first generated content
                        first_key = next(iter(parsed_content))
                        first_item = parsed_content[first_key]
                        
                        if not isinstance(first_item, dict):
                            logger.error(f"Invalid item format: {type(first_item)}")
                            raise ValueError(f"Expected dict, got {type(first_item)}")
                        
                        # Extract and validate content and score
                        generated_content = first_item.get('content', '')
                        score = first_item.get('score', None)
                        
                        if not generated_content:
                            raise ValueError("Missing or empty content field")
                        
                        if score is None:
                            logger.warning("Score not found in response, using default")
                            score = 0.5
                        else:
                            try:
                                score = float(score)
                                score = max(0.0, min(1.0, score))
                            except (TypeError, ValueError) as e:
                                logger.warning(f"Invalid score format: {score}, using default. Error: {e}")
                                score = 0.5
                        
                        all_content.append({
                            "content": generated_content,
                            "score": score
                        })
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"JSON parsing error: {str(e)}")
                        logger.error(f"Content that failed to parse: {content}")
                        raise ValueError(f"Invalid JSON response: {str(e)}")
                
                logger.info(f"Successfully generated {len(all_content)} items")
                return {
                    "content": all_content[0]["content"],  # Keep backward compatibility
                    "score": all_content[0]["score"],
                    "all_content": all_content  # Add all generated content
                }
                
            except Exception as e:
                logger.error(f"Content generation error: {str(e)}")
                raise ValueError(f"Content generation failed: {str(e)}")
            
        except Exception as e:
            logger.error(f"Generation process error: {str(e)}")
            return {
                "content": f"Error: {str(e)}",
                "score": 0.0,
                "all_content": []
            }

    async def get_capabilities(self) -> List[Dict]:
        """Get capabilities of the Deepseek model."""
        logger.info("Getting model capabilities")
        return [{
            "name": self.settings.deepseek_model,
            "version": "1.0.0",
            "capabilities": ["prompt analysis", "code generation", "text completion"],
            "max_tokens": 8192,
            "supported_languages": ["en"]
        }]

    async def get_status(self) -> List[Dict]:
        """Get current status of the Deepseek model."""
        logger.info("Getting model status")
        try:
            # Make a simple API request to check if the model is responsive
            response = self.client.chat.completions.create(
                model=self.settings.deepseek_model,
                messages=[{"role": "user", "content": "test"}],
                stream=False,
                temperature=0.7,
                max_tokens=10
            )
            return [{
                "name": self.settings.deepseek_model,
                "status": "healthy",
                "latency": 0.5,  # TODO: Calculate actual latency
                "requests_per_minute": 100,  # TODO: Implement rate tracking
                "error_rate": 0.1  # TODO: Track error rate
            }]
        except Exception as e:
            logger.error(f"Error checking model status: {str(e)}")
            return [{
                "name": self.settings.deepseek_model,
                "status": "error",
                "latency": 0.5,  # Still provide a value for validation
                "requests_per_minute": 0,
                "error_rate": 1.0
            }]

# Create and export a global instance
deepseek_service = DeepseekService()