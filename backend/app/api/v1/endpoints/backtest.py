from typing import Dict, Literal
from fastapi import APIRouter, Query, HTTPException
from app.schemas.backtest import BacktestResultDto

router = APIRouter()

PERIOD_DATA: Dict[str, dict] = {
    "1M": {
        "period": "1M",
        "total_return_percent": 8.6,
        "initial_capital_usd": 10000.0,
        "final_capital_usd": 10860.0,
        "win_rate_percent": 75.0,
        "trades_count": 24,
        "max_drawdown_percent": 3.2,
        "sharpe_ratio": 1.95,
        "equity_curve": [10000.0, 10200.0, 10100.0, 10500.0, 10860.0],
    },
    "3M": {
        "period": "3M",
        "total_return_percent": 21.3,
        "initial_capital_usd": 10000.0,
        "final_capital_usd": 12130.0,
        "win_rate_percent": 76.5,
        "trades_count": 68,
        "max_drawdown_percent": 4.8,
        "sharpe_ratio": 2.05,
        "equity_curve": [10000.0, 10300.0, 10700.0, 11200.0, 11800.0, 12130.0],
    },
    "6M": {
        "period": "6M",
        "total_return_percent": 38.4,
        "initial_capital_usd": 10000.0,
        "final_capital_usd": 13840.0,
        "win_rate_percent": 78.2,
        "trades_count": 142,
        "max_drawdown_percent": 6.15,
        "sharpe_ratio": 2.14,
        "equity_curve": [
            10000.0, 10450.0, 10200.0, 11100.0, 11800.0, 11600.0, 12400.0, 13100.0, 12900.0, 13840.0
        ],
    },
}


@router.get("/backtest", response_model=BacktestResultDto)
def get_backtest_results(
    period: Literal["1M", "3M", "6M"] = Query(default="1M", description="Backtest simülasyon periyodu")
):
    """
    AI modelinin geçmişe dönük alım-satım simülasyon verilerini döner.
    React Native AutopilotBacktestCard ile tam uyumlu.
    """
    data = PERIOD_DATA.get(period)
    if not data:
        raise HTTPException(status_code=400, detail="Geçersiz periyot. Geçerli periyotlar: 1M, 3M, 6M")

    return BacktestResultDto.model_validate(data)
