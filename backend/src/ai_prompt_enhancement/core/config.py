from typing import List, Optional
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
    
    # Stellar Configuration
    stellar_endpoint: str = Field("https://api.stellar.ai", env="STELLAR_ENDPOINT")
    stellar_model: str = Field("stellar-chat", env="STELLAR_MODEL")
    
    # R2D2 Configuration
    r2d2_azure_endpoint: str = Field("https://r2d2-openai.openai.azure.com", env="R2D2_AZURE_ENDPOINT")
    azure_gpt4_deployment: str = Field("gpt-4", env="AZURE_GPT4_DEPLOYMENT")
    
    # LLM Configuration
    llm_temperature: float = Field(0.2, env="LLM_TEMPERATURE")
    
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