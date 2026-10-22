from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # AI_SIGNAL, PRICE_ALERT, AUTOPILOT_TRADE, SECURITY
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    time = Column(String(50), nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    related_symbol = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="notifications")
