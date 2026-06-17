"""
Простая авторизация: email + пароль.
Без JWT и токенов — после успешного логина фронтенд просто хранит
employee_id в памяти (React state) и передаёт его как обычный query-параметр,
как уже делается для bookings (employee_id=1).

Это сознательно упрощённая схема для внутреннего корпоративного инструмента,
а не публичного сервиса — приемлемо для MVP.

Используем библиотеку bcrypt напрямую (без passlib) — меньше проблем
с автоопределением backend-версии и совместимостью.
"""
import bcrypt


def hash_password(plain_password: str) -> str:
    """Хеширует пароль перед сохранением в БД."""
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Сравнивает введённый пароль с хешем из БД."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
