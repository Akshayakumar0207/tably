from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models as m
from app.repositories.repositories import TableRepository, RestaurantRepository, OwnerProfileRepository
from app.schemas import schemas as s
from app.api.deps import require_role

router = APIRouter(prefix="/api/owner/restaurants/{restaurant_id}/tables", tags=["Owner - Tables"])


def _check_ownership(db: Session, current_user: m.User, restaurant: m.Restaurant):
    if current_user.role == m.UserRole.admin:
        return
    profile = OwnerProfileRepository(db).get_by_user_id(current_user.id)
    if not profile or restaurant.owner_id != profile.id:
        raise HTTPException(status_code=403, detail="Not authorized for this restaurant")


@router.get("", response_model=list[s.TableOut])
def list_tables(restaurant_id: str, db: Session = Depends(get_db),
                 current_user: m.User = Depends(require_role("owner", "admin"))):
    restaurant = RestaurantRepository(db).get(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    _check_ownership(db, current_user, restaurant)
    return TableRepository(db).list_by_restaurant(restaurant_id)


@router.post("", response_model=s.TableOut, status_code=201)
def create_table(restaurant_id: str, payload: s.TableCreate, db: Session = Depends(get_db),
                  current_user: m.User = Depends(require_role("owner", "admin"))):
    restaurant = RestaurantRepository(db).get(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    _check_ownership(db, current_user, restaurant)

    table = m.RestaurantTable(restaurant_id=restaurant_id, **payload.model_dump())
    return TableRepository(db).create(table)


@router.put("/{table_id}", response_model=s.TableOut)
def update_table(restaurant_id: str, table_id: str, payload: s.TableUpdate, db: Session = Depends(get_db),
                  current_user: m.User = Depends(require_role("owner", "admin"))):
    restaurant = RestaurantRepository(db).get(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    _check_ownership(db, current_user, restaurant)

    repo = TableRepository(db)
    table = repo.get(table_id)
    if not table or table.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Table not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(table, field, value)
    return repo.update(table)


@router.delete("/{table_id}")
def delete_table(restaurant_id: str, table_id: str, db: Session = Depends(get_db),
                  current_user: m.User = Depends(require_role("owner", "admin"))):
    restaurant = RestaurantRepository(db).get(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    _check_ownership(db, current_user, restaurant)

    repo = TableRepository(db)
    table = repo.get(table_id)
    if not table or table.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Table not found")
    repo.delete(table)
    return {"message": "Table deleted"}
