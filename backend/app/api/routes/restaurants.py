from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.repositories import RestaurantRepository, TableRepository, ReviewRepository
from app.schemas import schemas as s

router = APIRouter(prefix="/api/restaurants", tags=["Restaurants"])


@router.get("", response_model=list[s.RestaurantOut])
def search_restaurants(
    city: str | None = None,
    cuisine: str | None = None,
    q: str | None = Query(default=None, description="Search by restaurant name"),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    repo = RestaurantRepository(db)
    return repo.search(city=city, cuisine=cuisine, query=q, skip=skip, limit=limit)


@router.get("/{restaurant_id}", response_model=s.RestaurantOut)
def get_restaurant(restaurant_id: str, db: Session = Depends(get_db)):
    repo = RestaurantRepository(db)
    restaurant = repo.get(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant


@router.get("/{restaurant_id}/gallery", response_model=list[s.RestaurantImageOut])
def get_gallery(restaurant_id: str, db: Session = Depends(get_db)):
    repo = RestaurantRepository(db)
    restaurant = repo.get(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant.images


@router.get("/{restaurant_id}/tables", response_model=list[s.TableOut])
def get_floor_map(restaurant_id: str, db: Session = Depends(get_db)):
    """Returns all tables with live status - powers the interactive floor map."""
    repo = RestaurantRepository(db)
    if not repo.get(restaurant_id):
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return TableRepository(db).list_by_restaurant(restaurant_id)


@router.get("/{restaurant_id}/reviews", response_model=list[s.ReviewOut])
def get_reviews(restaurant_id: str, db: Session = Depends(get_db)):
    repo = RestaurantRepository(db)
    if not repo.get(restaurant_id):
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return ReviewRepository(db).list_by_restaurant(restaurant_id)
