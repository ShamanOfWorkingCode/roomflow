from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..dependencies import get_db
from ..models.booking import Booking
from ..schemas.booking import (
    BookingCreate,
    BookingOut,
    BookingWithDetails,
    SlotStatus,
)
from ..services import (
    BookingConflictError,
    BookingNotFoundError,
    EmployeeNotFoundError,
    RoomNotFoundError,
    create_booking,
    cancel_booking,
    get_room_availability,
    send_booking_notification,
)

router = APIRouter(prefix="/bookings", tags=["Бронирование"])


@router.get("/availability", response_model=list[SlotStatus])
async def check_availability(
    room_id: int,
    booking_date: date,
    db: AsyncSession = Depends(get_db),
):
    """
    Проверить доступность слотов комнаты на дату.
    Возвращает список часов с пометкой is_free и именем занявшего.
    """
    return await get_room_availability(db, room_id, booking_date)


@router.post("/", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def book_room(
    data: BookingCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Создать бронь.

    - Если слот свободен → фиксирует в БД, запускает фоновое уведомление.
    - Если слот занят → возвращает 409 Conflict с подсказкой.
    """
    try:
        booking = await create_booking(db, data)
    except BookingConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except (RoomNotFoundError, EmployeeNotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    # Фоновая задача FastAPI — уведомление после ответа клиенту
    background_tasks.add_task(send_booking_notification, booking.id)

    return booking


@router.get("/", response_model=list[BookingWithDetails])
async def list_bookings(
    room_id: int | None = None,
    employee_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Список броней с фильтрами."""
    q = (
        select(Booking)
        .options(selectinload(Booking.room), selectinload(Booking.employee))
        .where(Booking.status == "confirmed")
    )
    if room_id:
        q = q.where(Booking.room_id == room_id)
    if employee_id:
        q = q.where(Booking.employee_id == employee_id)
    if date_from:
        q = q.where(Booking.booking_date >= date_from)
    if date_to:
        q = q.where(Booking.booking_date <= date_to)

    result = await db.execute(q.order_by(Booking.booking_date, Booking.hour))
    bookings = result.scalars().all()

    return [
        BookingWithDetails(
            **BookingOut.model_validate(b).model_dump(),
            room_name=b.room.name,
            employee_name=b.employee.full_name,
            department=b.employee.department,
        )
        for b in bookings
    ]


@router.get("/{booking_id}", response_model=BookingWithDetails)
async def get_booking(booking_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Booking)
        .options(selectinload(Booking.room), selectinload(Booking.employee))
        .where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Бронь не найдена")
    return BookingWithDetails(
        **BookingOut.model_validate(booking).model_dump(),
        room_name=booking.room.name,
        employee_name=booking.employee.full_name,
        department=booking.employee.department,
    )


@router.delete("/{booking_id}", status_code=status.HTTP_200_OK)
async def cancel(
    booking_id: int,
    employee_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Отменить бронь (только владелец)."""
    try:
        await cancel_booking(db, booking_id, employee_id)
    except BookingNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return {"detail": "Бронь отменена"}
