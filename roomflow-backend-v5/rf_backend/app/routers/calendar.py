from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..dependencies import get_db
from ..models.vacation import Vacation
from ..models.employee import Employee
from ..schemas.vacation import VacationCreate, VacationOut, VacationWithEmployee
from ..services.vacation_service import (
    add_vacation_days,
    remove_vacation_day,
    get_vacations_for_period,
    VacationNotFoundError,
)

router = APIRouter(prefix="/calendar", tags=["Календарь отсутствий"])


@router.get("/", response_model=list[VacationWithEmployee])
async def list_vacations(
    date_from: date | None = None,
    date_to: date | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Кто отсутствует за период (по умолчанию — текущий месяц).
    Используется для отрисовки календаря на главном экране.
    """
    if not date_from:
        date_from = date.today().replace(day=1)
    if not date_to:
        next_month = date_from.replace(day=28) + timedelta(days=4)
        date_to = next_month - timedelta(days=next_month.day)

    result = await db.execute(
        select(Vacation)
        .options(selectinload(Vacation.employee))
        .where(Vacation.date >= date_from, Vacation.date <= date_to)
        .order_by(Vacation.date)
    )
    vacations = result.scalars().all()

    return [
        VacationWithEmployee(
            **VacationOut.model_validate(v).model_dump(),
            employee_name=v.employee.full_name,
            department=v.employee.department,
        )
        for v in vacations
    ]


@router.post("/", response_model=list[VacationOut], status_code=status.HTTP_201_CREATED)
async def add_vacation(data: VacationCreate, db: AsyncSession = Depends(get_db)):
    """
    Отметить день(дни) отсутствия. Сотрудник может отмечать себе;
    офис-менеджер (is_manager) может отмечать любому — это решает фронтенд,
    передавая employee_id того, кому отмечают.
    """
    employee = await db.get(Employee, data.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")

    created = await add_vacation_days(db, data.employee_id, data.dates, data.type, data.note)
    return created


@router.delete("/{employee_id}/{target_date}", status_code=status.HTTP_200_OK)
async def delete_vacation(
    employee_id: int,
    target_date: date,
    requester_id: int,
    requester_is_manager: bool = False,
    db: AsyncSession = Depends(get_db),
):
    """Убрать отметку об отсутствии. Сотрудник — только свою, менеджер — любую."""
    try:
        await remove_vacation_day(db, employee_id, target_date, requester_id, requester_is_manager)
    except VacationNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return {"detail": "Отметка удалена"}


@router.get("/today", response_model=list[VacationWithEmployee])
async def who_is_out_today(db: AsyncSession = Depends(get_db)):
    """Кто отсутствует сегодня — для виджета на главном экране."""
    today = date.today()
    result = await db.execute(
        select(Vacation)
        .options(selectinload(Vacation.employee))
        .where(Vacation.date == today)
    )
    vacations = result.scalars().all()
    return [
        VacationWithEmployee(
            **VacationOut.model_validate(v).model_dump(),
            employee_name=v.employee.full_name,
            department=v.employee.department,
        )
        for v in vacations
    ]
