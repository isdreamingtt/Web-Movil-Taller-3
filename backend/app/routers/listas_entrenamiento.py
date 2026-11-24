import base64
from io import BytesIO
from uuid import uuid4

import qrcode
from qrcode.image.svg import SvgPathFillImage
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.models import Problem, ListaEntrenamiento, ProblemaListaEntrenamiento, User
from app.schemas.schemas import (ListaEntrenamientoCrear, ListaEntrenamientoImportar, ListaEntrenamientoImportacionRespuesta, ListaEntrenamientoRespuesta,)
from app.services.security import get_current_user

router = APIRouter(prefix="/listas-entrenamiento", tags=["listas-entrenamiento"])
PREFIJO_QR = "icpctracker:lista:"
CAMPOS_COPIA = ("titulo", "plataforma", "dificultad", "url", "tag")

def copiar_campos(problema):
    return {campo: getattr(problema, campo) for campo in CAMPOS_COPIA}

def serializar_lista(lista_entrenamiento: ListaEntrenamiento) -> ListaEntrenamientoRespuesta:
    buffer_qr = BytesIO()
    qrcode.make(PREFIJO_QR + lista_entrenamiento.codigo, image_factory=SvgPathFillImage).save(buffer_qr)
    qr = "data:image/svg+xml;base64," + base64.b64encode(buffer_qr.getvalue()).decode("ascii")
    return ListaEntrenamientoRespuesta(
        codigo = lista_entrenamiento.codigo, nombre = lista_entrenamiento.nombre,
        descripcion = lista_entrenamiento.descripcion, autor = lista_entrenamiento.propietario.username,
        problemas = lista_entrenamiento.problemas, url_datos_qr = qr,
    )
    
def obtener_lista_compartida(db: Session, codigo: str) -> ListaEntrenamiento:
    resultado = db.query(ListaEntrenamiento).filter_by(codigo=codigo).first()
    if resultado is None:
        raise HTTPException(404, "Lista no encontrada o eliminada")
    return resultado

def mismo_problema(a, b) -> bool:
    url_a, url_b = (a.url or "").strip(), (b.url or "").strip()
    if url_a and url_b:
        return url_a == url_b
    return (a.titulo.strip().casefold(), a.plataforma.strip().casefold()) == (
        b.titulo.strip().casefold(), b.plataforma.strip().casefold()
    )
    
@router.post("", response_model = ListaEntrenamientoRespuesta, status_code = 201)
def crear_lista(datos: ListaEntrenamientoCrear, db: Session = Depends(get_db),
                usuario: User = Depends(get_current_user)):
    
    ids = list(dict.fromkeys(datos.ids_problemas))
    problemas = db.query(Problem).filter(Problem.user_id == usuario.id, Problem.id.in_(ids)).all()
    porId = {problema.id: problema for problema in problemas}
    
    if len(porId) != len(ids):
        raise HTTPException(404, "Uno o más problemas no existen en tu registro")
    
    lista_entrenamiento = ListaEntrenamiento(codigo = uuid4().hex, nombre = datos.nombre,
                                             descripcion = datos.descripcion, user_id = usuario.id)
    
    lista_entrenamiento.problemas = [ProblemaListaEntrenamiento(**copiar_campos(porId[i])) for i in ids]
    db.add(lista_entrenamiento)
    db.commit()
    db.refresh(lista_entrenamiento)
    return serializar_lista(lista_entrenamiento)

@router.get("", response_model = list[ListaEntrenamientoRespuesta])
def obtener_listas_propias(db: Session = Depends(get_db), usuario: User = Depends(get_current_user)):
    return [serializar_lista(elemento) for elemento in db.query(ListaEntrenamiento).filter_by(user_id = usuario.id)
            .order_by(ListaEntrenamiento.id.desc()).all()]
    
@router.get("/{codigo}", response_model = ListaEntrenamientoRespuesta)
def consultar_lista(codigo: str, db: Session = Depends(get_db), usuario: User = Depends(get_current_user)):
    return serializar_lista(obtener_lista_compartida(db, codigo))
    
@router.post("/{codigo}/importar", response_model = ListaEntrenamientoImportacionRespuesta)
def importar_lista(codigo: str, datos: ListaEntrenamientoImportar, db: Session = Depends(get_db), usuario: User = Depends(get_current_user)):
    lista_entrenamiento = obtener_lista_compartida(db, codigo)
    porId = {problema.id: problema for problema in lista_entrenamiento.problemas}
    ids = list(dict.fromkeys(datos.ids_problemas))
    
    if any(i not in porId for i in ids):
        raise HTTPException(400, "Hay problemas que no pertenecen a esta lista")
    
    db.query(User).filter_by(id = usuario.id).with_for_update().one()
    existentes = db.query(Problem).filter_by(user_id = usuario.id).all()
    importados = omitidos = 0
    
    for i in ids:
        origen = porId[i]
        if any(mismo_problema(origen, elemento) for elemento in existentes):
            omitidos += 1
            continue
    
        problema = Problem(**copiar_campos(origen), estado = "Pendiente", user_id = usuario.id)
        db.add(problema)
        existentes.append(problema)
        importados += 1
    
    db.commit()
    return ListaEntrenamientoImportacionRespuesta(importados = importados, omitidos = omitidos)

@router.delete("/{codigo}", status_code = 204)
def eliminar_lista(codigo: str, db: Session = Depends(get_db), usuario: User = Depends(get_current_user)):
    lista_entrenamiento = obtener_lista_compartida(db, codigo)
    
    if lista_entrenamiento.user_id  != usuario.id:
        raise HTTPException(404, "Lista no encontrada")
    
    db.delete(lista_entrenamiento)
    db.commit()
    return Response(status_code = 204)
    