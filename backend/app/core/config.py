from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    PRICE_ALERT_THRESHOLD_PCT: float = 30.0
    MAX_IMAGE_SIZE_MB: int = 5
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]


settings = Settings()
