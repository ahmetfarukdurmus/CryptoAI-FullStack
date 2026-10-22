from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CryptoAI Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "production"
    PORT: int = 8000

    # PostgreSQL / SQLite Veritabanı Bağlantısı (psycopg v3 sürücüsü ile)
    DATABASE_URL: str = "postgresql+psycopg://cryptoai_user:cryptoai_password@postgres:5432/cryptoai_db"

    # JWT ve Güvenlik Ayarları
    # 30 günlük oturum süresi (Frontend AuthContext: SESSION_DURATION_DAYS = 30 ile birebir uyumlu)
    SECRET_KEY: str = "cryptoai_super_secret_jwt_key_2026_secure_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 gün = 43200 dakika

    # CORS İzinleri (React Native / Web Client erişimi için)
    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8080",
        "*",
    ]

    # SMTP / Gmail E-posta Doğrulama Ayarları
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "CryptoAI Güvenlik"

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow",
    )


settings = Settings()
