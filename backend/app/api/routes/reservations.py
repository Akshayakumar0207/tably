from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models as m
from app.repositories.repositories import ReservationRepository, TableRepository, RestaurantRepository, \
    OwnerProfileRepository
from app.schemas import schemas as s
from app.api.deps import get_current_user, require_role
from app.services.notification_service import notify

router = APIRouter(prefix="/api/reservations", tags=["Reservations"])


@router.post("", response_model=s.ReservationOut, status_code=201)
def create_reservation(payload: s.ReservationCreate, db: Session = Depends(get_db),
                        current_user: m.User = Depends(get_current_user)):
    table_repo = TableRepository(db)
    restaurant_repo = RestaurantRepository(db)
    reservation_repo = ReservationRepository(db)

    table = table_repo.get(payload.table_id)
    if not table or table.restaurant_id != payload.restaurant_id:
        raise HTTPException(status_code=404, detail="Table not found for this restaurant")
    if table.status == m.TableStatus.disabled:
        raise HTTPException(status_code=400, detail="This table is disabled and cannot be booked")
    if payload.guest_count > table.capacity:
        raise HTTPException(status_code=400, detail=f"Table capacity is {table.capacity}, exceeds guest count")

    restaurant = restaurant_repo.get(payload.restaurant_id)
    if not restaurant or restaurant.status != m.RestaurantStatus.approved:
        raise HTTPException(status_code=404, detail="Restaurant not available for booking")

    if reservation_repo.find_conflicting(payload.table_id, payload.reservation_date, payload.reservation_time):
        raise HTTPException(status_code=409, detail="This table is already booked for the selected date/time")

    reservation = m.Reservation(
        user_id=current_user.id,
        restaurant_id=payload.restaurant_id,
        table_id=payload.table_id,
        reservation_date=payload.reservation_date,
        reservation_time=payload.reservation_time,
        guest_count=payload.guest_count,
        special_request=payload.special_request,
        status=m.ReservationStatus.pending,
    )
    reservation = reservation_repo.create(reservation)

    # Mark table as reserved-soon so the floor map reflects it live.
    table.status = m.TableStatus.reserved_soon
    table_repo.update(table)

    notify(db, current_user.id, "Reservation Requested",
           f"Your table request at {restaurant.name} for {payload.reservation_date} {payload.reservation_time} "
           f"has been submitted and is awaiting confirmation.",
           m.NotificationType.booking_confirmation)

    owner_profile = restaurant.owner
    if owner_profile:
        notify(db, owner_profile.user_id, "New Reservation Request",
               f"{current_user.full_name} requested table {table.table_number} at {restaurant.name} "
               f"for {payload.reservation_date} {payload.reservation_time}.",
               m.NotificationType.owner_alert)

    return reservation


@router.get("/my", response_model=list[s.ReservationOut])
def my_reservations(db: Session = Depends(get_db), current_user: m.User = Depends(get_current_user)):
    return ReservationRepository(db).list_by_user(current_user.id)


@router.get("/{reservation_id}", response_model=s.ReservationOut)
def get_reservation(reservation_id: str, db: Session = Depends(get_db),
                     current_user: m.User = Depends(get_current_user)):
    reservation = ReservationRepository(db).get(reservation_id)
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if reservation.user_id != current_user.id and current_user.role == m.UserRole.customer:
        raise HTTPException(status_code=403, detail="Not authorized to view this reservation")
    return reservation


