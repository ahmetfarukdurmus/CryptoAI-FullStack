import time
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.portfolio import Portfolio, Holding
from app.models.coin import CoinMarket
from app.models.autopilot import AutopilotStatus, AutopilotLog
from app.schemas.portfolio import PortfolioSummaryDto, HoldingDto, TradeRequestDto
from app.api.deps import get_current_user_optional

router = APIRouter()


@router.get("/portfolio", response_model=PortfolioSummaryDto)
def get_portfolio(
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Kullanıcının toplam portföy özetini ve varlık dağılımını döner.
    React Native PortfolioScreen ile %100 uyumlu.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı portföyü bulunamadı.",
        )

    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portföy kaydı mevcut değil.",
        )

    holdings_dtos = [HoldingDto.model_validate(h) for h in portfolio.holdings]

    return PortfolioSummaryDto(
        total_balance_usd=portfolio.total_balance_usd,
        daily_change_usd=portfolio.daily_change_usd,
        is_autopilot_active=portfolio.is_autopilot_active,
        llm_analysis_text=portfolio.llm_analysis_text,
        holdings=holdings_dtos,
    )


@router.post("/trade")
def execute_trade(
    req: TradeRequestDto,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Manuel veya Otopilot ALIM / SATIM emrini yürütür.
    Cüzdandaki USDT ve ilgili coin bakiyesini atomik olarak günceller,
    işlem kaydını Otopilot loglarına ekler.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Oturum gereklidir.")

    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portföy bulunamadı.")

    cash_holding = (
        db.query(Holding)
        .filter(Holding.portfolio_id == portfolio.id, Holding.is_cash == True)
        .first()
    )
    coin_holding = (
        db.query(Holding)
        .filter(Holding.portfolio_id == portfolio.id, Holding.symbol == req.symbol)
        .first()
    )
    coin_meta = db.query(CoinMarket).filter(CoinMarket.symbol == req.symbol).first()

    if req.type == "BUY":
        if cash_holding and cash_holding.amount < req.cost_usd:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Yetersiz nakit bakiye! Mevcut: ${cash_holding.amount:.2f}, İstenen: ${req.cost_usd:.2f}",
            )

        # Nakitten düş
        if cash_holding:
            cash_holding.amount = max(0.0, cash_holding.amount - req.cost_usd)
            cash_holding.value_usd = cash_holding.amount

        # Coini artır veya yeni pozisyon aç
        if coin_holding:
            coin_holding.amount += req.amount
            coin_holding.value_usd += req.cost_usd
        else:
            new_holding = Holding(
                portfolio_id=portfolio.id,
                symbol=req.symbol,
                name=f"{req.amount} {req.symbol}",
                amount=req.amount,
                value_usd=req.cost_usd,
                change_usd=0.0,
                change_percent=0.0,
                icon_letter=coin_meta.icon_letter if coin_meta else req.symbol[0],
                color=coin_meta.color if coin_meta else "#00B2FE",
                is_cash=False,
            )
            db.add(new_holding)

    else:  # SELL
        if not coin_holding or coin_holding.amount < req.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Satılacak yeterli {req.symbol} varlığı bulunmuyor.",
            )

        coin_holding.amount = max(0.0, coin_holding.amount - req.amount)
        coin_holding.value_usd = max(0.0, coin_holding.value_usd - req.cost_usd)

        # Nakite ekle
        if cash_holding:
            cash_holding.amount += req.cost_usd
            cash_holding.value_usd = cash_holding.amount
        else:
            cash_holding = Holding(
                portfolio_id=portfolio.id,
                symbol="USDT",
                name="Kullanılabilir Nakit",
                amount=req.cost_usd,
                value_usd=req.cost_usd,
                change_usd=0.0,
                icon_letter="₮",
                color="#26A17B",
                is_cash=True,
            )
            db.add(cash_holding)

    db.flush()

    # Portföy toplam değerini güncelle
    all_holdings = db.query(Holding).filter(Holding.portfolio_id == portfolio.id).all()
    portfolio.total_balance_usd = sum(h.value_usd for h in all_holdings)

    # Otopilot loglarına ekle
    trade_time_str = datetime.now().strftime("%H:%M")
    new_log = AutopilotLog(
        id=f"trade_{int(time.time() * 1000)}",
        user_id=current_user.id,
        type=req.type,
        title=f"{req.symbol} Manuel {'Alım' if req.type == 'BUY' else 'Satış'}",
        symbol=req.symbol,
        amount_info=f"{req.amount:.4f} {req.symbol} (${req.cost_usd:.2f})",
        profit_usd=None,
        reason="Kullanıcı paneli üzerinden manuel emir yürütüldü.",
        time=trade_time_str,
    )
    db.add(new_log)

    # Autopilot istatistiğini artır
    autopilot_status = (
        db.query(AutopilotStatus).filter(AutopilotStatus.user_id == current_user.id).first()
    )
    if autopilot_status:
        autopilot_status.total_trades_count += 1

    db.commit()

    return {"success": True, "message": f"{req.symbol} {req.type} işlemi başarıyla tamamlandı."}
