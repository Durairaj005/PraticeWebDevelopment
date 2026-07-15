from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "InsightOS Enterprise"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Database
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    
    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # AI Services
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    PRIMARY_AGENT_PROVIDER: str = "gemini"
    
    # Firebase
    FIREBASE_API_KEY: str = ""
    FIREBASE_CREDENTIALS_PATH: str = ""
    
    # Registration
    ALLOWED_EMAIL_DOMAIN: str = "insightos.edu"
    
    # Cloudinary configuration
    CLOUDINARY_URL: Optional[str] = None
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return self.DATABASE_URL
        
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

settings = Settings()
