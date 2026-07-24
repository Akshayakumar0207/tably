from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models as m
from app.repositories.repositories import FavoriteRepository, RestaurantRepository
from app.schemas import schemas as s
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/favorites", tags=["Favorites"])


@router.get("", response_model=list[s.RestaurantOut])
def list_favorites(db: Session = Depends(get_db), current_user: m.User = Depends(get_current_user)):
    favs = FavoriteRepository(db).list_by_user(current_user.id)
    return [f.restaurant for f in favs]


@router.post("/{restaurant_id}", status_code=201)
def add_favorite(restaurant_id: str, db: Session = Depends(get_db),
                  current_user: m.User = Depends(get_current_user)):
    if not RestaurantRepository(db).get(restaurant_id):
        raise HTTPException(status_code=404, detail="Restaurant not found")
    repo = FavoriteRepository(db)
    if repo.get(current_user.id, restaurant_id):
        raise HTTPException(status_code=400, detail="Already in favorites")
    repo.create(m.Favorite(user_id=current_user.id, restaurant_id=restaurant_id))
    return {"message": "Added to favorites"}


@router.delete("/{restaurant_id}")
def remove_favorite(restaurant_id: str, db: Session = Depends(get_db),
                     current_user: m.User = Depends(get_current_user)):
    repo = FavoriteRepository(db)
    fav = repo.get(current_user.id, restaurant_id)
    if not fav:
        raise HTTPException(status_code=404, detail="Not in favorites")
    repo.delete(fav)
    return {"message": "Removed from favorites"}
