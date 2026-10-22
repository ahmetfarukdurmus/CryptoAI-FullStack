from typing import Optional, Literal
from app.schemas.base import CamelModel

AiSignalType = Literal["GÜÇLÜ AL", "AL", "NÖTR", "SAT"]


class CoinMarketDto(CamelModel):
    symbol: str
    pair_symbol: Optional[str] = None
    name: str
    price_usd: float
    change_24h: float
    change_usd: Optional[float] = 0.0
    high_24h: float
    low_24h: float
    volume_btc: str
    # Binance uyumluluk alanları
    last_price: Optional[float] = None
    price_change_percent: Optional[float] = None
    high_price: Optional[float] = None
    low_price: Optional[float] = None
    volume: Optional[str] = None
    rsi: float
    ai_signal: AiSignalType
    ai_confidence_percent: int
    ai_analysis_text: str
    is_watchlisted: bool
    has_alarm: Optional[bool] = False
    icon_letter: str
    color: str


class CryptoMarketDto(CamelModel):
    symbol: str
    pair_symbol: Optional[str] = None
    name: str
    last_price: float
    price_change_percent: float
    high_price: float
    low_price: float
    volume: str
    # Frontend uyumluluk alanları
    price_usd: float
    change_24h: float
    change_usd: Optional[float] = 0.0
    high_24h: float
    low_24h: float
    volume_btc: str
    rsi: float = 50.0
    ai_signal: AiSignalType = "AL"
    ai_confidence_percent: int = 70
    ai_analysis_text: str = ""
    is_watchlisted: bool = False
    has_alarm: Optional[bool] = False
    icon_letter: str
    color: str


class CandleDto(CamelModel):
    time: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class WatchlistToggleResponseDto(CamelModel):
    symbol: str
    is_watchlisted: bool
