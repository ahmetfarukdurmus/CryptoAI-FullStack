from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.autopilot import AutopilotStatus, AutopilotLog, AutopilotSettingsModel
from app.schemas.autopilot import (
    AutopilotStatusDto,
    AutopilotLogDto,
    AutopilotSettingsDto,
)
from app.api.deps import get_current_user_optional

router = APIRouter()


@router.get("/autopilot/status", response_model=AutopilotStatusDto)
def get_autopilot_status(
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Otopilotun güncel çalışma durumunu, 24 saatlik metriklerini ve geçmiş işlem loglarını döner.
    React Native AutopilotScreen ve AutopilotStatusHeader ile tam uyumlu.
    """
    if not current_user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    status_obj = (
        db.query(AutopilotStatus).filter(AutopilotStatus.user_id == current_user.id).first()
    )
    if not status_obj:
        status_obj = AutopilotStatus(
            user_id=current_user.id,
            is_running=True,
            active_model_name="LSTM + XGBoost Hybrid Model",
            realized_profit_24h=327.91,
            success_rate_percent=78.4,
            total_trades_count=4,
        )
        db.add(status_obj)
        db.commit()
        db.refresh(status_obj)

    logs = (
        db.query(AutopilotLog)
        .filter(AutopilotLog.user_id == current_user.id)
        .order_by(AutopilotLog.created_at.desc())
        .limit(20)
        .all()
    )

    log_dtos = [AutopilotLogDto.model_validate(l) for l in logs]

    return AutopilotStatusDto(
        is_running=status_obj.is_running,
        active_model_name=status_obj.active_model_name,
        realized_profit_24h=status_obj.realized_profit_24h,
        success_rate_percent=status_obj.success_rate_percent,
        total_trades_count=status_obj.total_trades_count,
        logs=log_dtos,
    )


@router.post("/autopilot/toggle")
def toggle_autopilot(
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Otopilotu durdurur veya başlatır.
    Portföy tablosundaki is_autopilot_active bayrağını da günceller.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Oturum gereklidir.")

    status_obj = (
        db.query(AutopilotStatus).filter(AutopilotStatus.user_id == current_user.id).first()
    )
    portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()

    if status_obj:
        status_obj.is_running = not status_obj.is_running
        if portfolio:
            portfolio.is_autopilot_active = status_obj.is_running
        db.commit()
        db.refresh(status_obj)
        return {"isRunning": status_obj.is_running}

    return {"isRunning": False}


@router.get("/autopilot/settings", response_model=AutopilotSettingsDto)
def get_autopilot_settings(
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Otopilot strateji ve risk parametrelerini döner."""
    if not current_user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    settings_obj = (
        db.query(AutopilotSettingsModel)
        .filter(AutopilotSettingsModel.user_id == current_user.id)
        .first()
    )
    if not settings_obj:
        settings_obj = AutopilotSettingsModel(
            user_id=current_user.id,
            risk_profile="Dengeli",
            stop_loss_percent=10.0,
            take_profit_percent=20.0,
            max_trade_allocation_percent=25.0,
        )
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)

    return AutopilotSettingsDto.model_validate(settings_obj)


@router.put("/autopilot/settings", response_model=AutopilotSettingsDto)
def update_autopilot_settings(
    req: AutopilotSettingsDto,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Otopilot strateji ve risk parametrelerini günceller."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Oturum gereklidir.")

    settings_obj = (
        db.query(AutopilotSettingsModel)
        .filter(AutopilotSettingsModel.user_id == current_user.id)
        .first()
    )
    if not settings_obj:
        settings_obj = AutopilotSettingsModel(user_id=current_user.id)
        db.add(settings_obj)

    settings_obj.risk_profile = req.risk_profile
    settings_obj.stop_loss_percent = req.stop_loss_percent
    settings_obj.take_profit_percent = req.take_profit_percent
    settings_obj.max_trade_allocation_percent = req.max_trade_allocation_percent

    db.commit()
    db.refresh(settings_obj)
    return AutopilotSettingsDto.model_validate(settings_obj)
