from typing import Dict, Optional, List
from loguru import logger
from .analyzers import analyze_prompt_metrics
from .prompt_templates import ANALYSIS_TEMPLATE, COMPARISON_TEMPLATE
from ...services.model.deepseek_service import DeepseekService
from ...core.config import get_settings

class RefinementService:
    def __init__(self):
        """Initialize the refinement service."""
        self.settings = get_settings()
        self.model_service = DeepseekService()
    
    async def analyze_prompt(self, prompt: str, context: Optional[Dict] = None, metrics: Optional[List[str]] = None) -> Dict:
        """
        Analyze and enhance a prompt.
        
        Args:
            prompt: The prompt to analyze
            context: Optional context for the prompt
            metrics: Optional list of specific metrics to analyze
            
        Returns:
            Dict: Analysis results including metrics and suggestions
        """
        logger.info(f"Analyzing prompt")
        logger.debug(f"Prompt: {prompt}")
        logger.debug(f"Context: {context}")
        logger.debug(f"Metrics: {metrics}")
        
        try:
            # Get raw analysis from model
            raw_analysis = await self.model_service.analyze_prompt(prompt, context)
            
            # Process metrics
            all_metrics = analyze_prompt_metrics(prompt, raw_analysis)
            
            # Filter metrics if specific ones are requested
            if metrics:
                filtered_metrics = {k: v for k, v in all_metrics.items() if k in metrics}
            else:
                filtered_metrics = all_metrics
            
            # Prepare response
            response = {
                "metrics": filtered_metrics,
                "suggestions": raw_analysis.get("suggestions", []),
                "enhanced_prompt": raw_analysis.get("enhanced_prompt", prompt),
                "original_prompt": prompt
            }
            
            logger.debug(f"Analysis response: {response}")
            return response
            
        except Exception as e:
            logger.error(f"Error analyzing prompt: {str(e)}")
            raise
    
    async def compare_prompts(self, original_prompt: str, enhanced_prompt: str, context: Optional[Dict] = None) -> Dict:
        """
        Compare original and enhanced prompts.
        
        Args:
            original_prompt: The original prompt text
            enhanced_prompt: The enhanced prompt text
            context: Optional context for comparison
            
        Returns:
            Dict: Comparison results
        """
        logger.info("Comparing prompts")
        logger.debug(f"Original prompt: {original_prompt}")
        logger.debug(f"Enhanced prompt: {enhanced_prompt}")
        logger.debug(f"Context: {context}")
        
        try:
            # Get comparison from model
            comparison = await self.model_service.compare_prompts(
                original_prompt=original_prompt,
                enhanced_prompt=enhanced_prompt,
                context=context
            )
            
            # Process metrics for both versions
            original_metrics = analyze_prompt_metrics(
                original_prompt,
                comparison.get("original_prompt", {})
            )
            enhanced_metrics = analyze_prompt_metrics(
                enhanced_prompt,
                comparison.get("enhanced_prompt", {})
            )
            
            # Calculate improvements
            improvements = []
            for metric in original_metrics:
                if metric in enhanced_metrics:
                    diff = enhanced_metrics[metric] - original_metrics[metric]
                    if diff > 0:
                        improvements.append(f"Improved {metric} by {diff:.2f}")
            
            # Prepare response
            response = {
                "comparison_metrics": {
                    "original": original_metrics,
                    "enhanced": enhanced_metrics
                },
                "improvements": improvements or ["No significant improvements found"],
                "recommendation": "Use the enhanced version" if improvements else "Both versions are similar"
            }
            
            logger.debug(f"Comparison response: {response}")
            return response
            
        except Exception as e:
            logger.error(f"Error comparing prompts: {str(e)}")
            raise 