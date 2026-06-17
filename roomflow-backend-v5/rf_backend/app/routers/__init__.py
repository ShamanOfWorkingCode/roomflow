from .rooms import router as rooms_router, employees_router
from .bookings import router as bookings_router
from .analytics import router as analytics_router
from .auth import router as auth_router
from .calendar import router as calendar_router
from .task import router as tasks_router

__all__ = [
    "rooms_router", "employees_router", "bookings_router", "analytics_router",
    "auth_router", "calendar_router", "tasks_router",
]
