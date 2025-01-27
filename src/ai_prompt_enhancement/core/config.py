from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    """Application settings."""
    APP_NAME: str = "AI Prompt Enhancement"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    
    # CORS Settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # API Keys
    OPENAI_API_KEY: Optional[str] = None
    
    # Database Settings
    DATABASE_URL: str = "sqlite:///./test.db"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings() 

