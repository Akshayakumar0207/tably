from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models as m
from app.repositories.repositories import NotificationRepository
from app.schemas import schemas as s
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=list[s.NotificationOut])
def list_notifications(db: Session = Depends(get_db), current_user: m.User = Depends(get_current_user)):
    return NotificationRepository(db).list_by_user(current_user.id)


@router.put("/{notification_id}/read", response_model=s.NotificationOut)
def mark_read(notification_id: str, db: Session = Depends(get_db),
              current_user: m.User = Depends(get_current_user)):
    repo = NotificationRepository(db)
    notif = next((n for n in repo.list_by_user(current_user.id) if n.id == notification_id), None)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return repo.mark_read(notif)


@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: m.User = Depends(get_current_user)):
    NotificationRepository(db).mark_all_read(current_user.id)
    return {"message": "All notifications marked as read"}
