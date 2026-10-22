from typing import List
from app.schemas.base import CamelModel


class BacktestResultDto(CamelModel):
    period: str
    total_return_percent: float
    initial_capital_usd: float
    final_capital_usd: float
    win_rate_percent: float
    trades_count: int
    max_drawdown_percent: float
    sharpe_ratio: float
    equity_curve: List[float]
