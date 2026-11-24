from typing import Optional
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))

    problems: Mapped[list["Problem"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )


class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(150))
    plataforma: Mapped[str] = mapped_column(String(50))
    dificultad: Mapped[Optional[int]] = mapped_column(nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="Pendiente")
    url: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    tag: Mapped[Optional[str]] = mapped_column(String(50), index=True, nullable=True)

    owner: Mapped["User"] = relationship(back_populates="problems")
    
class ListaEntrenamiento(Base):
    __tablename__ = "listas_entrenamiento"

    id: Mapped[int] = mapped_column(primary_key=True)
    codigo: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100))
    descripcion: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    propietario: Mapped["User"] = relationship()
    problemas: Mapped[list["ProblemaListaEntrenamiento"]] = relationship(
        back_populates="lista_entrenamiento", cascade="all, delete-orphan",
        order_by="ProblemaListaEntrenamiento.id",
    )

class ProblemaListaEntrenamiento(Base):
    __tablename__ = "problemas_lista_entrenamiento"

    id: Mapped[int] = mapped_column(primary_key=True)
    lista_id: Mapped[int] = mapped_column(ForeignKey("listas_entrenamiento.id"), index=True)
    titulo: Mapped[str] = mapped_column(String(150))
    plataforma: Mapped[str] = mapped_column(String(50))
    dificultad: Mapped[Optional[int]] = mapped_column(nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    tag: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    lista_entrenamiento: Mapped["ListaEntrenamiento"] = relationship(back_populates="problemas")