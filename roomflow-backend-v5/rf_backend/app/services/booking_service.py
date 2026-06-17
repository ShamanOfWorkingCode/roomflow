from datetime import date

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.booking import Booking
from ..models.room import Room
from ..models.employee import Employee
from ..schemas.booking import BookingCreate, SlotStatus

WORKING_HOURS = list(range(9, 19))  # 9:00–18:00


class BookingConflictError(Exception):
    """Слот уже занят."""


class BookingNotFoundError(Exception):
    """Бронь не найдена."""


class RoomNotFoundError(Exception):
    """Комната не найдена."""


class EmployeeNotFoundError(Exception):
    """Сотрудник не найден."""


async def get_room_availability(
    db: AsyncSession,
    room_id: int,
    booking_date: date,
) -> list[SlotStatus]:
    """
    Возвращает статус каждого рабочего часа для комнаты на дату.
    Читает из PostgreSQL без блокировки — только для отображения.
    """
    result = await db.execute(
        select(Booking, Employee.full_name)
        .join(Employee, Booking.employee_id == Employee.id)
        .where(
            Booking.room_id == room_id,
            Booking.booking_date == booking_date,
            Booking.status == "confirmed",
        )
    )
    booked = {row.Booking.hour: row.full_name for row in result}

    return [
        SlotStatus(
            hour=h,
            is_free=(h not in booked),
            booked_by=booked.get(h),
        )
        for h in WORKING_HOURS
    ]


async def create_booking(
    db: AsyncSession,
    data: BookingCreate,
) -> Booking:
    """
    Создаёт бронь с защитой от гонки через SELECT FOR UPDATE.

    Алгоритм:
    1. Проверяем существование комнаты и сотрудника.
    2. SELECT FOR UPDATE — блокируем строку (или убеждаемся что её нет).
    3. Если слот свободен — INSERT.
    4. Если слот занят — бросаем BookingConflictError.
    5. UniqueConstraint в БД — последний рубеж защиты.
    """
    # Проверяем комнату
    room = await db.get(Room, data.room_id)
    if not room or not room.is_active:
        raise RoomNotFoundError(f"Комната {data.room_id} не найдена или неактивна")

    # Проверяем сотрудника
    employee = await db.get(Employee, data.employee_id)
    if not employee:
        raise EmployeeNotFoundError(f"Сотрудник {data.employee_id} не найден")

    # SELECT FOR UPDATE — блокируем строку на время транзакции
    existing = await db.execute(
        select(Booking)
        .where(
            Booking.room_id == data.room_id,
            Booking.booking_date == data.booking_date,
            Booking.hour == data.hour,
            Booking.status == "confirmed",
        )
        .with_for_update()
    )
    conflict = existing.scalar_one_or_none()

    if conflict:
        raise BookingConflictError(
            f"Слот {data.hour}:00 в комнате «{room.name}» "
            f"на {data.booking_date} уже занят. Выберите другое время."
        )

    booking = Booking(
        room_id=data.room_id,
        employee_id=data.employee_id,
        booking_date=data.booking_date,
        hour=data.hour,
        status="confirmed",
    )
    db.add(booking)

    try:
        await db.commit()
        await db.refresh(booking)
    except IntegrityError:
        await db.rollback()
        raise BookingConflictError(
            f"Слот {data.hour}:00 был занят параллельным запросом. Попробуйте ещё раз."
        )

    return booking


async def cancel_booking(
    db: AsyncSession,
    booking_id: int,
    employee_id: int,
) -> Booking:
    """Отменяет бронь. Только владелец может отменить."""
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise BookingNotFoundError(f"Бронь {booking_id} не найдена")
    if booking.employee_id != employee_id:
        raise PermissionError("Нельзя отменить чужую бронь")

    booking.status = "cancelled"
    await db.commit()
    await db.refresh(booking)
    return booking
