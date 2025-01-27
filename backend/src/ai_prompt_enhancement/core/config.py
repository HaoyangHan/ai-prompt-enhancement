from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    """Application settings"""
    app_name: str = "AI Prompt Enhancement"
    debug: bool = True
    
    # API Configuration
    api_prefix: str = "/api/v1"
    
    # CORS Configuration
    cors_origins: List[str] = Field(
        default=["http://localhost:5173", "http://192.168.31.208:5173"],
        env="CORS_ORIGINS"
    )
    
    # Deepseek Configuration
    deepseek_api_key: str = Field(..., env="DEEPSEEK_API_KEY")
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

_settings = None

def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings 