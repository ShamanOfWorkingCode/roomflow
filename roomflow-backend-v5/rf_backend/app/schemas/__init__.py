from .room import RoomCreate, RoomUpdate, RoomOut, EmployeeCreate, EmployeeOut
from .booking import BookingCreate, BookingOut, BookingWithDetails, SlotStatus, AvailabilityQuery
from .analytics import AnalyticsReport, RoomPopularity, HourStat, DepartmentStat
from .auth import RegisterRequest, LoginRequest, AuthEmployeeOut
from .vacation import VacationCreate, VacationOut, VacationWithEmployee
from .task import TaskCreate, TaskOut, TaskWithEmployee

__all__ = [
    "RoomCreate", "RoomUpdate", "RoomOut",
    "EmployeeCreate", "EmployeeOut",
    "BookingCreate", "BookingOut", "BookingWithDetails", "SlotStatus", "AvailabilityQuery",
    "AnalyticsReport", "RoomPopularity", "HourStat", "DepartmentStat",
    "RegisterRequest", "LoginRequest", "AuthEmployeeOut",
    "VacationCreate", "VacationOut", "VacationWithEmployee",
    "TaskCreate", "TaskOut", "TaskWithEmployee",
]
