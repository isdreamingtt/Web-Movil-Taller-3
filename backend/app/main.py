import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.database import Base, engine
from app.models import models
from app.routers import auth, problems, listas_entrenamiento

DEFAULT_CORS_ORIGINS = (
    "http://localhost:4200,"
    "https://localhost,"
    "http://localhost,"
    "capacitor://localhost"
)


def _ensure_problems_columns() -> None:
    statements = [
        "ALTER TABLE problems ADD COLUMN IF NOT EXISTS tag VARCHAR(50)",
        "ALTER TABLE problems ADD COLUMN IF NOT EXISTS solved_lat DOUBLE PRECISION",
        "ALTER TABLE problems ADD COLUMN IF NOT EXISTS solved_lng DOUBLE PRECISION",
        "ALTER TABLE problems ADD COLUMN IF NOT EXISTS solved_location VARCHAR(150)",
        "ALTER TABLE problems ADD COLUMN IF NOT EXISTS solved_at TIMESTAMPTZ",
        "ALTER TABLE problems ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
    ]
    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    _ensure_problems_columns()
    yield


cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]

app = FastAPI(title="ICPC Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
@app.get("/health")
def health():
    return {"status": "ok", "service": "ICPC Tracker API"}


app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(listas_entrenamiento.router)