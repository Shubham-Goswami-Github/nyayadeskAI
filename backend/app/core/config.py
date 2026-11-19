
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "NyayaDesk"
    APP_ENV: str = "development"
    DATABASE_URL: str

    # AI Provider Configuration
    AI_PROVIDER: str = "gemini"
    AI_MODEL: str = "gemini-3.8-flash"

    # Gemini Configuration
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""

    # Ollama Configuration (Backup Provider)
    OLLAMA_URL: str = "http://localhost:11434/api/generate"
    OLLAMA_MODEL: str = "qwen3:4b-q4_K_M"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
