from typing import Dict, Any, Optional
from pydantic import BaseSettings
import yaml
import os
from pathlib import Path

class AppConfig(BaseSettings):
    """Base configuration using environment variables."""
    # API Settings
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = True
    
    # Model Settings
    DEFAULT_MODEL: str = "deepseek-chat"
    MODEL_TIMEOUT: int = 30
    MAX_TOKENS: int = 4096
    
    # Storage Settings
    DATA_DIR: str = "data"
    LOG_PATH: str = "logs"
    
    # CORS Settings
    ALLOWED_ORIGINS: list = ["*"]
    ALLOWED_METHODS: list = ["*"]
    ALLOWED_HEADERS: list = ["*"]

class ConfigService:
    def __init__(self, config_path: Optional[str] = None):
        """Initialize configuration service."""
        self.config = AppConfig()
        self.config_path = config_path
        
        # Load custom config if provided
        if config_path and os.path.exists(config_path):
            self._load_custom_config(config_path)

    def _load_custom_config(self, config_path: str):
        """Load custom configuration from YAML file."""
        with open(config_path, 'r') as f:
            custom_config = yaml.safe_load(f)
            
            # Update config with custom values
            for key, value in custom_config.items():
                if hasattr(self.config, key):
                    setattr(self.config, key, value)

    def get_config(self) -> AppConfig:
        """Get the current configuration."""
        return self.config

    def update_config(self, updates: Dict[str, Any]):
        """Update configuration with new values."""
        for key, value in updates.items():
            if hasattr(self.config, key):
                setattr(self.config, key, value)

    def save_config(self, path: Optional[str] = None):
        """Save current configuration to a YAML file."""
        save_path = path or self.config_path
        if not save_path:
            raise ValueError("No config path specified")
        
        # Create directory if it doesn't exist
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Save config to YAML
        with open(save_path, 'w') as f:
            yaml.dump(self.config.dict(), f, default_flow_style=False) 