from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    """Application settings"""
    app_name: str = "AI Prompt Enhancement"
    debug: bool = True
    log_level: str = "INFO"
    
    # API Configuration
    api_prefix: str = "/api/v1"
    
    # CORS Configuration
    cors_origins: List[str] = Field(
        default=["http://localhost:5173", "http://192.168.31.208:5173"],
        env="CORS_ORIGINS"
    )
    
    # Deepseek Configuration
    deepseek_api_key: Optional[str] = Field(default=None, env="DEEPSEEK_API_KEY")
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    deepseek_model: str = "deepseek-chat"
    
    # OpenAI Configuration
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "allow"  # Allow extra fields

# Create a singleton instance
settings = Settings()

# For backward compatibility
def get_settings() -> Settings:
    return settings 