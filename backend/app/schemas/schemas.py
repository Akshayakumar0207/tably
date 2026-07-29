from datetime import datetime, date, time
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------- Auth / User ----------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    phone: Optional[str] = None
    role: str = "customer"  # customer | owner


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleLogin(BaseModel):
    id_token: str
    role: str = "customer"


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str
    profile_picture_url: Optional[str] = None
    is_verified: bool
    created_at: datetime


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


# ---------- Restaurant ----------
class RestaurantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    cuisine: str
    address: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    opening_time: time = time(9, 0)
    closing_time: time = time(22, 0)
    cover_image_url: Optional[str] = None


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cuisine: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    opening_time: Optional[time] = None
    closing_time: Optional[time] = None
    cover_image_url: Optional[str] = None


class RestaurantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    owner_id: str
    name: str
    description: Optional[str] = None
    cuisine: str
    address: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: Optional[str] = None
    opening_time: time
    closing_time: time
    status: str
    cover_image_url: Optional[str] = None
    avg_rating: float
    review_count: int
    created_at: datetime


class RestaurantImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    url: str


class ImageUpload(BaseModel):
    url: str


# ---------- Tables ----------
class TableCreate(BaseModel):
    table_number: str
    shape: str = "circle"
    capacity: int = Field(gt=0)
    pos_x: float = 0
    pos_y: float = 0
    width: float = 60
    height: float = 60
    is_window: bool = False
    is_ac: bool = True


class TableUpdate(BaseModel):
    table_number: Optional[str] = None
    shape: Optional[str] = None
    capacity: Optional[int] = None
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    is_window: Optional[bool] = None
    is_ac: Optional[bool] = None
    status: Optional[str] = None


class TableOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    restaurant_id: str
    table_number: str
    shape: str
    capacity: int
    pos_x: float
    pos_y: float
    width: float
    height: float
    is_window: bool
    is_ac: bool
    status: str


# ---------- Reservation ----------
class ReservationCreate(BaseModel):
    restaurant_id: str
    table_id: str
    reservation_date: date
    reservation_time: time
    guest_count: int = Field(gt=0)
    special_request: Optional[str] = None


class ReservationUpdate(BaseModel):
    reservation_date: Optional[date] = None
    reservation_time: Optional[time] = None
    guest_count: Optional[int] = None
    table_id: Optional[str] = None


class ReservationStatusUpdate(BaseModel):
    status: str


class ReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    restaurant_id: str
    table_id: str
    reservation_date: date
    reservation_time: time
    guest_count: int
    status: str
    special_request: Optional[str] = None
    created_at: datetime


# ---------- Review ----------
class ReviewCreate(BaseModel):
    restaurant_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    restaurant_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime


# ---------- Favorite ----------
class FavoriteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    restaurant_id: str


# ---------- Notification ----------
class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime


# ---------- Owner ----------
class OwnerProfileCreate(BaseModel):
    business_name: str
    business_phone: Optional[str] = None


class OwnerProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    business_name: str
    business_phone: Optional[str] = None
    is_verified: bool


# ---------- Admin ----------
class RestaurantApproval(BaseModel):
    status: str  # approved | rejected
