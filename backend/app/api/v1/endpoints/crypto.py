from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.coin import CoinMarket
from app.services.binance import fetch_binance_market_data
from app.schemas.coin import CryptoMarketDto

router = APIRouter()


@router.get("/market", response_model=List[CryptoMarketDto])
async def get_crypto_market(db: Session = Depends(get_db)):
    """
    Binance Public REST API üzerinden majör paritelerin (BTC, ETH, SOL, BNB, ADA, AVAX)
    anlık 24 saatlik verilerini (lastPrice, priceChangePercent, highPrice, lowPrice, volume)
    sadeleştirilmiş ve canlı olarak döner.
    """
    live_tickers = await fetch_binance_market_data()

    # Veritabanındaki takip listesi (watchlist) ve alarm durumlarını birleştir
    db_coins = {c.symbol: c for c in db.query(CoinMarket).all()}

    results: List[CryptoMarketDto] = []
    for ticker in live_tickers:
        symbol = ticker["symbol"]
        db_coin = db_coins.get(symbol)

        is_watchlisted = db_coin.is_watchlisted if db_coin else ticker.get("is_watchlisted", False)
        has_alarm = db_coin.has_alarm if db_coin else ticker.get("has_alarm", False)

        item = {
            **ticker,
            "is_watchlisted": is_watchlisted,
            "has_alarm": has_alarm,
        }
        results.append(CryptoMarketDto.model_validate(item))

    return results
