import { Component, computed, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ProblemsService } from '../services/problems.service';
import { ESTADOS, PLATAFORMAS, Problem, ProblemInput } from '../models/problem';
import { ProblemFormDialog } from '../components/problem-form-dialog';
import { ConfirmDialog } from '../components/confirm-dialog';
import { RetosAleatoriosDialog, ResultadoRetos } from '../components/retos-aleatorios-dialog';

@Component({
  selector: 'app-problems-page',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-grid">
      <h1 class="page-title">Mis problemas</h1>

      <div class="page-actions">
        <button mat-stroked-button (click)="abrirRetosAleatorios()">
          <mat-icon>shuffle</mat-icon> Retos aleatorios
        </button>
        <button mat-flat-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Agregar
        </button>
      </div>

      <aside class="sidebar-filters">
        <mat-accordion>
          <mat-expansion-panel expanded="true" class="custom-panel">
            <mat-expansion-panel-header>
              <mat-panel-title class="filter-title">Plataforma</mat-panel-title>
            </mat-expansion-panel-header>
            <div class="filter-options">
              <mat-checkbox
                [checked]="plataforma() === ''"
                (change)="$event.checked ? plataforma.set('') : null">
                Todas
              </mat-checkbox>
              @for (p of plataformas; track p) {
                <mat-checkbox
                  [checked]="plataforma() === p"
                  (change)="$event.checked ? plataforma.set(p) : plataforma.set('')">
                  {{ p }}
                </mat-checkbox>
              }
            </div>
          </mat-expansion-panel>

          <mat-expansion-panel class="custom-panel">
            <mat-expansion-panel-header>
              <mat-panel-title class="filter-title">Estado</mat-panel-title>
            </mat-expansion-panel-header>
            <div class="filter-options">
              <mat-checkbox
                [checked]="estado() === ''"
                (change)="$event.checked ? estado.set('') : null">
                Todos
              </mat-checkbox>
              @for (e of estados; track e) {
                <mat-checkbox
                  [checked]="estado() === e"
                  (change)="$event.checked ? estado.set(e) : estado.set('')">
                  {{ e }}
                </mat-checkbox>
              }
            </div>
          </mat-expansion-panel>

          <mat-expansion-panel class="custom-panel">
            <mat-expansion-panel-header>
              <mat-panel-title class="filter-title">Tag</mat-panel-title>
            </mat-expansion-panel-header>
            <div class="filter-options">
              <mat-checkbox
                [checked]="tag() === ''"
                (change)="$event.checked ? tag.set('') : null">
                Todos
              </mat-checkbox>
              @for (t of tags.value() ?? []; track t) {
                <mat-checkbox
                  [checked]="tag() === t"
                  (change)="$event.checked ? tag.set(t) : tag.set('')">
                  {{ t }}
                </mat-checkbox>
              }
            </div>
          </mat-expansion-panel>
        </mat-accordion>

        <button class="btn-yellow" (click)="plataforma.set(''); estado.set(''); tag.set('')">
          Limpiar filtros
        </button>
      </aside>

      <main class="main-content">
        @if (problems.isLoading()) {
          <div class="center"><mat-spinner diameter="40" /></div>
        } @else if (problems.error()) {
          <p class="center">No se pudieron cargar los problemas.</p>
        } @else if (problems.value()?.length === 0) {
          <p class="center">No hay problemas con estos filtros. ¡Agrega el primero!</p>
        } @else {
          <div class="table-wrap mat-elevation-z2">
            <table mat-table [dataSource]="problems.value() ?? []">
              <ng-container matColumnDef="titulo">
                <th mat-header-cell *matHeaderCellDef>Título</th>
                <td mat-cell *matCellDef="let p">
                  @if (p.url) { <a [href]="p.url" target="_blank">{{ p.titulo }}</a> }
                  @else { <span>{{ p.titulo }}</span> }
                </td>
              </ng-container>

              <ng-container matColumnDef="plataforma">
                <th mat-header-cell *matHeaderCellDef>Plataforma</th>
                <td mat-cell *matCellDef="let p">{{ p.plataforma }}</td>
              </ng-container>

              <ng-container matColumnDef="dificultad">
                <th mat-header-cell *matHeaderCellDef>Dificultad</th>
                <td mat-cell *matCellDef="let p">{{ p.dificultad ?? '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="tag">
                <th mat-header-cell *matHeaderCellDef>Tag</th>
                <td mat-cell *matCellDef="let p">{{ p.tag ?? '-' }}</td>
              </ng-container>

              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let p">
                  <div>{{ p.estado }}</div>
                  @if (p.estado === 'Resuelto' && p.solved_at) {
                    <div class="solved-date">{{ formatDate(p.solved_at) }}</div>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="ubicacion">
                <th mat-header-cell *matHeaderCellDef>Ubicación</th>
                <td mat-cell *matCellDef="let p">
                  @if (p.solved_location) {
                    <span class="location-cell">
                      <mat-icon class="loc-icon">location_on</mat-icon>
                      <span>{{ p.solved_location }}</span>
                    </span>
                  } @else {
                    <span>-</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let p" class="actions-cell">
                  <button mat-icon-button color="primary" (click)="openForm(p)"><mat-icon>edit</mat-icon></button>
                  <button mat-icon-button color="warn" (click)="remove(p)"><mat-icon>delete</mat-icon></button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>
        }
      </main>

      <aside class="right-sidebar">
        <div class="timeline-widget">
          <h3 class="timeline-header">Actividad reciente</h3>

          <div class="timeline">
            @for (act of actividadReciente(); track act.id) {
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <span class="timeline-time">{{ act.tiempo }}</span>
                  <p class="timeline-text">
                    {{ act.accion }}: <strong>{{ act.titulo }}</strong> en {{ act.plataforma }}
                  </p>
                  @if (act.ubicacion) {
                    <p class="timeline-location">
                      <mat-icon class="loc-icon">location_on</mat-icon>
                      {{ act.ubicacion }}
                    </p>
                  }
                </div>
              </div>
            }
          </div>

          <a href="#" class="timeline-link">Ver todo el historial &rarr;</a>
        </div>
      </aside>
    </div>
  `,
  styleUrl: './problems-page.css',
})
export class ProblemsPage {
  private service = inject(ProblemsService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private router = inject(Router);

  plataforma = signal('');
  estado = signal('');
  tag = signal('');

  plataformas = PLATAFORMAS;
  estados = ESTADOS;
  columns = ['titulo', 'plataforma', 'dificultad', 'tag', 'estado', 'ubicacion', 'acciones'];

  problems = this.service.listResource(() => ({
    plataforma: this.plataforma(),
    estado: this.estado(),
    tag: this.tag(),
  }));
  tags = this.service.tagsResource();

  actividadReciente = computed(() => {
    const todosLosProblemas = this.problems.value() ?? [];
    const ultimos = [...todosLosProblemas].reverse().slice(0, 5);

    return ultimos.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      plataforma: p.plataforma,
      accion: p.estado === 'Resuelto' ? 'Resuelto' : 'Agregado',
      ubicacion: p.solved_location ?? null,
      tiempo:
        p.estado === 'Resuelto' && p.solved_at
          ? this.formatDate(p.solved_at)
          : p.estado === 'Resuelto'
            ? '¡Completado!'
            : 'Agregado',
    }));
  });

  formatDate(iso?: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  abrirRetosAleatorios() {
    this.dialog
      .open<RetosAleatoriosDialog, void, ResultadoRetos>(RetosAleatoriosDialog, {
        width: '420px',
        maxWidth: 'calc(100vw - 32px)',
      })
      .afterClosed()
      .subscribe((resultado) => {
        this.problems.reload();
        if (resultado?.accion === 'agregar') this.openForm();
        if (resultado?.accion === 'listas') void this.router.navigate(['/listas']);
        if (resultado?.accion === 'resolver') this.openForm(resultado.problema, true);
      });
  }

  openForm(problem?: Problem, resolver = false) {
    const referencia = this.dialog.open(ProblemFormDialog, { data: problem ?? null });
    if (resolver && problem) {
      referencia.componentInstance.form.controls.estado.setValue('Resuelto');
      referencia.componentInstance.onEstadoChange('Resuelto');
    }
    referencia.afterClosed().subscribe((value?: ProblemInput) => {
      if (!value) return;
      const request$ = problem
        ? this.service.update(problem.id, value)
        : this.service.create(value);
      request$.subscribe({
        next: () => {
          this.snack.open(problem ? 'Problema actualizado' : 'Problema agregado', 'OK', { duration: 3000 });
          this.problems.reload();
          this.tags.reload();
        },
        error: () => this.snack.open('Error al guardar', 'Cerrar', { duration: 4000 }),
      });
    });
  }

  remove(problem: Problem) {
    this.dialog
      .open(ConfirmDialog, { data: `¿Eliminar "${problem.titulo}"?` })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.service.remove(problem.id).subscribe({
          next: () => {
            this.snack.open('Problema eliminado', 'OK', { duration: 3000 });
            this.problems.reload();
            this.tags.reload();
          },
          error: () => this.snack.open('Error al eliminar', 'Cerrar', { duration: 4000 }),
        });
      });
  }
}