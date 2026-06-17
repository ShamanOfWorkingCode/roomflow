from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_db
from ..models.booking import Booking
from ..models.room import Room
from ..models.employee import Employee
from ..schemas.analytics import (
    AnalyticsReport,
    DepartmentStat,
    HourStat,
    RoomPopularity,
)

router = APIRouter(prefix="/analytics", tags=["Аналитика"])

WORKING_HOURS = list(range(9, 19))  # 10 слотов в день


@router.get("/report", response_model=AnalyticsReport)
async def get_report(
    date_from: date = None,
    date_to: date = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Полный отчёт за период:
    - Рейтинг популярности комнат
    - Статистика по часам (пиковое время)
    - Активность по отделам
    """
    if not date_from:
        date_from = date.today() - timedelta(days=30)
    if not date_to:
        date_to = date.today()

    base_filter = [
        Booking.status == "confirmed",
        Booking.booking_date >= date_from,
        Booking.booking_date <= date_to,
    ]

    # Общее количество броней
    total_q = await db.execute(
        select(func.count(Booking.id)).where(*base_filter)
    )
    total = total_q.scalar() or 0

    # Рейтинг комнат
    days_count = (date_to - date_from).days + 1
    max_slots_per_room = days_count * len(WORKING_HOURS)

    room_q = await db.execute(
        select(Room.id, Room.name, func.count(Booking.id).label("cnt"))
        .outerjoin(Booking, (Booking.room_id == Room.id) & Booking.status == "confirmed"
                   & (Booking.booking_date >= date_from) & (Booking.booking_date <= date_to))
        .group_by(Room.id, Room.name)
        .order_by(func.count(Booking.id).desc())
    )
    rooms = room_q.all()
    room_popularity = [
        RoomPopularity(
            room_id=r.id,
            room_name=r.name,
            total_bookings=r.cnt,
            occupancy_rate=round(r.cnt / max_slots_per_room * 100, 1) if max_slots_per_room else 0,
        )
        for r in rooms
    ]

    # Статистика по часам
    hour_q = await db.execute(
        select(Booking.hour, func.count(Booking.id).label("cnt"))
        .where(*base_filter)
        .group_by(Booking.hour)
        .order_by(Booking.hour)
    )
    hour_map = {row.hour: row.cnt for row in hour_q}
    hour_stats = [
        HourStat(hour=h, total_bookings=hour_map.get(h, 0))
        for h in WORKING_HOURS
    ]

    # Статистика по отделам
    dept_q = await db.execute(
        select(Employee.department, func.count(Booking.id).label("cnt"))
        .join(Booking, Booking.employee_id == Employee.id)
        .where(*base_filter)
        .group_by(Employee.department)
        .order_by(func.count(Booking.id).desc())
    )
    dept_stats = [
        DepartmentStat(department=row.department, total_bookings=row.cnt)
        for row in dept_q
    ]

    return AnalyticsReport(
        period_start=str(date_from),
        period_end=str(date_to),
        total_bookings=total,
        room_popularity=room_popularity,
        hour_stats=hour_stats,
        department_stats=dept_stats,
    )
