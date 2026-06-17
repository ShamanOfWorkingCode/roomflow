from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base
from .routers import (
    rooms_router,
    employees_router,
    bookings_router,
    analytics_router,
    auth_router,
    calendar_router,
    tasks_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создаём таблицы при старте (в проде используйте Alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="Система бронирования переговорных комнат",
    version="1.2.0",
    lifespan=lifespan,
)

# CORS — фронтенд на другом порту (Vite, localhost:3000) должен достучаться до API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # для разработки; в проде указать конкретный домен фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(rooms_router)
app.include_router(employees_router)
app.include_router(bookings_router)
app.include_router(analytics_router)
app.include_router(calendar_router)
app.include_router(tasks_router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "app": settings.APP_NAME}
