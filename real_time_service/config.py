from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "dummy-secret-key"
    ALGORITHM: str = "HS256"
    PORT: int = 8001
    WS_ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    class Config:
        env_file = ".env"

settings = Settings()
