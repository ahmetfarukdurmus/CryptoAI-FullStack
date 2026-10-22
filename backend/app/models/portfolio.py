from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    total_balance_usd = Column(Float, default=10000.0, nullable=False)
    daily_change_usd = Column(Float, default=0.0, nullable=False)
    is_autopilot_active = Column(Boolean, default=False, nullable=False)
    llm_analysis_text = Column(
        Text,
        default="CryptoAI'a hoş geldiniz! Sanal bakiyenizle alım-satım yapmaya başlayabilir veya Otopilot modunu devreye alabilirsiniz.",
        nullable=False,
    )

    user = relationship("User", back_populates="portfolio")
    holdings = relationship("Holding", back_populates="portfolio", cascade="all, delete-orphan")


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    amount = Column(Float, default=0.0, nullable=False)
    value_usd = Column(Float, default=0.0, nullable=False)
    change_usd = Column(Float, default=0.0, nullable=False)
    change_percent = Column(Float, default=0.0, nullable=True)
    icon_letter = Column(String(10), default="₮", nullable=False)
    color = Column(String(20), default="#26A17B", nullable=False)
    is_cash = Column(Boolean, default=False, nullable=False)

    portfolio = relationship("Portfolio", back_populates="holdings")
