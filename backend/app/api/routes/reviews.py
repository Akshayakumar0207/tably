from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models as m
from app.repositories.repositories import ReviewRepository, RestaurantRepository, ReservationRepository
from app.schemas import schemas as s
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@router.post("", response_model=s.ReviewOut, status_code=201)
def create_review(payload: s.ReviewCreate, db: Session = Depends(get_db),
                   current_user: m.User = Depends(get_current_user)):
    restaurant_repo = RestaurantRepository(db)
    review_repo = ReviewRepository(db)

    restaurant = restaurant_repo.get(payload.restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if review_repo.get_by_user_restaurant(current_user.id, payload.restaurant_id):
        raise HTTPException(status_code=400, detail="You have already reviewed this restaurant")

    has_completed_visit = any(
        r.restaurant_id == payload.restaurant_id and r.status == m.ReservationStatus.completed
        for r in ReservationRepository(db).list_by_user(current_user.id)
    )
    if not has_completed_visit:
        raise HTTPException(status_code=400, detail="You can only review restaurants after a completed visit")

    review = m.Review(
        user_id=current_user.id,
        restaurant_id=payload.restaurant_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    review = review_repo.create(review)
    restaurant_repo.recompute_rating(payload.restaurant_id)
    return review
