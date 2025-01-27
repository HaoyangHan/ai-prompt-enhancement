import csv
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict
from loguru import logger

class StorageService:
    def __init__(self):
        """Initialize storage paths and create CSV files if they don't exist."""
        self.base_path = Path("data")
        self.base_path.mkdir(exist_ok=True)
        
        self.analysis_file = self.base_path / "analysis_history.csv"
        self.comparison_file = self.base_path / "comparison_history.csv"
        
        # Create files with headers if they don't exist
        if not self.analysis_file.exists():
            self._create_analysis_file()
        if not self.comparison_file.exists():
            self._create_comparison_file()
    
    def _create_analysis_file(self):
        """Create analysis history file with headers."""
        with open(self.analysis_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['timestamp', 'original_prompt', 'enhanced_prompt', 'model_used', 'metrics', 'suggestions'])
    
    def _create_comparison_file(self):
        """Create comparison history file with headers."""
        with open(self.comparison_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['timestamp', 'original_prompt', 'enhanced_prompt', 'model_used', 'metrics', 'suggestions', 'comparison'])
    
    def save_analysis(self, result: Dict) -> None:
        """Save analysis result to CSV file."""
        try:
            timestamp = datetime.now().isoformat()
            row = [
                timestamp,
                result.get('original_prompt', ''),
                result.get('enhanced_prompt', ''),
                result.get('model_used', ''),
                json.dumps(result.get('metrics', {})),
                json.dumps(result.get('suggestions', []))
            ]
            
            with open(self.analysis_file, 'a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(row)
            
            logger.info(f"Analysis result saved at {timestamp}")
        except Exception as e:
            logger.error(f"Error saving analysis result: {str(e)}")
    
    def save_comparison(self, result: Dict) -> None:
        """Save comparison result to CSV file."""
        try:
            timestamp = datetime.now().isoformat()
            row = [
                timestamp,
                json.dumps(result.get('original_prompt', {})),
                json.dumps(result.get('enhanced_prompt', {})),
                result.get('model_used', ''),
                json.dumps(result.get('metrics', {})),
                json.dumps(result.get('suggestions', [])),
                json.dumps(result.get('comparison', ''))
            ]
            
            with open(self.comparison_file, 'a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(row)
            
            logger.info(f"Comparison result saved at {timestamp}")
        except Exception as e:
            logger.error(f"Error saving comparison result: {str(e)}")
    
    def get_analysis_history(self) -> List[Dict]:
        """Retrieve analysis history from CSV file."""
        history = []
        try:
            with open(self.analysis_file, 'r', newline='') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    history.append({
                        'timestamp': row['timestamp'],
                        'original_prompt': row['original_prompt'],
                        'enhanced_prompt': row['enhanced_prompt'],
                        'model_used': row['model_used'],
                        'metrics': json.loads(row['metrics']),
                        'suggestions': json.loads(row['suggestions'])
                    })
            return history
        except Exception as e:
            logger.error(f"Error retrieving analysis history: {str(e)}")
            return []
    
    def get_comparison_history(self) -> List[Dict]:
        """Retrieve comparison history from CSV file."""
        history = []
        try:
            with open(self.comparison_file, 'r', newline='') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    history.append({
                        'timestamp': row['timestamp'],
                        'original_prompt': json.loads(row['original_prompt']),
                        'enhanced_prompt': json.loads(row['enhanced_prompt']),
                        'model_used': row['model_used'],
                        'metrics': json.loads(row['metrics']),
                        'suggestions': json.loads(row['suggestions']),
                        'comparison': json.loads(row['comparison'])
                    })
            return history
        except Exception as e:
            logger.error(f"Error retrieving comparison history: {str(e)}")
            return [] 