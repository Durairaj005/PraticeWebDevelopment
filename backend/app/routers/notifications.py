from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationRead

router = APIRouter()

@router.get("/me", response_model=List[NotificationRead])
def read_own_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get current user's notifications.
    """
    notifications = db.query(Notification)\
        .filter(Notification.user_id == current_user.id)\
        .order_by(Notification.created_at.desc())\
        .all()
    return notifications

@router.put("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(
    *,
    db: Session = Depends(get_db),
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Mark a specific notification as read.
    """
    notification = db.query(Notification)\
        .filter(Notification.id == notification_id)\
        .filter(Notification.user_id == current_user.id)\
        .first()
        
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
