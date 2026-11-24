import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { Problem, ProblemInput } from '../models/problem';
import { AgitadoService } from '../services/agitado.service';
import { ProblemsService } from '../services/problems.service';
import { problemasDisponibles, sortearProblema } from './sorteo-reto';

export type ResultadoRetos = { accion: 'agregar' | 'listas' } | { accion: 'resolver'; problema: Problem };

@Component({
  selector: 'app-retos-aleatorios-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  providers: [AgitadoService],
  templateUrl: './retos-aleatorios-dialog.html',
  styleUrl: './retos-aleatorios-dialog.css',
})
export class RetosAleatoriosDialog {
  private servicio = inject(ProblemsService);
  private referencia = inject<MatDialogRef<RetosAleatoriosDialog, ResultadoRetos>>(MatDialogRef);
  private destruccion = inject(DestroyRef);
  readonly sensor = inject(AgitadoService);
  readonly problemas = this.servicio.listResource(() => ({ plataforma: '', estado: '' }));
  readonly disponibles = computed(() => problemasDisponibles(this.problemas.hasValue() ? this.problemas.value() : []));
  readonly reto = signal<Problem | null>(null);
  readonly aceptado = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly urlReto = computed(() => {
    const url = this.reto()?.url;
    return url && /^https?:\/\//i.test(url) ? url : null;
  });

  constructor() {
    void this.sensor.iniciar(() => this.sortear());
    this.referencia.beforeClosed().pipe(takeUntilDestroyed(this.destruccion)).subscribe(() => this.sensor.detener());
  }

  activarSensor(): void {
    void this.sensor.iniciar(() => this.sortear(), true);
  }

  sortear(manual = false): void {
    if (this.guardando() || this.problemas.isLoading() || this.problemas.error()) return;
    if (!this.disponibles().length) return;
    if (manual) this.sensor.registrarSorteoManual();
    this.error.set('');
    this.aceptado.set(false);
    this.reto.set(sortearProblema(this.disponibles(), this.reto()?.id));
  }

  async aceptar(): Promise<void> {
    const reto = this.reto();
    if (!reto || this.aceptado() || this.guardando()) return;
    this.guardando.set(true);
    this.referencia.disableClose = true;
    this.error.set('');
    try {
      // Consultar el estado actual evita aceptar un problema ya resuelto desde otra sesión.
      const actual = await firstValueFrom(this.servicio.obtenerPorId(reto.id));
      if (actual.estado === 'Resuelto') {
        this.reto.set(null);
        this.problemas.reload();
        this.error.set('Este problema ya está resuelto. Sortea otro reto.');
        return;
      }
      if (actual.estado === 'Pendiente') {
        // PUT recibe el problema completo, no solo el estado.
        const { id, ...datos } = actual;
        const cambio: ProblemInput = { ...datos, estado: 'Intentando' };
        this.reto.set(await firstValueFrom(this.servicio.update(id, cambio)));
      } else {
        this.reto.set(actual);
      }
      this.aceptado.set(true);
      this.problemas.reload();
    } catch {
      this.error.set('No se pudo aceptar el reto. Comprueba tu conexión e inténtalo nuevamente.');
    } finally {
      this.guardando.set(false);
      this.referencia.disableClose = false;
    }
  }

  resolver(): void {
    const problema = this.reto();
    if (problema && this.aceptado() && !this.guardando()) {
      this.referencia.close({ accion: 'resolver', problema });
    }
  }

  salir(accion: 'agregar' | 'listas'): void {
    if (!this.guardando()) this.referencia.close({ accion });
  }
}
