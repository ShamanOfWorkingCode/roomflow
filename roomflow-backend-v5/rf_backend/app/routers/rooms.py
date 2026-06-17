from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_db
from ..models.room import Room
from ..models.employee import Employee
from ..schemas.room import RoomCreate, RoomUpdate, RoomOut, EmployeeCreate, EmployeeOut

router = APIRouter(prefix="/rooms", tags=["Комнаты"])
employees_router = APIRouter(prefix="/employees", tags=["Сотрудники"])


# --- Rooms ---

@router.get("/", response_model=list[RoomOut])
async def list_rooms(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """Список всех комнат."""
    q = select(Room)
    if active_only:
        q = q.where(Room.is_active == True)  # noqa: E712
    result = await db.execute(q.order_by(Room.floor, Room.name))
    return result.scalars().all()


@router.post("/", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
async def create_room(data: RoomCreate, db: AsyncSession = Depends(get_db)):
    """Добавить новую комнату."""
    room = Room(**data.model_dump())
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room


@router.get("/{room_id}", response_model=RoomOut)
async def get_room(room_id: int, db: AsyncSession = Depends(get_db)):
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    return room


@router.patch("/{room_id}", response_model=RoomOut)
async def update_room(room_id: int, data: RoomUpdate, db: AsyncSession = Depends(get_db)):
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(room, field, value)
    await db.commit()
    await db.refresh(room)
    return room


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_room(room_id: int, db: AsyncSession = Depends(get_db)):
    """Деактивировать комнату (мягкое удаление)."""
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Комната не найдена")
    room.is_active = False
    await db.commit()


# --- Employees ---

@employees_router.get("/", response_model=list[EmployeeOut])
async def list_employees(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Employee).order_by(Employee.full_name))
    return result.scalars().all()


# Регистрация сотрудника перенесена в /auth/register — там пароль
# хешируется перед сохранением. Создание без пароля здесь больше не допускается.


@employees_router.get("/{employee_id}", response_model=EmployeeOut)
async def get_employee(employee_id: int, db: AsyncSession = Depends(get_db)):
    emp = await db.get(Employee, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    return emp
