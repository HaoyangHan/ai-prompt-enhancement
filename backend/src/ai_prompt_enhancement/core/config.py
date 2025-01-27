from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    # API Keys
    openai_api_key: str
    anthropic_api_key: str | None = None
    
    # Server settings
    debug: bool = False
    cors_origins: List[str] = ["http://localhost:3000"]
    
    # Model configurations
    default_model: str = "gpt-3.5-turbo"
    max_tokens: int = 1000
    temperature: float = 0.7
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings() 