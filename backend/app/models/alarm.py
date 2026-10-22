from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Alarm(Base):
    __tablename__ = "alarms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String(20), nullable=False)
    target_price = Column(Float, nullable=False)
    condition = Column(String(20), nullable=False)  # ABOVE, BELOW
    send_notification = Column(Boolean, default=True, nullable=False)
    auto_sell_autopilot = Column(Boolean, default=False, nullable=False)
    sell_percentage = Column(Float, default=25.0, nullable=True)
    is_triggered = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="alarms")
