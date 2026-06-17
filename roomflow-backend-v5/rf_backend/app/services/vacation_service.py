from datetime import date

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.vacation import Vacation
from ..models.employee import Employee


class VacationNotFoundError(Exception):
    """Запись об отсутствии не найдена."""


async def get_vacations_for_period(
    db: AsyncSession,
    date_from: date,
    date_to: date,
) -> list[Vacation]:
    """Все записи об отсутствии за период (для отрисовки календаря)."""
    result = await db.execute(
        select(Vacation)
        .where(Vacation.date >= date_from, Vacation.date <= date_to)
        .order_by(Vacation.date)
    )
    return list(result.scalars().all())


async def add_vacation_days(
    db: AsyncSession,
    employee_id: int,
    dates: list[date],
    vacation_type: str,
    note: str,
) -> list[Vacation]:
    """
    Добавляет одну или несколько дат отсутствия сотруднику.
    Если день уже отмечен — пропускаем (не дублируем).
    """
    existing = await db.execute(
        select(Vacation.date).where(
            Vacation.employee_id == employee_id,
            Vacation.date.in_(dates),
        )
    )
    existing_dates = {row[0] for row in existing.all()}

    created = []
    for d in dates:
        if d in existing_dates:
            continue
        v = Vacation(employee_id=employee_id, date=d, type=vacation_type, note=note)
        db.add(v)
        created.append(v)

    await db.commit()
    for v in created:
        await db.refresh(v)
    return created


async def remove_vacation_day(
    db: AsyncSession,
    employee_id: int,
    target_date: date,
    requester_id: int,
    requester_is_manager: bool,
) -> None:
    """
    Удаляет отметку об отсутствии на конкретную дату.
    Сотрудник может убрать только свою отметку; менеджер — любую.
    """
    if not requester_is_manager and requester_id != employee_id:
        raise PermissionError("Нельзя изменить отметку другого сотрудника")

    result = await db.execute(
        select(Vacation).where(
            Vacation.employee_id == employee_id,
            Vacation.date == target_date,
        )
    )
    vacation = result.scalar_one_or_none()
    if not vacation:
        raise VacationNotFoundError("Запись не найдена")

    await db.delete(vacation)
    await db.commit()
