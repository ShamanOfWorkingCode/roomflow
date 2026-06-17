from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..dependencies import get_db
from ..models.task import Task
from ..models.employee import Employee
from ..schemas.task import TaskCreate, TaskOut, TaskWithEmployee

router = APIRouter(prefix="/tasks", tags=["Личные задачи"])


@router.get("/", response_model=list[TaskWithEmployee])
async def list_tasks(
    date_from: date | None = None,
    date_to: date | None = None,
    employee_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Список личных задач за период (по умолчанию — текущий месяц).
    Видны все сотрудники — используется для общего календаря.
    """
    if not date_from:
        date_from = date.today().replace(day=1)
    if not date_to:
        next_month = date_from.replace(day=28) + timedelta(days=4)
        date_to = next_month - timedelta(days=next_month.day)

    q = (
        select(Task)
        .options(selectinload(Task.employee))
        .where(Task.date >= date_from, Task.date <= date_to)
    )
    if employee_id:
        q = q.where(Task.employee_id == employee_id)

    result = await db.execute(q.order_by(Task.date, Task.hour))
    tasks = result.scalars().all()

    return [
        TaskWithEmployee(
            **TaskOut.model_validate(t).model_dump(),
            employee_name=t.employee.full_name,
            department=t.employee.department,
        )
        for t in tasks
    ]


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(data: TaskCreate, db: AsyncSession = Depends(get_db)):
    """Создать личную задачу — заметку «у меня в этот день другие дела»."""
    employee = await db.get(Employee, data.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")

    task = Task(**data.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
async def delete_task(task_id: int, employee_id: int, db: AsyncSession = Depends(get_db)):
    """Удалить задачу — только её владелец."""
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    if task.employee_id != employee_id:
        raise HTTPException(status_code=403, detail="Нельзя удалить чужую задачу")

    await db.delete(task)
    await db.commit()
    return {"detail": "Задача удалена"}
