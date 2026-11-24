import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../components/confirm-dialog';
import { ProblemsService } from '../services/problems.service';
import { ListaEntrenamiento, ListasEntrenamientoService } from '../services/listas-entrenamiento.service';
import { interpretarCodigoLista, EscanerQrService } from '../services/escaner-qr.service';

@Component({
  selector: 'app-listas-entrenamiento-page',
  imports: [FormsModule, RouterLink, MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './listas-entrenamiento-page.html',
  styleUrl: './listas-entrenamiento-page.css',
})
export class ListasEntrenamientoPage {
  private servicio = inject(ListasEntrenamientoService);
  private dialogo = inject(MatDialog);
  escaner = inject(EscanerQrService);
  problemas = inject(ProblemsService).listResource(() => ({ plataforma: '', estado: '' }));
  listas = signal<ListaEntrenamiento[]>([]);
  listaActiva = signal<ListaEntrenamiento | null>(null);
  vistaPrevia = signal<ListaEntrenamiento | null>(null);
  seleccionados = signal<number[]>([]);
  porImportar = signal<number[]>([]);
  ocupado = signal(false);
  cargando = signal(false);
  errorListas = signal('');
  mensaje = signal('');
  error = signal('');
  nombre = '';
  descripcion = '';
  codigo = '';

  constructor() { void this.cargarListas(); }

  private textoError(err: unknown, alternativa: string): string {
    if (err instanceof HttpErrorResponse) {
      return typeof err.error?.detail === 'string' ? err.error.detail : alternativa;
    }
    return alternativa;
  }

  async cargarListas() {
    this.cargando.set(true);
    this.errorListas.set('');
    try { this.listas.set(await firstValueFrom(this.servicio.obtenerPropias())); }
    catch (err) { this.errorListas.set(this.textoError(err, 'No se pudieron cargar tus listas.')); }
    finally { this.cargando.set(false); }
  }

  alternarSeleccion(seleccion: typeof this.seleccionados, id: number, marcado: boolean) {
    seleccion.update(ids => marcado ? [...new Set([...ids, id])] : ids.filter(x => x !== id));
  }

  private iniciarOperacion() { this.ocupado.set(true); this.error.set(''); this.mensaje.set(''); }

  async crear() {
    if (this.ocupado() || !this.nombre.trim() || !this.seleccionados().length) return;
    this.iniciarOperacion();
    try {
      const lista = await firstValueFrom(this.servicio.crear(this.nombre.trim(), this.descripcion.trim(), this.seleccionados()));
      this.listaActiva.set(lista);
      this.nombre = ''; this.descripcion = ''; this.seleccionados.set([]);
      this.mensaje.set('Lista creada. Muestra el QR a otro usuario.');
      await this.cargarListas();
    } catch (err) { this.error.set(this.textoError(err, 'No se pudo crear la lista.')); }
    finally { this.ocupado.set(false); }
  }

  async eliminar(lista: ListaEntrenamiento) {
    if (this.ocupado()) return;
    const confirmado = await firstValueFrom(this.dialogo.open(ConfirmDialog, { data: `¿Eliminar "${lista.nombre}"? Su QR dejará de funcionar.` }).afterClosed());
    if (!confirmado || this.ocupado()) return;
    this.iniciarOperacion();
    try {
      await firstValueFrom(this.servicio.eliminar(lista.codigo));
      if (this.listaActiva()?.codigo === lista.codigo) this.listaActiva.set(null);
      if (this.vistaPrevia()?.codigo === lista.codigo) this.vistaPrevia.set(null);
      this.mensaje.set('Lista eliminada. Los problemas ya importados se conservan.');
      await this.cargarListas();
    } catch (err) { this.error.set(this.textoError(err, 'No se pudo eliminar la lista.')); }
    finally { this.ocupado.set(false); }
  }

  private async cargarVistaPrevia(entrada: string) {
    this.vistaPrevia.set(null); this.porImportar.set([]);
    const codigo = interpretarCodigoLista(entrada);
    if (!codigo) { this.error.set('El código no corresponde a una lista de ICPC Tracker.'); return; }
    const lista = await firstValueFrom(this.servicio.consultar(codigo));
    this.codigo = codigo;
    this.vistaPrevia.set(lista);
    this.porImportar.set(lista.problemas.map(p => p.id));
  }

  async consultar() {
    if (this.ocupado()) return;
    this.iniciarOperacion();
    try { await this.cargarVistaPrevia(this.codigo); }
    catch (err) { this.error.set(this.textoError(err, 'No se pudo consultar la lista. Revisa tu conexión.')); }
    finally { this.ocupado.set(false); }
  }

  async escanear() {
    if (this.ocupado()) return;
    this.iniciarOperacion();
    try {
      let valor: string | null;
      try { valor = await this.escaner.escanear(); }
      catch (err) {
        this.error.set(err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string' ? err.message : 'No se pudo acceder a la cámara.'));
        return;
      }
      if (valor !== null) await this.cargarVistaPrevia(valor);
    } catch (err) { this.error.set(this.textoError(err, 'No se pudo consultar la lista. Revisa tu conexión.')); }
    finally { this.ocupado.set(false); }
  }

  alternarTodos(lista: ListaEntrenamiento) {
    this.porImportar.set(this.porImportar().length === lista.problemas.length ? [] : lista.problemas.map(p => p.id));
  }

  async importarSeleccion() {
    const lista = this.vistaPrevia();
    if (!lista || !this.porImportar().length || this.ocupado()) return;
    this.iniciarOperacion();
    try {
      const resultado = await firstValueFrom(this.servicio.importar(lista.codigo, this.porImportar()));
      this.mensaje.set(`Importados: ${resultado.importados}. Omitidos por duplicado: ${resultado.omitidos}.`);
      this.vistaPrevia.set(null); this.porImportar.set([]);
      this.problemas.reload();
    } catch (err) { this.error.set(this.textoError(err, 'No se pudieron importar los problemas.')); }
    finally { this.ocupado.set(false); }
  }
}
