from typing import Optional, Literal
from app.schemas.base import CamelModel

NotificationType = Literal["AI_SIGNAL", "PRICE_ALERT", "AUTOPILOT_TRADE", "SECURITY"]


class NotificationDto(CamelModel):
    id: str
    type: NotificationType
    title: str
    message: str
    time: str
    is_read: bool = False
    related_symbol: Optional[str] = None
