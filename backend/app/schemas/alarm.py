from typing import Optional, Literal
from app.schemas.base import CamelModel


class CreateAlarmDto(CamelModel):
    symbol: str
    target_price: float
    condition: Literal["ABOVE", "BELOW"]
    send_notification: bool = True
    auto_sell_autopilot: bool = False
    sell_percentage: Optional[float] = 25.0


class AlarmResponseDto(CreateAlarmDto):
    id: int
    is_triggered: bool = False


class AlertCreateDto(CamelModel):
    symbol: str
    target_price: float
    condition: Literal["ABOVE", "BELOW"]  # BELOW (Stop-Loss / Alt Limit), ABOVE (Take-Profit / Üst Limit)
    alert_type: Optional[str] = "PRICE_ALERT"  # STOP_LOSS, TAKE_PROFIT, PRICE_ALERT
    message: Optional[str] = None


class AlertDto(CamelModel):
    id: int
    user_id: str
    symbol: str
    target_price: float
    condition: str
    alert_type: str
    message: Optional[str] = None
    is_triggered: bool = False
