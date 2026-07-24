from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import models as m


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> m.User | None:
        return self.db.query(m.User).filter(m.User.email == email).first()

    def get_by_id(self, user_id: str) -> m.User | None:
        return self.db.query(m.User).filter(m.User.id == user_id).first()

    def create(self, user: m.User) -> m.User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: m.User) -> m.User:
        self.db.commit()
        self.db.refresh(user)
        return user

    def list_all(self, skip: int = 0, limit: int = 50):
        return self.db.query(m.User).offset(skip).limit(limit).all()


class OwnerProfileRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(self, user_id: str) -> m.OwnerProfile | None:
        return self.db.query(m.OwnerProfile).filter(m.OwnerProfile.user_id == user_id).first()

    def create(self, profile: m.OwnerProfile) -> m.OwnerProfile:
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile


class RestaurantRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, restaurant: m.Restaurant) -> m.Restaurant:
        self.db.add(restaurant)
        self.db.commit()
        self.db.refresh(restaurant)
        return restaurant

    def get(self, restaurant_id: str) -> m.Restaurant | None:
        return self.db.query(m.Restaurant).filter(m.Restaurant.id == restaurant_id).first()

    def list_by_owner(self, owner_id: str):
        return self.db.query(m.Restaurant).filter(m.Restaurant.owner_id == owner_id).all()

    def search(self, city: str | None = None, cuisine: str | None = None,
               query: str | None = None, only_approved: bool = True,
               skip: int = 0, limit: int = 20):
        q = self.db.query(m.Restaurant)
        if only_approved:
            q = q.filter(m.Restaurant.status == m.RestaurantStatus.approved)
        if city:
            q = q.filter(m.Restaurant.city.ilike(f"%{city}%"))
        if cuisine:
            q = q.filter(m.Restaurant.cuisine.ilike(f"%{cuisine}%"))
        if query:
            q = q.filter(m.Restaurant.name.ilike(f"%{query}%"))
        return q.offset(skip).limit(limit).all()

    def list_pending(self):
        return self.db.query(m.Restaurant).filter(m.Restaurant.status == m.RestaurantStatus.pending).all()

    def list_all(self):
        return self.db.query(m.Restaurant).all()

    def update(self, restaurant: m.Restaurant) -> m.Restaurant:
        self.db.commit()
        self.db.refresh(restaurant)
        return restaurant

    def delete(self, restaurant: m.Restaurant):
        self.db.delete(restaurant)
        self.db.commit()

    def recompute_rating(self, restaurant_id: str):
        avg, count = self.db.query(
            func.avg(m.Review.rating), func.count(m.Review.id)
        ).filter(m.Review.restaurant_id == restaurant_id).first()
        restaurant = self.get(restaurant_id)
        if restaurant:
            restaurant.avg_rating = round(avg or 0, 2)
            restaurant.review_count = count or 0
            self.db.commit()


class TableRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, table: m.RestaurantTable) -> m.RestaurantTable:
        self.db.add(table)
        self.db.commit()
        self.db.refresh(table)
        return table

    def get(self, table_id: str) -> m.RestaurantTable | None:
        return self.db.query(m.RestaurantTable).filter(m.RestaurantTable.id == table_id).first()

    def list_by_restaurant(self, restaurant_id: str):
        return self.db.query(m.RestaurantTable).filter(m.RestaurantTable.restaurant_id == restaurant_id).all()

    def update(self, table: m.RestaurantTable) -> m.RestaurantTable:
        self.db.commit()
        self.db.refresh(table)
        return table

    def delete(self, table: m.RestaurantTable):
        self.db.delete(table)
        self.db.commit()


class ReservationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, reservation: m.Reservation) -> m.Reservation:
        self.db.add(reservation)
        self.db.commit()
        self.db.refresh(reservation)
        return reservation

    def get(self, reservation_id: str) -> m.Reservation | None:
        return self.db.query(m.Reservation).filter(m.Reservation.id == reservation_id).first()

    def list_by_user(self, user_id: str):
        return self.db.query(m.Reservation).filter(m.Reservation.user_id == user_id)\
            .order_by(m.Reservation.reservation_date.desc()).all()

    def list_by_restaurant(self, restaurant_id: str):
        return self.db.query(m.Reservation).filter(m.Reservation.restaurant_id == restaurant_id)\
            .order_by(m.Reservation.reservation_date.desc()).all()

    def find_conflicting(self, table_id: str, reservation_date, reservation_time):
        return self.db.query(m.Reservation).filter(
            m.Reservation.table_id == table_id,
            m.Reservation.reservation_date == reservation_date,
            m.Reservation.reservation_time == reservation_time,
            m.Reservation.status.in_([m.ReservationStatus.pending, m.ReservationStatus.confirmed]),
        ).first()

    def update(self, reservation: m.Reservation) -> m.Reservation:
        self.db.commit()
        self.db.refresh(reservation)
        return reservation

    def list_all(self):
        return self.db.query(m.Reservation).order_by(m.Reservation.created_at.desc()).all()


class FavoriteRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: str, restaurant_id: str) -> m.Favorite | None:
        return self.db.query(m.Favorite).filter(
            m.Favorite.user_id == user_id, m.Favorite.restaurant_id == restaurant_id
        ).first()

    def list_by_user(self, user_id: str):
        return self.db.query(m.Favorite).filter(m.Favorite.user_id == user_id).all()

    def create(self, favorite: m.Favorite) -> m.Favorite:
        self.db.add(favorite)
        self.db.commit()
        self.db.refresh(favorite)
        return favorite

    def delete(self, favorite: m.Favorite):
        self.db.delete(favorite)
        self.db.commit()


class ReviewRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, review: m.Review) -> m.Review:
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def list_by_restaurant(self, restaurant_id: str):
        return self.db.query(m.Review).filter(m.Review.restaurant_id == restaurant_id)\
            .order_by(m.Review.created_at.desc()).all()

    def get_by_user_restaurant(self, user_id: str, restaurant_id: str):
        return self.db.query(m.Review).filter(
            m.Review.user_id == user_id, m.Review.restaurant_id == restaurant_id
        ).first()


class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, notification: m.Notification) -> m.Notification:
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def list_by_user(self, user_id: str):
        return self.db.query(m.Notification).filter(m.Notification.user_id == user_id)\
            .order_by(m.Notification.created_at.desc()).all()

    def mark_read(self, notification: m.Notification):
        notification.is_read = True
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def mark_all_read(self, user_id: str):
        self.db.query(m.Notification).filter(
            m.Notification.user_id == user_id, m.Notification.is_read == False  # noqa: E712
        ).update({"is_read": True})
        self.db.commit()
