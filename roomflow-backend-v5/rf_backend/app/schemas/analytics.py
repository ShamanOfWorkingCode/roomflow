from pydantic import BaseModel


class RoomPopularity(BaseModel):
    room_id: int
    room_name: str
    total_bookings: int
    occupancy_rate: float  # % от всех возможных слотов


class HourStat(BaseModel):
    hour: int
    total_bookings: int


class DepartmentStat(BaseModel):
    department: str
    total_bookings: int


class AnalyticsReport(BaseModel):
    period_start: str
    period_end: str
    total_bookings: int
    room_popularity: list[RoomPopularity]
    hour_stats: list[HourStat]
    department_stats: list[DepartmentStat]
