"""
Application configuration and settings
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache
from dotenv import load_dotenv

# Load .env file from backend directory
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # App
    app_name: str = "Misk0nception API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database
    database_url: str = "sqlite:///./misconception.db"
    
    # File Storage
    upload_dir: Path = Path("./uploads")
    attachments_dir: Path = Path("./attachments")
    max_upload_size: int = 50 * 1024 * 1024  # 50MB
    
    # AI Integration
    groq_api_key: str | None = None
    ai_model: str = "llama-3.3-70b-versatile"
    
    # CORS
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    
    # Security
    secret_key: str | None = None
    
    class Config:
        env_file = Path(__file__).parent.parent / ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    settings = Settings()
    
    # Create necessary directories
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.attachments_dir.mkdir(parents=True, exist_ok=True)
    
    # Load secrets from environment
    if not settings.groq_api_key:
        settings.groq_api_key = os.environ.get('GROQ_API_KEY')
    if not settings.secret_key:
        settings.secret_key = os.environ.get('SECRET_KEY', os.urandom(32).hex())
    
    return settings
