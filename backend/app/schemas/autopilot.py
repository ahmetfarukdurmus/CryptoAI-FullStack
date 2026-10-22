from typing import List, Optional, Literal
from app.schemas.base import CamelModel

RiskProfileType = Literal["Muhafazakar", "Dengeli", "Agresif"]


class AutopilotLogDto(CamelModel):
    id: str
    type: Literal["BUY", "SELL"]
    title: str
    symbol: str
    amount_info: str
    profit_usd: Optional[float] = None
    reason: str
    time: str


class AutopilotStatusDto(CamelModel):
    is_running: bool
    active_model_name: str
    realized_profit_24h: float
    success_rate_percent: float
    total_trades_count: int
    logs: List[AutopilotLogDto] = []


class AutopilotSettingsDto(CamelModel):
    risk_profile: RiskProfileType = "Dengeli"
    stop_loss_percent: float = 10.0
    take_profit_percent: float = 20.0
    max_trade_allocation_percent: float = 25.0
