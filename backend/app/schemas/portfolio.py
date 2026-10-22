from typing import List, Optional, Literal
from app.schemas.base import CamelModel


class HoldingDto(CamelModel):
    symbol: str
    name: str
    amount: float
    value_usd: float
    change_usd: float = 0.0
    change_percent: Optional[float] = 0.0
    icon_letter: str = "₮"
    color: str = "#26A17B"
    is_cash: Optional[bool] = False


class PortfolioSummaryDto(CamelModel):
    total_balance_usd: float
    daily_change_usd: float
    is_autopilot_active: bool
    llm_analysis_text: str
    holdings: List[HoldingDto] = []


class TradeRequestDto(CamelModel):
    symbol: str
    type: Literal["BUY", "SELL"]
    amount: float
    cost_usd: float
