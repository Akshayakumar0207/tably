from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models as m
from app.repositories.repositories import UserRepository
from app.schemas import schemas as s
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=s.UserOut)
def get_profile(current_user: m.User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=s.UserOut)
def update_profile(payload: s.UserUpdate, db: Session = Depends(get_db),
                    current_user: m.User = Depends(get_current_user)):
    repo = UserRepository(db)
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone is not None:
        current_user.phone = payload.phone
    return repo.update(current_user)


@router.put("/me/picture", response_model=s.UserOut)
def update_profile_picture(payload: s.ImageUpload, db: Session = Depends(get_db),
                            current_user: m.User = Depends(get_current_user)):
    """
    Accepts a compressed data-URL image from the frontend (see README -
    'Image uploads'). No external storage service required.
    """
    repo = UserRepository(db)
    current_user.profile_picture_url = payload.url
    return repo.update(current_user)
