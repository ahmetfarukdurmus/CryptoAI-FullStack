from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.coin import CoinMarket
from app.schemas.coin import CoinMarketDto, WatchlistToggleResponseDto
from app.services.binance import fetch_binance_market_data

router = APIRouter()


@router.get("/coins", response_model=List[CoinMarketDto])
async def get_all_coins(db: Session = Depends(get_db)):
    """
    Piyasadaki tüm kripto para birimlerini Binance Public API üzerinden canlı olarak döner.
    """
    live_tickers = await fetch_binance_market_data()
    db_coins = {c.symbol: c for c in db.query(CoinMarket).all()}

    results: List[CoinMarketDto] = []
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
        results.append(CoinMarketDto.model_validate(item))

    return results


@router.get("/watchlist", response_model=List[CoinMarketDto])
async def get_watchlist(db: Session = Depends(get_db)):
    """Takip listesindeki coinleri canlı Binance fiyatlarıyla döner."""
    all_coins = await get_all_coins(db)
    return [c for c in all_coins if c.is_watchlisted]


@router.post("/watchlist/{symbol}/toggle", response_model=WatchlistToggleResponseDto)
def toggle_watchlist(symbol: str, db: Session = Depends(get_db)):
    """
    Belirli bir coinin takip listesi durumunu tersine çevirir (ekle/çıkar).
    """
    sym_upper = symbol.upper()
    coin = db.query(CoinMarket).filter(CoinMarket.symbol == sym_upper).first()
    if not coin:
        # DB'de yoksa yeni kayıt oluştur
        coin = CoinMarket(
            symbol=sym_upper,
            name=sym_upper,
            price_usd=0.0,
            change_24h=0.0,
            high_24h=0.0,
            low_24h=0.0,
            volume_btc="0",
            rsi=50.0,
            ai_signal="AL",
            ai_confidence_percent=70,
            ai_analysis_text="Takip listesine eklendi.",
            is_watchlisted=True,
            has_alarm=False,
            icon_letter=sym_upper[:3],
            color="#00B2FE",
        )
        db.add(coin)
    else:
        coin.is_watchlisted = not coin.is_watchlisted

    db.commit()
    db.refresh(coin)

    return WatchlistToggleResponseDto(symbol=coin.symbol, is_watchlisted=coin.is_watchlisted)


@router.post("/watchlist/toggle", response_model=WatchlistToggleResponseDto)
def toggle_watchlist_body(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
):
    """Body üzerinden sembol alarak takip listesini günceller."""
    symbol = payload.get("symbol")
    if not symbol:
        raise HTTPException(status_code=400, detail="symbol parametresi zorunludur.")
    return toggle_watchlist(symbol, db)
