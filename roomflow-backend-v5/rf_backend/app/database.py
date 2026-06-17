from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import settings

# pool_size/max_overflow поддерживаются только пуловыми движками (asyncpg и т.п.).
# SQLite (aiosqlite) использует NullPool и не принимает эти параметры —
# поэтому передаём их только если строка подключения не на SQLite
# (удобно для локальной разработки/тестов без поднятого Postgres).
_engine_kwargs = {"echo": settings.DEBUG}
if not settings.DATABASE_URL.startswith("sqlite"):
    _engine_kwargs.update(pool_size=10, max_overflow=20)

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass
