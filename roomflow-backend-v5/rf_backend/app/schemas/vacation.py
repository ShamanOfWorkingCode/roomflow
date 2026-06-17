from datetime import date
from pydantic import BaseModel, Field, field_validator


VALID_TYPES = {"vacation", "sick", "remote", "dayoff"}


class VacationCreate(BaseModel):
    employee_id: int
    dates: list[date] = Field(..., min_length=1, description="Список дат отсутствия")
    type: str = Field(default="vacation")
    note: str = Field(default="", max_length=255)

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in VALID_TYPES:
            raise ValueError(f"type должен быть одним из {VALID_TYPES}")
        return v


class VacationOut(BaseModel):
    id: int
    employee_id: int
    date: date
    type: str
    note: str

    model_config = {"from_attributes": True}


class VacationWithEmployee(VacationOut):
    employee_name: str
    department: str
