import logging
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.booking import Booking
from ..database import AsyncSessionLocal

logger = logging.getLogger(__name__)


async def send_booking_notification(booking_id: int) -> None:
    """
    Фоновая задача FastAPI BackgroundTasks.
    Фиксирует уведомление в системе после успешного бронирования.

    В реальном проекте здесь: email / Telegram / Slack.
    Сейчас: логирование + обновление флага notification_sent в БД.
    """
    async with AsyncSessionLocal() as db:
        try:
            booking = await db.get(Booking, booking_id)
            if not booking:
                logger.warning("Notification: booking %s not found", booking_id)
                return

            # === Место для реального уведомления ===
            # await email_client.send(
            #     to=booking.employee.email,
            #     subject=f"Бронь подтверждена: {booking.room.name}",
            #     body=f"Дата: {booking.booking_date}, Время: {booking.hour}:00",
            # )

            logger.info(
                "Уведомление отправлено: booking_id=%s room_id=%s date=%s hour=%s",
                booking.id,
                booking.room_id,
                booking.booking_date,
                booking.hour,
            )

            booking.notification_sent = True
            await db.commit()

        except Exception as exc:
            logger.error("Ошибка отправки уведомления для booking %s: %s", booking_id, exc)
