from datetime import date
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    employee_id: int
    date: date
    hour: int = Field(..., ge=0, le=23, description="Час начала задачи")
    duration_hours: int = Field(default=1, ge=1, le=12, description="Длительность в часах")
    title: str = Field(..., max_length=255, examples=["Встреча с клиентом"])


class TaskOut(BaseModel):
    id: int
    employee_id: int
    date: date
    hour: int
    duration_hours: int
    title: str

    model_config = {"from_attributes": True}


class TaskWithEmployee(TaskOut):
    employee_name: str
    department: str
