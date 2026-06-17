from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, Date, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .employee import Employee


class Vacation(Base):
    """
    Запись об отсутствии сотрудника в календаре.
    Один день = одна запись (упрощает запросы "кто отсутствует сегодня").
    """
    __tablename__ = "vacations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    date: Mapped["Date"] = mapped_column(Date, nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(20), default="vacation")  # vacation | sick | remote | dayoff
    note: Mapped[str] = mapped_column(String(255), default="")

    employee: Mapped["Employee"] = relationship("Employee", back_populates="vacations")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Vacation employee_id={self.employee_id} date={self.date} type={self.type}>"
