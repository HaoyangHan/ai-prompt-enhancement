import json
import re
from datetime import datetime
from loguru import logger

from ai_prompt_enhancement.core.config import get_settings
from ai_prompt_enhancement.core.llm_factory import LlmFactory
from llama_index.core.prompts import PromptTemplate

logger = logger.bind(service="stellar")

class StellarService:
    def __init__(self):
        """Initialize the StellarService with configuration and OpenAILike client."""
        self.settings = get_settings()
        logger.info(f"Initializing StellarService with endpoint: {self.settings.stellar_endpoint}")
        self.client = None  # Will be initialized asynchronously
        logger.debug("StellarService initialized")
    
    async def initialize_client(self):
        """Initialize the OpenAILike client asynchronously."""
        self.client = await LlmFactory.stellar()
        logger.debug("Stellar OpenAILike client initialized")
    
    async def analyze_prompt(self, prompt: str, model: str = None):
        """
        Analyze a prompt using the Stellar model.
        
        Args:
            prompt: The prompt to analyze
            model: Optional model override
            
        Returns:
            Analysis results including metrics and suggestions
        """
        if not prompt:
            return {"error": "Prompt cannot be empty"}
        
        try:
            # Use the model specified or default to the one in settings
            model_to_use = model or self.settings.stellar_model
            
            # Prepare the system prompt for analysis
            system_prompt = """You are an expert prompt engineer. Analyze the given prompt and provide detailed feedback on its quality.
            Evaluate the prompt based on the following criteria:
            1. Clarity: Is the prompt clear and unambiguous?
            2. Specificity: Does the prompt provide enough specific details?
            3. Context: Does the prompt include necessary context?
            4. Constraints: Does the prompt specify any constraints or limitations?
            5. Examples: Does the prompt include examples if needed?
            6. Tone: Is the tone appropriate for the intended audience?
            7. Structure: Is the prompt well-structured and organized?
            8. Conciseness: Is the prompt concise without sacrificing clarity?
            
            For each criterion, provide:
            - A score between 0.0 and 1.0
            - A brief explanation of the score
            - Specific suggestions for improvement
            
            Also provide an overall assessment and 3-5 actionable suggestions to improve the prompt.
            
            Format your response as a JSON object with the following structure:
            {
                "metrics": {
                    "clarity": {"score": 0.0-1.0, "description": "explanation", "suggestions": ["suggestion1", "suggestion2"]},
                    "specificity": {"score": 0.0-1.0, "description": "explanation", "suggestions": ["suggestion1", "suggestion2"]},
                    "context": {"score": 0.0-1.0, "description": "explanation", "suggestions": ["suggestion1", "suggestion2"]},
                    "constraints": {"score": 0.0-1.0, "description": "explanation", "suggestions": ["suggestion1", "suggestion2"]},
                    "examples": {"score": 0.0-1.0, "description": "explanation", "suggestions": ["suggestion1", "suggestion2"]},
                    "tone": {"score": 0.0-1.0, "description": "explanation", "suggestions": ["suggestion1", "suggestion2"]},
                    "structure": {"score": 0.0-1.0, "description": "explanation", "suggestions": ["suggestion1", "suggestion2"]},
                    "conciseness": {"score": 0.0-1.0, "description": "explanation", "suggestions": ["suggestion1", "suggestion2"]}
                },
                "overall_score": 0.0-1.0,
                "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
            }
            
            Analyze this prompt:
            
            {prompt_text}
            """
            
            # Create a prompt template
            prompt_template = PromptTemplate(system_prompt)
            
            # Make the API call to the Stellar model using apredict
            response = await self.client.apredict(
                prompt_template,
                prompt_text=prompt
            )
            
            # Extract and parse the JSON response
            content = response
            # Find JSON content using regex
            match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
            if match:
                content = match.group(1)
            else:
                # Try to find JSON without markdown formatting
                match = re.search(r'({.*})', content, re.DOTALL)
                if match:
                    content = match.group(1)
            
            analysis_result = json.loads(content)
            
            # Add metadata
            analysis_result["model_used"] = model_to_use
            analysis_result["timestamp"] = datetime.now().isoformat()
            analysis_result["prompt"] = prompt
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error analyzing prompt with Stellar: {str(e)}")
            return {"error": f"Failed to analyze prompt: {str(e)}"}
    
    async def enhance_prompt(self, prompt: str, instruction: str = None, model: str = None):
        """
        Enhance a prompt based on optional instruction using the Stellar model.
        
        Args:
            prompt: The original prompt to enhance
            instruction: Optional specific instruction for enhancement
            model: Optional model override
            
        Returns:
            Enhanced prompt with analysis
        """
        if not prompt:
            return {"error": "Prompt cannot be empty"}
        
        try:
            # Use the model specified or default to the one in settings
            model_to_use = model or self.settings.stellar_model
            
            # Prepare the system prompt for enhancement
            system_prompt = """You are an expert prompt engineer. Your task is to enhance the given prompt to make it more effective.
            
            Analyze the prompt for:
            1. Clarity: Is the prompt clear and unambiguous?
            2. Specificity: Does the prompt provide enough specific details?
            3. Context: Does the prompt include necessary context?
            4. Constraints: Does the prompt specify any constraints or limitations?
            5. Examples: Does the prompt include examples if needed?
            6. Tone: Is the tone appropriate for the intended audience?
            7. Structure: Is the prompt well-structured and organized?
            8. Conciseness: Is the prompt concise without sacrificing clarity?
            
            Then, create an enhanced version of the prompt that addresses any weaknesses.
            
            Format your response as a JSON object with the following structure:
            {
                "original_prompt": {
                    "prompt": "the original prompt",
                    "metrics": {
                        "clarity": {"score": 0.0-1.0, "description": "explanation"},
                        "specificity": {"score": 0.0-1.0, "description": "explanation"},
                        "context": {"score": 0.0-1.0, "description": "explanation"},
                        "constraints": {"score": 0.0-1.0, "description": "explanation"},
                        "examples": {"score": 0.0-1.0, "description": "explanation"},
                        "tone": {"score": 0.0-1.0, "description": "explanation"},
                        "structure": {"score": 0.0-1.0, "description": "explanation"},
                        "conciseness": {"score": 0.0-1.0, "description": "explanation"}
                    },
                    "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
                },
                "enhanced_prompt": {
                    "prompt": "the enhanced prompt",
                    "metrics": {
                        "clarity": {"score": 0.0-1.0, "description": "explanation"},
                        "specificity": {"score": 0.0-1.0, "description": "explanation"},
                        "context": {"score": 0.0-1.0, "description": "explanation"},
                        "constraints": {"score": 0.0-1.0, "description": "explanation"},
                        "examples": {"score": 0.0-1.0, "description": "explanation"},
                        "tone": {"score": 0.0-1.0, "description": "explanation"},
                        "structure": {"score": 0.0-1.0, "description": "explanation"},
                        "conciseness": {"score": 0.0-1.0, "description": "explanation"}
                    },
                    "highlighted_prompt": "the enhanced prompt with <mark>highlighted changes</mark>"
                }
            }
            
            Enhance this prompt:
            
            {prompt_text}
            
            {instruction_text}
            """
            
            # Create a prompt template
            prompt_template = PromptTemplate(system_prompt)
            
            # Prepare instruction text if provided
            instruction_text = f"Specific instruction: {instruction}" if instruction else ""
            
            # Make the API call to the Stellar model using apredict
            response = await self.client.apredict(
                prompt_template,
                prompt_text=prompt,
                instruction_text=instruction_text
            )
            
            # Extract and parse the JSON response
            content = response
            # Find JSON content using regex
            match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
            if match:
                content = match.group(1)
            else:
                # Try to find JSON without markdown formatting
                match = re.search(r'({.*})', content, re.DOTALL)
                if match:
                    content = match.group(1)
            
            enhancement_result = json.loads(content)
            
            # Add metadata
            enhancement_result["model_used"] = model_to_use
            enhancement_result["timestamp"] = datetime.now().isoformat()
            
            return enhancement_result
            
        except Exception as e:
            logger.error(f"Error enhancing prompt with Stellar: {str(e)}")
            return {"error": f"Failed to enhance prompt: {str(e)}"}
    
    async def compare_prompts(self, original_prompt: str, enhanced_prompt: str, model: str = None):
        """
        Compare two prompts and provide detailed analysis using the Stellar model.
        
        Args:
            original_prompt: The original prompt
            enhanced_prompt: The enhanced prompt to compare against
            model: Optional model override
            
        Returns:
            Comparison results with metrics for both prompts
        """
        if not original_prompt or not enhanced_prompt:
            return {"error": "Both prompts are required for comparison"}
        
        try:
            # Use the model specified or default to the one in settings
            model_to_use = model or self.settings.stellar_model
            
            # Prepare the system prompt for comparison
            system_prompt = """You are an expert prompt engineer. Your task is to compare an original prompt with an enhanced version.
            
            Analyze both prompts for:
            1. Clarity: Is the prompt clear and unambiguous?
            2. Specificity: Does the prompt provide enough specific details?
            3. Context: Does the prompt include necessary context?
            4. Constraints: Does the prompt specify any constraints or limitations?
            5. Examples: Does the prompt include examples if needed?
            6. Tone: Is the tone appropriate for the intended audience?
            7. Structure: Is the prompt well-structured and organized?
            8. Conciseness: Is the prompt concise without sacrificing clarity?
            
            Format your response as a JSON object with the following structure:
            {
                "original_prompt": {
                    "prompt": "the original prompt",
                    "metrics": {
                        "clarity": {"score": 0.0-1.0, "description": "explanation"},
                        "specificity": {"score": 0.0-1.0, "description": "explanation"},
                        "context": {"score": 0.0-1.0, "description": "explanation"},
                        "constraints": {"score": 0.0-1.0, "description": "explanation"},
                        "examples": {"score": 0.0-1.0, "description": "explanation"},
                        "tone": {"score": 0.0-1.0, "description": "explanation"},
                        "structure": {"score": 0.0-1.0, "description": "explanation"},
                        "conciseness": {"score": 0.0-1.0, "description": "explanation"}
                    },
                    "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
                },
                "enhanced_prompt": {
                    "prompt": "the enhanced prompt",
                    "metrics": {
                        "clarity": {"score": 0.0-1.0, "description": "explanation"},
                        "specificity": {"score": 0.0-1.0, "description": "explanation"},
                        "context": {"score": 0.0-1.0, "description": "explanation"},
                        "constraints": {"score": 0.0-1.0, "description": "explanation"},
                        "examples": {"score": 0.0-1.0, "description": "explanation"},
                        "tone": {"score": 0.0-1.0, "description": "explanation"},
                        "structure": {"score": 0.0-1.0, "description": "explanation"},
                        "conciseness": {"score": 0.0-1.0, "description": "explanation"}
                    },
                    "highlighted_prompt": "the enhanced prompt with <mark>highlighted changes</mark>"
                }
            }
            
            Also identify the specific improvements made in the enhanced prompt and highlight them in the highlighted_prompt field.
            
            Compare these prompts:
            
            Original Prompt:
            {original_prompt}
            
            Enhanced Prompt:
            {enhanced_prompt}
            """
            
            # Create a prompt template
            prompt_template = PromptTemplate(system_prompt)
            
            # Make the API call to the Stellar model using apredict
            response = await self.client.apredict(
                prompt_template,
                original_prompt=original_prompt,
                enhanced_prompt=enhanced_prompt
            )
            
            # Extract and parse the JSON response
            content = response
            # Find JSON content using regex
            match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
            if match:
                content = match.group(1)
            else:
                # Try to find JSON without markdown formatting
                match = re.search(r'({.*})', content, re.DOTALL)
                if match:
                    content = match.group(1)
            
            comparison_result = json.loads(content)
            
            # Add metadata
            comparison_result["model_used"] = model_to_use
            comparison_result["timestamp"] = datetime.now().isoformat()
            
            return comparison_result
            
        except Exception as e:
            logger.error(f"Error comparing prompts with Stellar: {str(e)}")
            return {"error": f"Failed to compare prompts: {str(e)}"}
            
    async def joke_about_topic(self, topic: str, model: str = None):
        """
        Generate a joke about a specific topic using the Stellar model.
        
        Args:
            topic: The topic to joke about
            model: Optional model override
            
        Returns:
            A joke about the specified topic
        """
        if not topic:
            return {"error": "Topic cannot be empty"}
        
        try:
            # Use the model specified or default to the one in settings
            model_to_use = model or self.settings.stellar_model
            
            # Create a prompt template
            prompt_template = PromptTemplate("tell me a joke about {topic}")
            
            # Make the API call to the Stellar model using apredict
            response = await self.client.apredict(
                prompt_template,
                topic=topic
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating joke with Stellar: {str(e)}")
            return {"error": f"Failed to generate joke: {str(e)}"} 