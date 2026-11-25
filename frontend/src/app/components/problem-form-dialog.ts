import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ESTADOS, Estado, PLATAFORMAS, Problem, ProblemInput } from '../models/problem';
import { LocationService } from '../services/location.service';

@Component({
  selector: 'app-problem-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar problema' : 'Nuevo problema' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Título</mat-label>
          <input matInput formControlName="titulo" />
          @if (form.controls.titulo.hasError('required')) {
            <mat-error>El título es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Plataforma</mat-label>
          <mat-select formControlName="plataforma">
            @for (p of plataformas; track p) {
              <mat-option [value]="p">{{ p }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Dificultad (rating)</mat-label>
          <input matInput type="number" formControlName="dificultad" />
          @if (form.controls.dificultad.invalid) {
            <mat-error>Debe estar entre 0 y 4000</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="estado" (selectionChange)="onEstadoChange($event.value)">
            @for (e of estados; track e) {
              <mat-option [value]="e">{{ e }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (form.controls.estado.value === 'Resuelto') {
          <div class="location-section">
            <mat-form-field appearance="outline" class="location-field">
              <mat-label>Ubicación donde se resolvió</mat-label>
              <input
                matInput
                formControlName="solved_location"
                placeholder="Ej: Biblioteca UCN, Coquimbo"
              />
              @if (solvedLat() !== null && solvedLng() !== null) {
                <mat-hint>GPS: {{ solvedLat() }}, {{ solvedLng() }}</mat-hint>
              }
              @if (form.controls.solved_location.hasError('maxlength')) {
                <mat-error>Máximo 150 caracteres</mat-error>
              }
            </mat-form-field>

            <div class="location-actions">
              <button
                mat-stroked-button
                type="button"
                (click)="captureLocation()"
                [disabled]="capturingLocation()"
              >
                <mat-icon>my_location</mat-icon>
                {{ capturingLocation() ? 'Obteniendo GPS...' : 'Usar GPS' }}
              </button>

              @if (form.controls.solved_location.value || solvedLat() !== null) {
                <button mat-button type="button" (click)="clearLocation()">
                  Limpiar
                </button>
              }
            </div>

            @if (locationError()) {
              <p class="location-error">{{ locationError() }}</p>
            }
          </div>
        }

        <mat-form-field appearance="outline">
          <mat-label>Tag (tema)</mat-label>
          <input matInput formControlName="tag" placeholder="Ej: DP, Grafos, Greedy" />
          @if (form.controls.tag.hasError('maxlength')) {
            <mat-error>Máximo 50 caracteres</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>URL</mat-label>
          <input matInput formControlName="url" placeholder="https://..." />
          @if (form.controls.url.invalid) {
            <mat-error>Debe comenzar con http:// o https://</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button (click)="save()" [disabled]="capturingLocation()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .form { display: flex; flex-direction: column; min-width: 280px; }
    .location-section { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    .location-field { width: 100%; }
    .location-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .location-error { margin: 0; font-size: 12px; color: #c62828; }
  `,
})
export class ProblemFormDialog {
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<ProblemFormDialog>);
  private locationService = inject(LocationService);
  data = inject<Problem | null>(MAT_DIALOG_DATA);

  plataformas = PLATAFORMAS;
  estados = ESTADOS;

  capturingLocation = signal(false);
  locationError = signal<string | null>(null);
  solvedLat = signal<number | null>(this.data?.solved_lat ?? null);
  solvedLng = signal<number | null>(this.data?.solved_lng ?? null);

  form = this.fb.nonNullable.group({
    titulo: [this.data?.titulo ?? '', [Validators.required, Validators.maxLength(150)]],
    plataforma: [this.data?.plataforma ?? 'Codeforces', Validators.required],
    dificultad: [this.data?.dificultad ?? (null as number | null), [Validators.min(0), Validators.max(4000)]],
    estado: [(this.data?.estado ?? 'Pendiente') as Estado, Validators.required],
    solved_location: [this.data?.solved_location ?? '', [Validators.maxLength(150)]],
    tag: [this.data?.tag ?? '', [Validators.maxLength(50)]],
    url: [this.data?.url ?? '', Validators.pattern(/^(https?:\/\/.+)?$/)],
  });

  onEstadoChange(estado: Estado) {
    if (estado === 'Resuelto' && !this.form.controls.solved_location.value.trim() && this.solvedLat() === null) {
      void this.captureLocation();
    }
  }

  async captureLocation() {
    this.capturingLocation.set(true);
    this.locationError.set(null);

    try {
      const loc = await this.locationService.getCurrentLocation();
      this.solvedLat.set(loc.lat);
      this.solvedLng.set(loc.lng);
      this.form.controls.solved_location.setValue(loc.label);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo obtener la ubicación.';
      this.locationError.set(msg);
    } finally {
      this.capturingLocation.set(false);
    }
  }

  clearLocation() {
    this.solvedLat.set(null);
    this.solvedLng.set(null);
    this.locationError.set(null);
    this.form.controls.solved_location.setValue('');
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const isResolved = v.estado === 'Resuelto';
    const locationText = isResolved ? v.solved_location.trim() || null : null;

    const result: ProblemInput = {
      titulo: v.titulo,
      plataforma: v.plataforma,
      dificultad: v.dificultad,
      estado: v.estado,
      tag: v.tag.trim() || null,
      url: v.url.trim() || null,
      solved_location: locationText,
      solved_lat: isResolved && (locationText !== null || this.solvedLat() !== null) ? this.solvedLat() : null,
      solved_lng: isResolved && (locationText !== null || this.solvedLng() !== null) ? this.solvedLng() : null,
      solved_at: isResolved ? (this.data?.solved_at ?? null) : null,
    };
    this.ref.close(result);
  }
}