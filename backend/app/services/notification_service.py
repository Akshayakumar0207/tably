"""
In-app notification service.

Notifications are written straight to the database and fetched by the
frontend (polled via TanStack Query). This gives fully working,
zero-cost, zero-setup notifications without requiring a Firebase project.

If you later want real push-to-device notifications, swap `create` below
to also call the Firebase Admin SDK - the call site (routes) doesn't change.
"""
from sqlalchemy.orm import Session

from app.models import models as m
from app.repositories.repositories import NotificationRepository


def notify(db: Session, user_id: str, title: str, message: str, ntype: m.NotificationType):
    repo = NotificationRepository(db)
    notification = m.Notification(user_id=user_id, title=title, message=message, type=ntype)
    return repo.create(notification)
