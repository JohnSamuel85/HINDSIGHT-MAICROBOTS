import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Locate root .env (two levels up from backend/app/core)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    hindsight_api_key: str = ""
    hindsight_bank_id: str = "MAICROBOTS"
    hindsight_endpoint: str = "https://api.hindsight.vectorize.io"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_url: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
