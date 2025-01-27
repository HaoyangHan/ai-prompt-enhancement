from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    """Application settings"""
    app_name: str = "AI Prompt Enhancement API"
    debug: bool = False
    
    # API Configuration
    api_prefix: str = "/api/v1"
    
    # CORS Configuration
    allowed_origins: List[str] = ["http://localhost:5173"]
    
    # Deepseek Configuration
    deepseek_api_key: str
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings() 