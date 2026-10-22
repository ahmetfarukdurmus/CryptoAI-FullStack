import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import SessionLocal
from app.db.init_db import init_db
from app.api.v1.api import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("cryptoai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama başlangıcında tabloları oluşturur ve tohum verilerini yükler."""
    logger.info("Uygulama başlatılıyor, veritabanı kontrol ediliyor...")
    db = SessionLocal()
    try:
        init_db(db)
        logger.info("Veritabanı başlatıldı ve tohum verileri hazırlandı.")
    except Exception as e:
        logger.error(f"Veritabanı başlatılırken hata oluştu: {e}")
    finally:
        db.close()
    yield
    logger.info("Uygulama kapatılıyor...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="CryptoAI React Native Uygulaması için Python (FastAPI + PostgreSQL) REST API Mimarisi",
    openapi_url="/api/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware (React Native / Web Client erişimi için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
def health_check():
    """Konteyner ve sunucu sağlık kontrolü rotası."""
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


# Ana API yönlendiricisini /api/v1 ve /api önekleriyle bağla
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api")

# Kolaylık için doğrudan kök dizine de bağla
app.include_router(api_router)
