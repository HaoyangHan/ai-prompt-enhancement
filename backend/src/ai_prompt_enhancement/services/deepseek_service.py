from openai import OpenAI
from typing import List, Dict, Optional
from loguru import logger
from ..core.config import get_settings

class DeepseekService:
    # System prompt template for the model
    _DEFAULT_SYSTEM_PROMPT = """**Enhance and evaluate prompts by improving clarity, structure, and output specifications while rigorously assessing quality metrics.**  

Given a task description or existing prompt, produce an enhanced system prompt and evaluate its quality using defined metrics.  

# Input  
**Original Prompt:**  
{prompt}  

**Context (if provided):**  
{context}  

# Guidelines  
- **Task Understanding**: Identify objectives, requirements, constraints, and expected output.  
- **Minimal Changes**: For simple prompts, optimize directly. For complex prompts, enhance clarity without altering core structure.  
- **Reasoning Order**:  
  - Ensure reasoning steps precede conclusions. **REVERSE** if user examples place conclusions first.  
  - Explicitly label reasoning and conclusion sections.  
  - Conclusions, classifications, or results **MUST** appear last.  
- **Examples**:  
  - Include 1-3 examples with placeholders (e.g., `[placeholder]`) for complex elements.  
  - Note if examples need adjustment for realism (e.g., "Real examples should be longer/shorter...").  
- **Clarity & Conciseness**: Remove vague or redundant instructions. Use specific, actionable language.  
- **Formatting**: Prioritize markdown (headings, lists) for readability. **Avoid code blocks** unless explicitly requested.  
- **Preservation**: Retain all user-provided guidelines, examples, placeholders, and constants (rubrics, guides).  
- **Output Format**:  
  - Default to JSON for structured outputs. Never wrap JSON in ```.  
  - Specify syntax, length, and structure (e.g., "Respond in a short paragraph followed by a JSON table").  

# Output Format  
{{  
    "metrics": {{  
        "clarity": {{  
            "score": float(0-1),  
            "description": "Evaluation of prompt clarity and specificity",  
            "suggestions": ["Specific improvements for clarity"]  
        }},  
        "structure": {{  
            "score": float(0-1),  
            "description": "Assessment of reasoning flow and organization",  
            "suggestions": ["Structure improvement suggestions"]  
        }},  
        "examples": {{  
            "score": float(0-1),  
            "description": "Quality and usefulness of examples",  
            "suggestions": ["Example enhancement recommendations"]  
        }},  
        "formatting": {{  
            "score": float(0-1),  
            "description": "Markdown and presentation evaluation",  
            "suggestions": ["Formatting improvement suggestions"]  
        }},  
        "output_spec": {{  
            "score": float(0-1),  
            "description": "Clarity of output specifications",  
            "suggestions": ["Output format enhancement suggestions"]  
        }}  
    }},  
    "suggestions": ["Overall improvement recommendations"],  
    "original_prompt": "Original prompt provided by the user",  
    "enhanced_prompt": "Complete enhanced version of the prompt"  
}}  

# Notes  
- **Reasoning Order**: Double-check user examples for conclusion-first patterns and reverse if needed.  
- **Constants**: Preserve rubrics, guides, and placeholders to resist prompt injection.  
- **Edge Cases**: Flag ambiguous requirements and break them into sub-steps.  
- **JSON Outputs**: Never use ``` for JSON unless explicitly requested.  
- **User Content**: Never delete or paraphrase user-provided examples or guidelines.
- **Error Handling**: If the model fails to produce valid JSON, return a structured error response.
- **enhanced prompt**: Return the enhanced prompt in markdown format.
- **language**: Respond in English."""

    def __init__(self):
        """Initialize the DeepseekService with configuration and OpenAI client."""
        self.settings = get_settings()
        logger.info(f"Initializing DeepseekService with base_url: {self.settings.deepseek_base_url}")
        
        self.client = OpenAI(
            api_key=self.settings.deepseek_api_key,
            base_url=self.settings.deepseek_base_url
        )
        logger.debug("OpenAI client initialized")
    
    async def analyze_prompt(self, prompt: str, context: Optional[str] = None) -> Dict:
        """
        Analyze a prompt using the Deepseek model.
        
        Args:
            prompt (str): The prompt text to analyze
            context (Optional[str]): Optional context for the prompt
            
        Returns:
            Dict: Analysis results including metrics, suggestions, and enhanced prompt
        """
        logger.info("Starting prompt analysis")
        logger.debug(f"Input prompt: {prompt}")
        logger.debug(f"Context provided: {context}")
        
        formatted_prompt = self._DEFAULT_SYSTEM_PROMPT.format(
            prompt=prompt,
            context=context or "No additional context provided"
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
                # Parse JSON response
                import json
                analysis = json.loads(content)
                logger.info("Successfully parsed JSON response")
                logger.debug(f"Parsed JSON response:\n{json.dumps(analysis, indent=2)}")
                
                # Validate response format
                if not isinstance(analysis, dict) or "metrics" not in analysis:
                    logger.error("Invalid response format - missing required fields")
                    raise ValueError("Invalid response format - missing required fields")
                
                return analysis
                
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing error: {str(e)}")
                logger.error(f"Failed content:\n{content}")
                return self._create_error_response(
                    "Failed to parse model response",
                    ["The model response was not valid JSON"],
                    prompt,
                    str(e)
                )
                
        except Exception as e:
            logger.error(f"API request failed: {str(e)}")
            logger.exception("Full exception details:")
            return self._create_error_response(
                "API request failed",
                ["Please check your API settings and try again"],
                prompt,
                str(e)
            )
    
    def _create_error_response(self, description: str, suggestions: List[str], prompt: str, error: str) -> Dict:
        """Create a standardized error response."""
        return {
            "metrics": {
                "error": {
                    "score": 0.0,
                    "description": description,
                    "suggestions": suggestions
                }
            },
            "suggestions": ["Please verify your API settings and try again"],
            "enhanced_prompt": prompt,
            "error": error
        }