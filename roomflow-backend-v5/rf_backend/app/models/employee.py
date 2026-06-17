from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .booking import Booking
    from .vacation import Vacation
    from .task import Task



class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_manager: Mapped[bool] = mapped_column(Boolean, default=False)  # офис-менеджер видит/правит всех

    bookings: Mapped[list["Booking"]] = relationship(  # noqa: F821
        "Booking", back_populates="employee", cascade="all, delete-orphan"
    )
    vacations: Mapped[list["Vacation"]] = relationship(  # noqa: F821
        "Vacation", back_populates="employee", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(  # noqa: F821
        "Task", back_populates="employee", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Employee id={self.id} email={self.email!r}>"

