from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_db
from ..models.employee import Employee
from ..schemas.auth import RegisterRequest, LoginRequest, AuthEmployeeOut
from ..services.auth_service import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Авторизация"])


@router.post("/register", response_model=AuthEmployeeOut, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Регистрация нового сотрудника.
    Пароль хешируется bcrypt перед сохранением — в открытом виде никогда не хранится.
    """
    existing = await db.execute(select(Employee).where(Employee.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email уже зарегистрирован")

    employee = Employee(
        full_name=data.full_name,
        email=data.email,
        department=data.department,
        password_hash=hash_password(data.password),
        is_manager=False,
    )
    db.add(employee)
    await db.commit()
    await db.refresh(employee)
    return employee


@router.post("/login", response_model=AuthEmployeeOut)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Простой логин: проверяем email + пароль.
    Без JWT — фронтенд хранит employee_id в памяти после успешного ответа.
    """
    result = await db.execute(select(Employee).where(Employee.email == data.email))
    employee = result.scalar_one_or_none()

    if not employee or not verify_password(data.password, employee.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    return employee
