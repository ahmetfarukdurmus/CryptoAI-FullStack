from app.schemas.base import CamelModel
from app.schemas.user import (
    UserDto,
    UserRegisterRequest,
    UserLoginRequest,
    UserProfileUpdateRequest,
    AuthResponseDto,
    VerifyCodeRequest,
    ResendCodeRequest,
    RegisterResponseDto,
)
from app.schemas.portfolio import HoldingDto, PortfolioSummaryDto, TradeRequestDto
from app.schemas.coin import CoinMarketDto, CryptoMarketDto, CandleDto, WatchlistToggleResponseDto
from app.schemas.autopilot import (
    AutopilotLogDto,
    AutopilotStatusDto,
    AutopilotSettingsDto,
)
from app.schemas.alarm import CreateAlarmDto, AlarmResponseDto, AlertCreateDto, AlertDto
from app.schemas.notification import NotificationDto
from app.schemas.backtest import BacktestResultDto

__all__ = [
    "CamelModel",
    "UserDto",
    "UserRegisterRequest",
    "UserLoginRequest",
    "UserProfileUpdateRequest",
    "AuthResponseDto",
    "HoldingDto",
    "PortfolioSummaryDto",
    "TradeRequestDto",
    "CoinMarketDto",
    "CryptoMarketDto",
    "CandleDto",
    "WatchlistToggleResponseDto",
    "AutopilotLogDto",
    "AutopilotStatusDto",
    "AutopilotSettingsDto",
    "CreateAlarmDto",
    "AlarmResponseDto",
    "NotificationDto",
    "BacktestResultDto",
]
