import os
import json
import pandas as pd
from typing import Dict, List, Any
from datetime import datetime
from loguru import logger

class StorageService:
    def __init__(self):
        # Use the root project directory for data storage
        self.data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../data"))
        logger.info(f"Data directory set to: {self.data_dir}")
        
        # Ensure directories exist
        self.analysis_history_dir = os.path.join(self.data_dir, "analysis_history")
        self.comparison_history_dir = os.path.join(self.data_dir, "comparison_history")
        os.makedirs(self.analysis_history_dir, exist_ok=True)
        os.makedirs(self.comparison_history_dir, exist_ok=True)

    def save_analysis_history(self, analysis_result: Dict) -> None:
        """Save analysis result to history."""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = os.path.join(self.analysis_history_dir, f"analysis_{timestamp}.json")
            logger.info(f"Saving analysis history to: {filepath}")
            
            with open(filepath, 'w') as f:
                json.dump(analysis_result, f, indent=2)
            logger.debug(f"Successfully saved analysis history: {analysis_result}")
        except Exception as e:
            logger.error(f"Failed to save analysis history: {e}")
            logger.error(f"Failed data: {analysis_result}")
            raise

    def save_comparison_history(self, comparison_result: Dict) -> None:
        """Save comparison result to history."""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filepath = os.path.join(self.comparison_history_dir, f"comparison_{timestamp}.json")
            with open(filepath, 'w') as f:
                json.dump(comparison_result, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save comparison history: {e}")
            raise

    def save_evaluation_result(self, evaluation_data: Dict[str, Any]) -> str:
        """Save evaluation result."""
        timestamp = datetime.now().isoformat()
        filename = f"evaluation_{timestamp}.json"
        path = os.path.join(self.data_dir, "evaluation_results", filename)
        
        data = {
            "timestamp": timestamp,
            **evaluation_data
        }
        
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved evaluation result to {path}")
        return filename

    def save_dataset(self, dataset_name: str, df: pd.DataFrame) -> str:
        """Save uploaded dataset."""
        path = os.path.join(self.data_dir, "datasets", f"{dataset_name}.csv")
        df.to_csv(path, index=False)
        logger.info(f"Saved dataset to {path}")
        return path

    def get_analysis_history(self) -> List[Dict]:
        """Retrieve analysis history."""
        history = []
        try:
            for filename in os.listdir(self.analysis_history_dir):
                if filename.endswith('.json'):
                    with open(os.path.join(self.analysis_history_dir, filename)) as f:
                        history.append(json.load(f))
        except Exception as e:
            logger.error(f"Error reading analysis history: {e}")
        return history

    def get_comparison_history(self) -> List[Dict]:
        """Retrieve comparison history."""
        history = []
        try:
            for filename in os.listdir(self.comparison_history_dir):
                if filename.endswith('.json'):
                    with open(os.path.join(self.comparison_history_dir, filename)) as f:
                        history.append(json.load(f))
        except Exception as e:
            logger.error(f"Error reading comparison history: {e}")
        return history

    def get_evaluation_results(self) -> List[Dict[str, Any]]:
        """Get all evaluation results."""
        directory = os.path.join(self.data_dir, "evaluation_results")
        results = []
        
        for filename in os.listdir(directory):
            if filename.endswith('.json'):
                with open(os.path.join(directory, filename), 'r') as f:
                    results.append(json.load(f))
        
        return sorted(results, key=lambda x: x['timestamp'], reverse=True)

    def get_dataset(self, dataset_name: str) -> pd.DataFrame:
        """Get a saved dataset."""
        path = os.path.join(self.data_dir, "datasets", f"{dataset_name}.csv")
        return pd.read_csv(path) 