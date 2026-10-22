from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationDto
from app.api.deps import get_current_user_optional

router = APIRouter()


@router.get("/notifications", response_model=List[NotificationDto])
def get_notifications(
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Kullanıcının bildirimlerini listeler.
    React Native NotificationsModal ve NotificationContext ile uyumlu.
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Oturum gereklidir.")

    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return [NotificationDto.model_validate(n) for n in notifications]


@router.put("/notifications/{notification_id}/read")
def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Bildirimi okundu olarak işaretler."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Oturum gereklidir.")

    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı.")

    notif.is_read = True
    db.commit()
    return {"success": True}


@router.put("/notifications/read-all")
def mark_all_as_read(
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Tüm bildirimleri okundu olarak işaretler."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Oturum gereklidir.")

    db.query(Notification).filter(Notification.user_id == current_user.id).update(
        {"is_read": True}
    )
    db.commit()
    return {"success": True}


@router.delete("/notifications/{notification_id}")
def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Bildirimi siler."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Oturum gereklidir.")

    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı.")

    db.delete(notif)
    db.commit()
    return {"success": True}
