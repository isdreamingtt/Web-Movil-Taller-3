import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from './api.config';
import { Problem } from '../models/problem';

export type ProblemaCompartido = Omit<Problem, 'estado'>;
export interface ListaEntrenamiento {
  codigo: string;
  nombre: string;
  descripcion: string | null;
  autor: string;
  problemas: ProblemaCompartido[];
  url_datos_qr: string;
}

@Injectable({ providedIn: 'root' })
export class ListasEntrenamientoService {
  private http = inject(HttpClient);
  private url = `${API_URL}/listas-entrenamiento`;
  obtenerPropias() { return this.http.get<ListaEntrenamiento[]>(this.url); }
  crear(nombre: string, descripcion: string, ids_problemas: number[]) {
    return this.http.post<ListaEntrenamiento>(this.url, { nombre, descripcion, ids_problemas });
  }
  consultar(codigo: string) { return this.http.get<ListaEntrenamiento>(`${this.url}/${codigo}`); }
  importar(codigo: string, ids_problemas: number[]) {
    return this.http.post<{ importados: number; omitidos: number }>(`${this.url}/${codigo}/importar`, { ids_problemas });
  }
  eliminar(codigo: string) { return this.http.delete<void>(`${this.url}/${codigo}`); }
}