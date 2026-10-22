from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Alert(Base):
    """
    Fiyat Eşiği ve Otomatik Bildirim (Stop-Loss / Take-Profit / Limit Alarm) Modeli.
    Alım-satım modalı ve piyasa takibinde kullanılır.
    """
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    target_price = Column(Float, nullable=False)
    condition = Column(String(20), nullable=False)  # BELOW (Alt Limit / Stop-Loss) veya ABOVE (Üst Limit / Kâr Alma)
    alert_type = Column(String(50), default="PRICE_ALERT", nullable=False)  # STOP_LOSS, TAKE_PROFIT, PRICE_ALERT
    message = Column(Text, nullable=True)
    is_triggered = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="price_alerts")
