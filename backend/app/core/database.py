import socket
import logging
from typing import Generator
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL

# Sürücü normalizasyonu: psycopg 3 sürücüsünü (postgresql+psycopg://) destekle
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

# Eğer @postgres: verildiyse ve makine postgres hostunu çözemiyorsa (yerel çalışma) localhost'a çevir
if "@postgres:" in db_url:
    try:
        socket.gethostbyname("postgres")
    except socket.gaierror:
        logger.info("Host 'postgres' çözümlenemedi, 'localhost' adresine yönlendiriliyor.")
        db_url = db_url.replace("@postgres:", "@localhost:", 1)

connect_args = {}
engine_kwargs = {
    "pool_pre_ping": True,
    "echo": False,
}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 15}
else:
    connect_args = {"connect_timeout": 5}
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 30,
        "pool_timeout": 5,
        "pool_recycle": 1800,
    })

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        **engine_kwargs,
    )
    # Bağlantıyı test et
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("✅ Birincil veritabanı bağlantısı başarıyla sağlandı.")
except Exception as e:
    logger.warning(f"⚠️ Birincil veritabanı erişilemedi ({e}). Yerel SQLite veritabanına geçiliyor...")
    db_url = "sqlite:///./cryptoai.db"
    connect_args = {"check_same_thread": False, "timeout": 15}
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True,
        echo=False,
    )

# SQLite için WAL (Write-Ahead Logging) modunu etkinleştir - okuma/yazma kilitlenmesini önler
if "sqlite" in db_url:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.close()
        except Exception:
            pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency: Her istek için veritabanı oturumu oluşturur ve kapatır."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
