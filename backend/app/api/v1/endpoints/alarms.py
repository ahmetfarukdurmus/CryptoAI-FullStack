from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.coin import CoinMarket
from app.models.alarm import Alarm
from app.schemas.alarm import CreateAlarmDto, AlarmResponseDto
from app.api.deps import get_current_user_optional

router = APIRouter()


@router.post("/alarms", status_code=status.HTTP_201_CREATED)
def create_alarm(
    req: CreateAlarmDto,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Yeni bir fiyat eşiği veya AI otopilot alarmı oluşturur.
    React Native NewAlarmScreen ile tam uyumlu.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Oturum gereklidir.")

    alarm = Alarm(
        user_id=current_user.id,
        symbol=req.symbol.upper(),
        target_price=req.target_price,
        condition=req.condition,
        send_notification=req.send_notification,
        auto_sell_autopilot=req.auto_sell_autopilot,
        sell_percentage=req.sell_percentage,
    )
    db.add(alarm)

    # Coinin has_alarm alanını güncelle
    coin = db.query(CoinMarket).filter(CoinMarket.symbol == req.symbol.upper()).first()
    if coin:
        coin.has_alarm = True

    db.commit()
    db.refresh(alarm)

    return {"success": True, "message": "Alarm başarıyla kaydedildi.", "id": alarm.id}


@router.get("/alarms", response_model=List[AlarmResponseDto])
def get_user_alarms(
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Kullanıcının tanımladığı alarmları döner."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Oturum gereklidir.")

    alarms = db.query(Alarm).filter(Alarm.user_id == current_user.id).all()
    return [AlarmResponseDto.model_validate(a) for a in alarms]
