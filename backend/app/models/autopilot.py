from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class AutopilotStatus(Base):
    __tablename__ = "autopilot_statuses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    is_running = Column(Boolean, default=True, nullable=False)
    active_model_name = Column(String(100), default="LSTM + XGBoost Hybrid Model", nullable=False)
    realized_profit_24h = Column(Float, default=327.91, nullable=False)
    success_rate_percent = Column(Float, default=78.4, nullable=False)
    total_trades_count = Column(Integer, default=4, nullable=False)

    user = relationship("User", back_populates="autopilot_status")


class AutopilotLog(Base):
    __tablename__ = "autopilot_logs"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(10), nullable=False)  # BUY, SELL
    title = Column(String(150), nullable=False)
    symbol = Column(String(20), nullable=False)
    amount_info = Column(String(150), nullable=False)
    profit_usd = Column(Float, nullable=True)
    reason = Column(Text, nullable=False)
    time = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="autopilot_logs")


class AutopilotSettingsModel(Base):
    __tablename__ = "autopilot_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    risk_profile = Column(String(50), default="Dengeli", nullable=False)  # Muhafazakar, Dengeli, Agresif
    stop_loss_percent = Column(Float, default=10.0, nullable=False)
    take_profit_percent = Column(Float, default=20.0, nullable=False)
    max_trade_allocation_percent = Column(Float, default=25.0, nullable=False)

    user = relationship("User", back_populates="autopilot_settings")
