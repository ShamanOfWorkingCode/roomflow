from datetime import date
from pydantic import BaseModel, Field, model_validator


class BookingCreate(BaseModel):
    room_id: int
    employee_id: int
    booking_date: date
    hour: int = Field(..., ge=9, le=18, description="Час бронирования (9–18)")

    @model_validator(mode="after")
    def validate_date(self) -> "BookingCreate":
        if self.booking_date < date.today():
            raise ValueError("Нельзя бронировать прошедшую дату")
        return self


class BookingOut(BaseModel):
    id: int
    room_id: int
    employee_id: int
    booking_date: date
    hour: int
    status: str
    notification_sent: bool

    model_config = {"from_attributes": True}


class BookingWithDetails(BookingOut):
    room_name: str
    employee_name: str
    department: str


class AvailabilityQuery(BaseModel):
    room_id: int
    booking_date: date


class SlotStatus(BaseModel):
    hour: int
    is_free: bool
    booked_by: str | None = None  # имя сотрудника если занято
