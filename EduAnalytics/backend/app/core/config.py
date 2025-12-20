"""
Configuration settings for EduAnalytics
"""
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    """Application settings"""
    
    # Database - Use SQLite for development, PostgreSQL for production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./eduanalytics.db")
    
    # App
    APP_NAME: str = "EduAnalytics API"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Firebase
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_PRIVATE_KEY: str = os.getenv("FIREBASE_PRIVATE_KEY", "")
    FIREBASE_CLIENT_EMAIL: str = os.getenv("FIREBASE_CLIENT_EMAIL", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