@router.put("/{reservation_id}", response_model=s.ReservationOut)
def modify_reservation(reservation_id: str, payload: s.ReservationUpdate, db: Session = Depends(get_db),
                        current_user: m.User = Depends(get_current_user)):
    repo = ReservationRepository(db)
    reservation = repo.get(reservation_id)
    if not reservation or reservation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if reservation.status not in (m.ReservationStatus.pending, m.ReservationStatus.confirmed):
        raise HTTPException(status_code=400, detail="Only pending or confirmed reservations can be modified")

    if payload.reservation_date:
        reservation.reservation_date = payload.reservation_date
    if payload.reservation_time:
        reservation.reservation_time = payload.reservation_time
    if payload.guest_count:
        reservation.guest_count = payload.guest_count
    if payload.table_id:
        reservation.table_id = payload.table_id

    reservation = repo.update(reservation)
    notify(db, current_user.id, "Reservation Updated",
           "Your reservation details have been updated.", m.NotificationType.booking_confirmation)
    return reservation


@router.post("/{reservation_id}/cancel", response_model=s.ReservationOut)
def cancel_reservation(reservation_id: str, db: Session = Depends(get_db),
                        current_user: m.User = Depends(get_current_user)):
    repo = ReservationRepository(db)
    table_repo = TableRepository(db)
    reservation = repo.get(reservation_id)
    if not reservation or reservation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Reservation not found")
    if reservation.status in (m.ReservationStatus.cancelled, m.ReservationStatus.completed):
        raise HTTPException(status_code=400, detail="Reservation cannot be cancelled")

    reservation.status = m.ReservationStatus.cancelled
    reservation = repo.update(reservation)

    table = table_repo.get(reservation.table_id)
    if table and table.status != m.TableStatus.disabled:
        table.status = m.TableStatus.available
        table_repo.update(table)

    notify(db, current_user.id, "Reservation Cancelled",
           "Your reservation has been cancelled successfully.", m.NotificationType.booking_confirmation)
    return reservation


# ---------- Owner-side reservation management ----------
@router.get("/owner/restaurant/{restaurant_id}", response_model=list[s.ReservationOut])
def owner_view_reservations(restaurant_id: str, db: Session = Depends(get_db),
                             current_user: m.User = Depends(require_role("owner", "admin"))):
    restaurant = RestaurantRepository(db).get(restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    if current_user.role == m.UserRole.owner:
        owner_profile = OwnerProfileRepository(db).get_by_user_id(current_user.id)
        if not owner_profile or restaurant.owner_id != owner_profile.id:
            raise HTTPException(status_code=403, detail="Not authorized for this restaurant")
    return ReservationRepository(db).list_by_restaurant(restaurant_id)


@router.put("/owner/{reservation_id}/status", response_model=s.ReservationOut)
def owner_update_status(reservation_id: str, payload: s.ReservationStatusUpdate, db: Session = Depends(get_db),
                         current_user: m.User = Depends(require_role("owner", "admin"))):
    repo = ReservationRepository(db)
    table_repo = TableRepository(db)
    reservation = repo.get(reservation_id)
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    restaurant = RestaurantRepository(db).get(reservation.restaurant_id)
    if current_user.role == m.UserRole.owner:
        owner_profile = OwnerProfileRepository(db).get_by_user_id(current_user.id)
        if not owner_profile or restaurant.owner_id != owner_profile.id:
            raise HTTPException(status_code=403, detail="Not authorized for this reservation")

    if payload.status not in ("confirmed", "rejected", "completed"):
        raise HTTPException(status_code=400, detail="status must be confirmed, rejected, or completed")

    reservation.status = m.ReservationStatus(payload.status)
    reservation = repo.update(reservation)

    table = table_repo.get(reservation.table_id)
    if table:
        if payload.status == "confirmed":
            table.status = m.TableStatus.occupied
        elif payload.status in ("rejected",):
            table.status = m.TableStatus.available
        elif payload.status == "completed":
            table.status = m.TableStatus.available
        table_repo.update(table)

    title_map = {
        "confirmed": "Reservation Confirmed",
        "rejected": "Reservation Rejected",
        "completed": "Reservation Completed",
    }
    notify(db, reservation.user_id, title_map[payload.status],
           f"Your reservation at {restaurant.name} has been {payload.status}.",
           m.NotificationType.booking_confirmation)
    return reservation
