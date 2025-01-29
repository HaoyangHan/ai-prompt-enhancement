from typing import Dict, List, Optional
from loguru import logger
from ...schemas.prompt import AnalysisMetric

def analyze_prompt_metrics(prompt: str, model_output: Dict) -> Dict[str, AnalysisMetric]:
    """
    Analyze prompt metrics from model output.
    
    Args:
        prompt: The original prompt text
        model_output: Raw model output containing metrics
        
    Returns:
        Dict[str, AnalysisMetric]: Analyzed metrics
    """
    logger.info("Analyzing prompt metrics")
    logger.debug(f"Model output: {model_output}")
    
    metrics = {}
    
    try:
        # Extract and validate metrics from model output
        raw_metrics = model_output.get("metrics", {})
        
        for metric_name, metric_data in raw_metrics.items():
            if isinstance(metric_data, dict):
                metrics[metric_name] = AnalysisMetric(
                    score=float(metric_data.get("score", 0.0)),
                    description=str(metric_data.get("description", "")),
                    suggestions=list(metric_data.get("suggestions", []))
                )
        
        if not metrics:
            logger.warning("No valid metrics found in model output")
            metrics["overall"] = AnalysisMetric(
                score=0.0,
                description="Failed to extract metrics from model output",
                suggestions=["Try regenerating the analysis"]
            )
            
    except Exception as e:
        logger.error(f"Error analyzing metrics: {str(e)}")
        metrics["error"] = AnalysisMetric(
            score=0.0,
            description=f"Error analyzing metrics: {str(e)}",
            suggestions=["Try regenerating the analysis"]
        )
    
    return metrics 