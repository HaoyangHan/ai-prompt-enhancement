import re
import pandas as pd
from typing import List, Dict, Optional, Tuple
from .evaluation_prompts import EVALUATION_PROMPTS, EvaluationPrompt
from ..model.deepseek_service import DeepseekService
from fastapi import UploadFile
import io

class EvaluationService:
    def __init__(self, model_service: Optional[DeepseekService] = None):
        self.prompts = {prompt.id: prompt for prompt in EVALUATION_PROMPTS}
        self.model_service = model_service or DeepseekService()

    def get_all_prompts(self) -> List[Dict]:
        """Return all available evaluation prompts."""
        return [prompt.to_dict() for prompt in EVALUATION_PROMPTS]

    def get_prompt_by_id(self, prompt_id: str) -> Optional[Dict]:
        """Get a specific prompt by ID."""
        prompt = self.prompts.get(prompt_id)
        return prompt.to_dict() if prompt else None

    def validate_prompt_variables(self, prompt: str, csv_content: Optional[str] = None) -> Tuple[bool, str, List[str]]:
        """
        Validate if the prompt variables match the CSV columns.
        Returns: (is_valid, message, variables)
        """
        # Extract variables from the prompt
        variables = re.findall(r'\{([^}]+)\}', prompt)
        
        if not variables:
            return False, "No variables found in prompt. Use {variable_name} format.", []

        if not csv_content:
            return True, "Variables found in prompt. Upload CSV to validate column matching.", variables

        try:
            # Read the first few lines of CSV to get columns
            df = pd.read_csv(pd.StringIO(csv_content), nrows=1)
            columns = set(df.columns)

            # Check if all variables exist in CSV columns
            missing_vars = [var for var in variables if var not in columns]
            
            if missing_vars:
                return False, f"Missing columns in CSV: {', '.join(missing_vars)}", variables
            
            return True, "All variables match CSV columns.", variables

        except Exception as e:
            return False, f"Error reading CSV file: {str(e)}", variables

    def validate_custom_prompt(self, prompt: str, csv_content: Optional[str] = None) -> Dict:
        """Validate a custom prompt."""
        if not prompt:
            return {
                "isValid": False,
                "message": "Prompt cannot be empty.",
                "variables": []
            }

        is_valid, message, variables = self.validate_prompt_variables(prompt, csv_content)
        
        return {
            "isValid": is_valid,
            "message": message,
            "variables": variables
        }

    def prepare_evaluation_data(self, prompt_id: str, csv_content: str) -> List[Dict]:
        """
        Prepare the evaluation data by combining prompt with CSV data.
        Returns a list of prompts with variables replaced with actual values.
        """
        prompt = self.prompts.get(prompt_id)
        if not prompt:
            raise ValueError(f"Prompt with ID {prompt_id} not found")

        df = pd.read_csv(pd.StringIO(csv_content))
        evaluation_data = []

        for _, row in df.iterrows():
            prompt_text = prompt.prompt
            for var in prompt.variables:
                if var in row:
                    prompt_text = prompt_text.replace(f"{{{var}}}", str(row[var]))
            
            evaluation_data.append({
                "prompt": prompt_text,
                "original_data": row.to_dict()
            })

        return evaluation_data

    async def evaluate_prompt(self, prompt: str, criteria: List[Dict], context: Optional[Dict] = None) -> Dict:
        """
        Evaluate a single prompt against specified criteria.
        
        Args:
            prompt: The prompt to evaluate
            criteria: List of evaluation criteria with weights and thresholds
            context: Optional context for evaluation
            
        Returns:
            Dict containing evaluation results
        """
        # Validate criteria weights
        total_weight = sum(c["weight"] for c in criteria)
        if not 0.99 <= total_weight <= 1.01:  # Allow small floating point differences
            raise ValueError("Criteria weights must sum to 1.0")
            
        # Validate thresholds
        for criterion in criteria:
            if "threshold" in criterion and not 0 <= criterion["threshold"] <= 1:
                raise ValueError("Thresholds must be between 0 and 1")
        
        try:
            # Get model evaluation
            result = await self.model_service.analyze_prompt(prompt, str(context) if context else None)
            
            # Calculate scores
            criteria_scores = {}
            passed_thresholds = True
            
            for criterion in criteria:
                name = criterion["name"]
                if name in result["metrics"]:
                    score = result["metrics"][name]
                    criteria_scores[name] = score
                    
                    # Check threshold if specified
                    if "threshold" in criterion and score < criterion["threshold"]:
                        passed_thresholds = False
            
            # Calculate overall score
            overall_score = sum(
                criteria_scores.get(c["name"], 0) * c["weight"]
                for c in criteria
            )
            
            return {
                "overall_score": overall_score,
                "criteria_scores": criteria_scores,
                "feedback": result.get("suggestions", []),
                "passed_thresholds": passed_thresholds
            }
            
        except Exception as e:
            raise ValueError(f"Failed to evaluate prompt: {str(e)}")

    async def evaluate_prompts_batch(self, file: UploadFile, criteria: List[Dict]) -> Dict:
        """
        Evaluate multiple prompts from a CSV file.
        
        Args:
            file: CSV file containing prompts
            criteria: List of evaluation criteria
            
        Returns:
            Dict containing batch evaluation results
        """
        try:
            # Read CSV file
            content = await file.read()
            df = pd.read_csv(io.BytesIO(content))
            
            if "prompt" not in df.columns:
                raise ValueError("CSV must contain a 'prompt' column")
                
            if df.empty:
                raise ValueError("CSV file is empty")
            
            # Evaluate each prompt
            results = {}
            total_prompts = len(df)
            passed_prompts = 0
            total_score = 0
            
            for idx, row in df.iterrows():
                prompt = row["prompt"]
                result = await self.evaluate_prompt(prompt, criteria)
                
                results[f"prompt_{idx+1}"] = result
                total_score += result["overall_score"]
                if result["passed_thresholds"]:
                    passed_prompts += 1
            
            return {
                "total_prompts": total_prompts,
                "passed_prompts": passed_prompts,
                "average_score": total_score / total_prompts if total_prompts > 0 else 0,
                "results": results
            }
            
        except Exception as e:
            raise ValueError(f"Failed to process batch evaluation: {str(e)}") 