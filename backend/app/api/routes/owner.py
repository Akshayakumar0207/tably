from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models as m
from app.repositories.repositories import RestaurantRepository, OwnerProfileRepository, ReservationRepository
from app.schemas import schemas as s
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/api/owner", tags=["Owner"])


def _get_owner_profile(db: Session, current_user: m.User) -> m.OwnerProfile:
    profile = OwnerProfileRepository(db).get_by_user_id(current_user.id)
    if not profile:
        raise HTTPException(status_code=400, detail="Owner profile not set up. Complete onboarding first.")
    return profile


def _check_ownership(db: Session, current_user: m.User, restaurant: m.Restaurant):
    if current_user.role == m.UserRole.admin:
        return
    profile = _get_owner_profile(db, current_user)
    if restaurant.owner_id != profile.id:
        raise HTTPException(status_code=403, detail="Not authorized for this restaurant")


@router.post("/profile", response_model=s.OwnerProfileOut, status_code=201)
def create_owner_profile(payload: s.OwnerProfileCreate, db: Session = Depends(get_db),
                          current_user: m.User = Depends(require_role("owner"))):
    repo = OwnerProfileRepository(db)
    if repo.get_by_user_id(current_user.id):
        raise HTTPException(status_code=400, detail="Owner profile already exists")
    profile = m.OwnerProfile(user_id=current_user.id, business_name=payload.business_name,
                              business_phone=payload.business_phone)
    return repo.create(profile)


@router.get("/profile", response_model=s.OwnerProfileOut)
def get_owner_profile(db: Session = Depends(get_db), current_user: m.User = Depends(require_role("owner"))):
    return _get_owner_profile(db, current_user)


@router.get("/restaurants", response_model=list[s.RestaurantOut])
def my_restaurants(db: Session = Depends(get_db), current_user: m.User = Depends(require_role("owner"))):
    profile = _get_owner_profile(db, current_user)
    return RestaurantRepository(db).list_by_owner(profile.id)


@router.post("/restaurants", response_model=s.RestaurantOut, status_code=201)
def add_restaurant(payload: s.RestaurantCreate, db: Session = Depends(get_db),
                    current_user: m.User = Depends(require_role("owner"))):
    profile = _get_owner_profile(db, current_user)
    restaurant = m.Restaurant(owner_id=profile.id, **payload.model_dump())
    return RestaurantRepository(db).create(restaurant)


@router.put("/restaurants/{restaurant_id}", response_model=s.RestaurantOut)
def edit_restaurant(restaurant_id: str, payload: s.RestaurantUpdate, db: Session = Depends(get_db),
                     current_user: m.User = Depends(require_role("owner", "admin"))):
    repo = RestaurantRepository(db)
    restaurant = repo.get(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    _check_ownership(db, current_user, restaurant)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(restaurant, field, value)
    return repo.update(restaurant)


@router.delete("/restaurants/{restaurant_id}")
def delete_restaurant(restaurant_id: str, db: Session = Depends(get_db),
                       current_user: m.User = Depends(require_role("owner", "admin"))):
    repo = RestaurantRepository(db)
    restaurant = repo.get(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    _check_ownership(db, current_user, restaurant)
    repo.delete(restaurant)
    return {"message": "Restaurant deleted"}


@router.post("/restaurants/{restaurant_id}/images", response_model=s.RestaurantImageOut, status_code=201)
def add_restaurant_image(restaurant_id: str, payload: s.ImageUpload, db: Session = Depends(get_db),
                          current_user: m.User = Depends(require_role("owner", "admin"))):
    """
    Registers an image (as a data URL, compressed client-side) against a
    restaurant. Kept free of any external storage dependency.
    """
    repo = RestaurantRepository(db)
    restaurant = repo.get(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    _check_ownership(db, current_user, restaurant)

    image = m.RestaurantImage(restaurant_id=restaurant_id, url=payload.url)
    db.add(image)
    db.commit()
    db.refresh(image)
    if not restaurant.cover_image_url:
        restaurant.cover_image_url = payload.url
        repo.update(restaurant)
    return image


@router.delete("/restaurants/{restaurant_id}/images/{image_id}")
def delete_restaurant_image(restaurant_id: str, image_id: str, db: Session = Depends(get_db),
                             current_user: m.User = Depends(require_role("owner", "admin"))):
    repo = RestaurantRepository(db)
    restaurant = repo.get(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    _check_ownership(db, current_user, restaurant)

    image = db.query(m.RestaurantImage).filter(
        m.RestaurantImage.id == image_id, m.RestaurantImage.restaurant_id == restaurant_id
    ).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    was_cover = restaurant.cover_image_url == image.url
    db.delete(image)
    db.commit()
    if was_cover:
        remaining = db.query(m.RestaurantImage).filter(m.RestaurantImage.restaurant_id == restaurant_id).first()
        restaurant.cover_image_url = remaining.url if remaining else None
        repo.update(restaurant)
    return {"message": "Image deleted"}


@router.get("/dashboard/{restaurant_id}")
def dashboard_overview(restaurant_id: str, db: Session = Depends(get_db),
                        current_user: m.User = Depends(require_role("owner", "admin"))):
    repo = RestaurantRepository(db)
    restaurant = repo.get(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    _check_ownership(db, current_user, restaurant)

    reservations = ReservationRepository(db).list_by_restaurant(restaurant_id)
    today = date.today()

    total_reservations = len(reservations)
    confirmed = sum(1 for r in reservations if r.status == m.ReservationStatus.confirmed)
    completed = sum(1 for r in reservations if r.status == m.ReservationStatus.completed)
    pending = sum(1 for r in reservations if r.status == m.ReservationStatus.pending)
    cancelled = sum(1 for r in reservations if r.status == m.ReservationStatus.cancelled)
    today_reservations = [r for r in reservations if r.reservation_date == today]

    # Revenue is not modeled in the schema (no pricing/menu module was requested),
    # so "daily revenue" is reported as completed-reservation volume - swap in
    # real order totals here once a billing/menu module is added.
    last_7_days = [
        {
            "date": str(today - timedelta(days=i)),
            "reservations": sum(1 for r in reservations if r.reservation_date == today - timedelta(days=i)),
        }
        for i in range(6, -1, -1)
    ]

    return {
        "restaurant_name": restaurant.name,
        "total_reservations": total_reservations,
        "confirmed": confirmed,
        "completed": completed,
        "pending": pending,
        "cancelled": cancelled,
        "today_reservation_count": len(today_reservations),
        "avg_rating": restaurant.avg_rating,
        "review_count": restaurant.review_count,
        "reservations_last_7_days": last_7_days,
    }
