from sqlalchemy import Column, String, Float, Boolean, Integer, Text
from app.core.database import Base


class CoinMarket(Base):
    __tablename__ = "coin_markets"

    symbol = Column(String(20), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    price_usd = Column(Float, nullable=False)
    change_24h = Column(Float, nullable=False)
    change_usd = Column(Float, default=0.0, nullable=True)
    high_24h = Column(Float, nullable=False)
    low_24h = Column(Float, nullable=False)
    volume_btc = Column(String(50), nullable=False)
    rsi = Column(Float, default=50.0, nullable=False)
    ai_signal = Column(String(50), default="NÖTR", nullable=False)  # GÜÇLÜ AL, AL, NÖTR, SAT
    ai_confidence_percent = Column(Integer, default=50, nullable=False)
    ai_analysis_text = Column(Text, nullable=False)
    is_watchlisted = Column(Boolean, default=False, nullable=False)
    has_alarm = Column(Boolean, default=False, nullable=False)
    icon_letter = Column(String(10), nullable=False)
    color = Column(String(20), nullable=False)
