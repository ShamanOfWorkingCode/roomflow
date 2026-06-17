from typing import TYPE_CHECKING
from datetime import date as Date
from sqlalchemy import Integer, ForeignKey, Date, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .room import Room
    from .employee import Employee


class Booking(Base):
    __tablename__ = "bookings"

    # Уникальность: одна комната — один час — одна дата
    __table_args__ = (
        UniqueConstraint("room_id", "booking_date", "hour", name="uq_room_date_hour"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id"), nullable=False, index=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    booking_date: Mapped[Date] = mapped_column(Date, nullable=False, index=True)
    hour: Mapped[int] = mapped_column(Integer, nullable=False)  # 9–18
    status: Mapped[str] = mapped_column(String(20), default="confirmed")  # confirmed | cancelled
    notification_sent: Mapped[bool] = mapped_column(default=False)

    room: Mapped["Room"] = relationship("Room", back_populates="bookings")  # noqa: F821
    employee: Mapped["Employee"] = relationship("Employee", back_populates="bookings")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Booking id={self.id} room={self.room_id} date={self.booking_date} hour={self.hour}>"
