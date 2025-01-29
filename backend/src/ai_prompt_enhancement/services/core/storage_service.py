import os
import json
import pandas as pd
from typing import Dict, List, Any
from datetime import datetime
from loguru import logger

class StorageService:
    def __init__(self):
        self.data_dir = "data"
        self.ensure_data_directories()

    def ensure_data_directories(self):
        """Ensure all required data directories exist."""
        directories = [
            "analysis_history",
            "comparison_history",
            "evaluation_results",
            "datasets"
        ]
        for directory in directories:
            path = os.path.join(self.data_dir, directory)
            os.makedirs(path, exist_ok=True)

    def save_analysis_history(self, analysis_data: Dict[str, Any]) -> str:
        """Save prompt analysis result to history."""
        timestamp = datetime.now().isoformat()
        filename = f"analysis_{timestamp}.json"
        path = os.path.join(self.data_dir, "analysis_history", filename)
        
        data = {
            "timestamp": timestamp,
            **analysis_data
        }
        
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved analysis history to {path}")
        return filename

    def save_comparison_history(self, comparison_data: Dict[str, Any]) -> str:
        """Save prompt comparison result to history."""
        timestamp = datetime.now().isoformat()
        filename = f"comparison_{timestamp}.json"
        path = os.path.join(self.data_dir, "comparison_history", filename)
        
        data = {
            "timestamp": timestamp,
            **comparison_data
        }
        
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved comparison history to {path}")
        return filename

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

    def get_analysis_history(self) -> List[Dict[str, Any]]:
        """Get all analysis history."""
        directory = os.path.join(self.data_dir, "analysis_history")
        history = []
        
        for filename in os.listdir(directory):
            if filename.endswith('.json'):
                with open(os.path.join(directory, filename), 'r') as f:
                    history.append(json.load(f))
        
        return sorted(history, key=lambda x: x['timestamp'], reverse=True)

    def get_comparison_history(self) -> List[Dict[str, Any]]:
        """Get all comparison history."""
        directory = os.path.join(self.data_dir, "comparison_history")
        history = []
        
        for filename in os.listdir(directory):
            if filename.endswith('.json'):
                with open(os.path.join(directory, filename), 'r') as f:
                    history.append(json.load(f))
        
        return sorted(history, key=lambda x: x['timestamp'], reverse=True)

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