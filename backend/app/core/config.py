import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "DocsLM.ai — AI Document Knowledge Platform"
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = True
    PORT: int = 8000
    
    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "https://docslmai.vercel.app"]
    
    # JWT Authentication
    SECRET_KEY: str = "super_secret_jwt_key_notebooklm_change_in_production_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    COOKIE_NAME: str = "access_token"
    COOKIE_SECURE: bool = True
    COOKIE_SAME_SITE: str = "none"
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "docs_lm"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Storage
    STORAGE_PROVIDER: str = "local"  # "local", "cloudinary", "s3"
    LOCAL_STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    CLOUDINARY_URL: Optional[str] = None
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_BUCKET_NAME: Optional[str] = None
    AWS_REGION: Optional[str] = "us-east-1"
    
    # Vector DB (Pinecone)
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_INDEX_NAME: str = "docs-lm-index"
    
    # AI LLM & Embeddings
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    EMBEDDING_MODEL: str = "models/text-embedding-004"  # or text-embedding-3-small
    LLM_MODEL: str = "gemini-2.5-flash"  # or gpt-4o-mini
    
    # Ollama Local LLM & Embeddings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen3:4b"
    
    # LangSmith Observability
    LANGCHAIN_TRACING_V2: str = "false"
    LANGCHAIN_API_KEY: Optional[str] = None
    LANGCHAIN_PROJECT: str = "docs-lm"
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
