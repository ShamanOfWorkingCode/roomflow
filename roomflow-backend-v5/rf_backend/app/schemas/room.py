from pydantic import BaseModel, Field


# --- Room ---

class RoomBase(BaseModel):
    name: str = Field(..., max_length=100, examples=["Переговорная Альфа"])
    capacity: int = Field(..., ge=1, le=100)
    floor: int = Field(..., ge=1)
    features: str = Field(default="", examples=["Проектор, ТВ, Whiteboard"])


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    name: str | None = None
    capacity: int | None = None
    floor: int | None = None
    features: str | None = None
    is_active: bool | None = None


class RoomOut(RoomBase):
    id: int
    is_active: bool

    model_config = {"from_attributes": True}


# --- Employee ---

class EmployeeBase(BaseModel):
    full_name: str = Field(..., max_length=150)
    email: str = Field(..., max_length=150)
    department: str = Field(..., max_length=100, examples=["IT"])


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeOut(EmployeeBase):
    id: int

    model_config = {"from_attributes": True}
