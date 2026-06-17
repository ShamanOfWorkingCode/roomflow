"""
Скрипт для заполнения БД тестовыми данными.
Запуск: python seed.py

Тестовые учётные данные для входа (все пароли: "12345"):
  a.kozlov@alfa.ru     — Алексей Козлов, IT
  m.vasileva@alfa.ru   — Марина Васильева, HR (офис-менеджер)
  d.smirnov@alfa.ru    — Дмитрий Смирнов, Маркетинг
  o.tihonova@alfa.ru   — Ольга Тихонова, Продажи
  i.petrov@alfa.ru     — Иван Петров, IT
  s.rybina@alfa.ru     — Светлана Рыбина, Финансы
"""
import asyncio
from datetime import date, timedelta

from app.database import AsyncSessionLocal, engine, Base
from app.models import Room, Employee, Booking, Vacation
from app.services.auth_service import hash_password


ROOMS = [
    Room(name='Переговорная "Альфа"', capacity=8,  floor=3, features="Проектор, ТВ, Whiteboard"),
    Room(name='Комната "Бета"',       capacity=4,  floor=3, features="ТВ, Whiteboard"),
    Room(name='Конф-зал "Гамма"',    capacity=20, floor=4, features="Проектор, ТВ, Видеосвязь"),
    Room(name='Кабинет "Дельта"',    capacity=6,  floor=4, features="ТВ"),
    Room(name='Мини "Эпсилон"',      capacity=3,  floor=5, features="Whiteboard"),
    Room(name='Зал "Зета"',          capacity=12, floor=5, features="Проектор, Видеосвязь"),
]

PASSWORD = "12345"  # единый тестовый пароль для всех демо-пользователей

EMPLOYEES = [
    Employee(full_name="Алексей Козлов",    email="a.kozlov@alfa.ru",    department="IT",
              password_hash=hash_password(PASSWORD), is_manager=False),
    Employee(full_name="Марина Васильева",  email="m.vasileva@alfa.ru",  department="HR",
              password_hash=hash_password(PASSWORD), is_manager=True),  # офис-менеджер
    Employee(full_name="Дмитрий Смирнов",  email="d.smirnov@alfa.ru",   department="Маркетинг",
              password_hash=hash_password(PASSWORD), is_manager=False),
    Employee(full_name="Ольга Тихонова",   email="o.tihonova@alfa.ru",  department="Продажи",
              password_hash=hash_password(PASSWORD), is_manager=False),
    Employee(full_name="Иван Петров",      email="i.petrov@alfa.ru",    department="IT",
              password_hash=hash_password(PASSWORD), is_manager=False),
    Employee(full_name="Светлана Рыбина",  email="s.rybina@alfa.ru",    department="Финансы",
              password_hash=hash_password(PASSWORD), is_manager=False),
]


async def seed():
    # Создаём таблицы если нет
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        for room in ROOMS:
            db.add(room)
        await db.flush()

        for emp in EMPLOYEES:
            db.add(emp)
        await db.flush()

        today = date.today()
        test_bookings = [
            Booking(room_id=1, employee_id=2, booking_date=today, hour=10),
            Booking(room_id=1, employee_id=3, booking_date=today, hour=14),
            Booking(room_id=3, employee_id=4, booking_date=today, hour=11),
            Booking(room_id=2, employee_id=5, booking_date=today, hour=9),
            Booking(room_id=4, employee_id=2, booking_date=today, hour=15),
        ]
        for b in test_bookings:
            db.add(b)

        # Тестовые отпуска/отсутствия в календаре
        vacations = [
            Vacation(employee_id=4, date=today, type="vacation", note="Ежегодный отпуск"),
            Vacation(employee_id=4, date=today + timedelta(days=1), type="vacation", note="Ежегодный отпуск"),
            Vacation(employee_id=4, date=today + timedelta(days=2), type="vacation", note="Ежегодный отпуск"),
            Vacation(employee_id=6, date=today, type="sick", note="Больничный"),
            Vacation(employee_id=5, date=today + timedelta(days=3), type="remote", note="Удалённая работа"),
        ]
        for v in vacations:
            db.add(v)

        await db.commit()
        print("✅ База заполнена тестовыми данными!")
        print(f"   Комнат: {len(ROOMS)}")
        print(f"   Сотрудников: {len(EMPLOYEES)}")
        print(f"   Броней: {len(test_bookings)}")
        print(f"   Записей в календаре: {len(vacations)}")
        print()
        print("Тестовый вход (пароль для всех: 12345):")
        for e in EMPLOYEES:
            role = " [офис-менеджер]" if e.is_manager else ""
            print(f"   {e.email}{role}")


if __name__ == "__main__":
    asyncio.run(seed())
