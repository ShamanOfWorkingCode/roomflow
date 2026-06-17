from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, Date, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

if TYPE_CHECKING:
    from .employee import Employee


class Task(Base):
    """
    Личная задача сотрудника в общем календаре — "у меня в этот день другие дела".
    В отличие от Vacation (отсутствие на весь день), у задачи есть конкретное
    время начала и длительность, как у брони комнаты.
    Видна всем сотрудникам (как и брони/отпуска) — общая прозрачность календаря.
    """
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    date: Mapped["Date"] = mapped_column(Date, nullable=False, index=True)
    hour: Mapped[int] = mapped_column(Integer, nullable=False)  # час начала, 0–23
    duration_hours: Mapped[int] = mapped_column(Integer, default=1)  # сколько часов занимает
    title: Mapped[str] = mapped_column(String(255), nullable=False)  # "Встреча с клиентом", "Дедлайн отчёта"

    employee: Mapped["Employee"] = relationship("Employee", back_populates="tasks")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Task employee_id={self.employee_id} date={self.date} hour={self.hour} title={self.title!r}>"
