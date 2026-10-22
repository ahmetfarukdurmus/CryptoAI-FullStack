from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.alert import Alert
from app.schemas.alarm import AlertCreateDto, AlertDto
from app.api.deps import get_current_user_optional

router = APIRouter()


@router.post("/alerts", response_model=AlertDto, status_code=status.HTTP_201_CREATED)
def create_price_alert(
    req: AlertCreateDto,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Kullanıcının belirlediği Fiyat Eşiği ve Otomatik Bildirim (Stop-Loss / Take-Profit) alarmını kaydeder.
    PostgreSQL alerts tablosuna yazar.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Oturum gereklidir.")

    sym = req.symbol.upper()
    default_msg = (
        f"{sym} belirlediğiniz limit seviyesine (${req.target_price:,.2f}) ulaştı!"
        if not req.message
        else req.message
    )

    new_alert = Alert(
        user_id=current_user.id,
        symbol=sym,
        target_price=req.target_price,
        condition=req.condition,
        alert_type=req.alert_type or "PRICE_ALERT",
        message=default_msg,
        is_triggered=False,
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return AlertDto.model_validate(new_alert)


@router.get("/alerts", response_model=List[AlertDto])
def get_user_alerts(
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Kullanıcının aktif alarmlarını listeler."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Oturum gereklidir.")

    alerts = (
        db.query(Alert)
        .filter(Alert.user_id == current_user.id, Alert.is_triggered == False)
        .order_by(Alert.created_at.desc())
        .all()
    )
    return [AlertDto.model_validate(a) for a in alerts]


@router.post("/alerts/{alert_id}/dismiss")
def dismiss_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Tetiklenen veya kullanıcı tarafından kapatılan alarmı işaretler."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Oturum gereklidir.")

    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id, Alert.user_id == current_user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alarm bulunamadı.")

    alert.is_triggered = True
    db.commit()
    return {"success": True, "message": "Alarm kapatıldı."}


@router.delete("/alerts/{alert_id}")
def delete_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Alarmı siler."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Oturum gereklidir.")

    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id, Alert.user_id == current_user.id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alarm bulunamadı.")

    db.delete(alert)
    db.commit()
    return {"success": True, "message": "Alarm silindi."}
