from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

Estado = Literal["Pendiente", "Intentando", "Resuelto"]


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class ProblemBase(BaseModel):
    titulo: str = Field(min_length=1, max_length=150)
    plataforma: str = Field(min_length=1, max_length=50)
    dificultad: Optional[int] = Field(default=None, ge=0, le=4000)
    estado: Estado = "Pendiente"
    url: Optional[str] = Field(default=None, max_length=300)
    tag: Optional[str] = Field(default=None, max_length=50)
    solved_lat: Optional[float] = None
    solved_lng: Optional[float] = None
    solved_location: Optional[str] = Field(default=None, max_length=150)
    solved_at: Optional[datetime] = None


class ProblemCreate(ProblemBase):
    pass


class ProblemUpdate(ProblemBase):
    titulo: Optional[str] = Field(default=None, min_length=1, max_length=150)
    plataforma: Optional[str] = Field(default=None, min_length=1, max_length=50)
    dificultad: Optional[int] = Field(default=None, ge=0, le=4000)
    estado: Optional[Estado] = None
    url: Optional[str] = Field(default=None, max_length=300)
    tag: Optional[str] = Field(default=None, max_length=50)
    solved_lat: Optional[float] = None
    solved_lng: Optional[float] = None
    solved_location: Optional[str] = Field(default=None, max_length=150)
    solved_at: Optional[datetime] = None


class ProblemOut(ProblemBase):
    id: int
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class ListaEntrenamientoCrear(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    nombre: str = Field(min_length=1, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    ids_problemas: list[int] = Field(min_length=1, max_length=100)


class ProblemaListaEntrenamientoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    titulo: str
    plataforma: str
    dificultad: Optional[int]
    url: Optional[str]
    tag: Optional[str]


class ListaEntrenamientoRespuesta(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str]
    autor: str
    problemas: list[ProblemaListaEntrenamientoRespuesta]
    url_datos_qr: str


class ListaEntrenamientoImportar(BaseModel):
    ids_problemas: list[int] = Field(min_length=1, max_length=100)


class ListaEntrenamientoImportacionRespuesta(BaseModel):
    importados: int
    omitidos: int