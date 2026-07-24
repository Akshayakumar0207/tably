from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models as m
from app.repositories.repositories import (
    UserRepository, RestaurantRepository, ReservationRepository, OwnerProfileRepository,
)
from app.schemas import schemas as s
from app.api.deps import require_role
from app.services.notification_service import notify

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users", response_model=list[s.UserOut])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
                current_user: m.User = Depends(require_role("admin"))):
    return UserRepository(db).list_all(skip, limit)


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: str, db: Session = Depends(get_db),
                        current_user: m.User = Depends(require_role("admin"))):
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    repo.update(user)
    return {"message": f"User is now {'active' if user.is_active else 'disabled'}"}


@router.get("/restaurants", response_model=list[s.RestaurantOut])
def list_all_restaurants(db: Session = Depends(get_db), current_user: m.User = Depends(require_role("admin"))):
    return RestaurantRepository(db).list_all()


@router.get("/restaurants/pending", response_model=list[s.RestaurantOut])
def list_pending_restaurants(db: Session = Depends(get_db), current_user: m.User = Depends(require_role("admin"))):
    return RestaurantRepository(db).list_pending()


@router.put("/restaurants/{restaurant_id}/approval", response_model=s.RestaurantOut)
def approve_or_reject_restaurant(restaurant_id: str, payload: s.RestaurantApproval, db: Session = Depends(get_db),
                                  current_user: m.User = Depends(require_role("admin"))):
    if payload.status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="status must be 'approved' or 'rejected'")

    repo = RestaurantRepository(db)
    restaurant = repo.get(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    restaurant.status = m.RestaurantStatus(payload.status)
    restaurant = repo.update(restaurant)

    owner_profile = restaurant.owner
    if owner_profile:
        notify(db, owner_profile.user_id, f"Restaurant {payload.status.capitalize()}",
               f"Your restaurant '{restaurant.name}' has been {payload.status} by the admin team.",
               m.NotificationType.system)
    return restaurant


@router.put("/owners/{owner_profile_id}/verify")
def verify_owner(owner_profile_id: str, db: Session = Depends(get_db),
                  current_user: m.User = Depends(require_role("admin"))):
    profile = db.query(m.OwnerProfile).filter(m.OwnerProfile.id == owner_profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Owner profile not found")
    profile.is_verified = True
    db.commit()
    notify(db, profile.user_id, "Account Verified",
           "Your restaurant owner account has been verified by the admin team.", m.NotificationType.system)
    return {"message": "Owner verified"}


@router.get("/reservations", response_model=list[s.ReservationOut])
def list_all_reservations(db: Session = Depends(get_db), current_user: m.User = Depends(require_role("admin"))):
    return ReservationRepository(db).list_all()


@router.get("/analytics/system")
def system_analytics(db: Session = Depends(get_db), current_user: m.User = Depends(require_role("admin"))):
    users = UserRepository(db).list_all(0, 100000)
    restaurants = RestaurantRepository(db).list_all()
    reservations = ReservationRepository(db).list_all()

    return {
        "total_users": len(users),
        "total_customers": sum(1 for u in users if u.role == m.UserRole.customer),
        "total_owners": sum(1 for u in users if u.role == m.UserRole.owner),
        "total_restaurants": len(restaurants),
        "approved_restaurants": sum(1 for r in restaurants if r.status == m.RestaurantStatus.approved),
        "pending_restaurants": sum(1 for r in restaurants if r.status == m.RestaurantStatus.pending),
        "total_reservations": len(reservations),
        "completed_reservations": sum(1 for r in reservations if r.status == m.ReservationStatus.completed),
        "cancelled_reservations": sum(1 for r in reservations if r.status == m.ReservationStatus.cancelled),
    }
