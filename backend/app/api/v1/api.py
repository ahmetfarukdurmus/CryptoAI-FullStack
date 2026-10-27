from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    crypto,
    portfolio,
    coins,
    autopilot,
    alarms,
    alerts,
    notifications,
    backtest,
    ai,
)

api_router = APIRouter()

# Yapay Zeka Danışmanı & Chat (/ai/chat, /chat/message)
api_router.include_router(ai.router, prefix="/ai", tags=["AI Consultant"])
api_router.include_router(ai.router, prefix="/chat", tags=["AI Chat"])

# Kimlik Doğrulama & Kullanıcı (/auth/register, /auth/login, /auth/me, /auth/profile)
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Rota esnekliği: /login, /register, /me çağrılarını da doğrudan karşıla
api_router.include_router(auth.router, tags=["Auth Shortcuts"])

# Canlı Binance Kripto Verileri (/crypto/market)
api_router.include_router(crypto.router, prefix="/crypto", tags=["Binance Live Crypto"])

# Fiyat Eşiği ve Otomatik Bildirim Alarmları (/alerts)
api_router.include_router(alerts.router, tags=["Price Alerts"])

# Portföy & İşlemler (/portfolio, /trade)
api_router.include_router(portfolio.router, tags=["Portfolio"])

# Piyasa & Kripto Paralar (/coins, /watchlist)
api_router.include_router(coins.router, tags=["Coins & Market"])

# Otopilot (/autopilot/status, /autopilot/toggle, /autopilot/settings)
api_router.include_router(autopilot.router, tags=["Autopilot"])

# Alarmlar (/alarms)
api_router.include_router(alarms.router, tags=["Alarms"])

# Bildirimler (/notifications)
api_router.include_router(notifications.router, tags=["Notifications"])

# Backtest (/backtest)
api_router.include_router(backtest.router, tags=["Backtest"])
