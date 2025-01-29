from typing import List, Dict

class ModelService:
    def __init__(self):
        self.models = {
            "deepseek-chat": {
                "name": "Deepseek Chat",
                "capabilities": ["text-generation", "chat", "prompt-refinement"],
                "max_tokens": 4096
            },
            "deepseek-reasoner": {
                "name": "Deepseek Reasoner",
                "capabilities": ["reasoning", "analysis", "evaluation"],
                "max_tokens": 4096
            }
        }

    def get_available_models(self) -> List[Dict]:
        """Return list of available models with their basic info."""
        return [
            {"id": model_id, "name": info["name"]}
            for model_id, info in self.models.items()
        ]

    def get_model_capabilities(self, model_id: str) -> Dict:
        """Get detailed capabilities of a specific model."""
        if model_id not in self.models:
            raise KeyError(f"Model {model_id} not found")
        return self.models[model_id] 