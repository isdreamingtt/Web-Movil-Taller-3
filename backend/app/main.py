import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine
from app.models import models  # noqa: F401  (registra las tablas)
from app.routers import auth, problems

DEFAULT_CORS_ORIGINS = (
    "http://localhost:4200,"
    "https://localhost,"
    "http://localhost,"
    "capacitor://localhost"
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
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