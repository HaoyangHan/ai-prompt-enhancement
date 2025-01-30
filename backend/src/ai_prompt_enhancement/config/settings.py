from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
import os
from pathlib import Path

# Get the project root directory
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
ENV_FILE = str(ROOT_DIR / '.env')

# Debug print
print(f"Looking for .env file at: {ENV_FILE}")
print(f"File exists: {Path(ENV_FILE).exists()}")

class Settings(BaseSettings):
    # OpenAI Settings
    openai_api_key: str = Field(..., env='OPENAI_API_KEY')
    openai_base_url: str = Field('https://api.openai-proxy.org/v1', env='OPENAI_BASE_URL')
    openai_model: str = Field('gpt-4o-mini', env='OPENAI_MODEL')

    # Deepseek Settings
    deepseek_api_key: str = Field(..., env='DEEPSEEK_API_KEY')
    deepseek_base_url: str = Field('https://api.deepseek.com/v1', env='DEEPSEEK_BASE_URL')
    deepseek_model: str = Field('deepseek-chat', env='DEEPSEEK_MODEL')

    # Other settings
    log_level: str = Field('INFO', env='LOG_LEVEL')

    class Config:
        env_file = ENV_FILE
        env_file_encoding = 'utf-8'

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings() 