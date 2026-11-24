import { Injectable, OnDestroy, signal } from '@angular/core';
import { PluginListenerHandle } from '@capacitor/core';
import { Motion } from '@capacitor/motion';
import { DetectorAgitado, intensidadMovimiento } from './deteccion-agitado';

type EstadoSensor = 'inactivo' | 'permiso' | 'comprobando' | 'activo' | 'no-disponible' | 'rechazado' | 'error';

type EventoMovimiento = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

// Una instancia por diálogo: no mantiene listeners globales entre vistas.
@Injectable()
export class AgitadoService implements OnDestroy {
  readonly estado = signal<EstadoSensor>('inactivo');
  private escucha?: PluginListenerHandle;
  private espera?: ReturnType<typeof setTimeout>;
  private generacion = 0;
  private detector = new DetectorAgitado();

  async iniciar(alAgitar: () => void, solicitarPermiso = false): Promise<void> {
    this.detener();
    const generacion = this.generacion;
    if (typeof DeviceMotionEvent === 'undefined') {
      this.estado.set('no-disponible');
      return;
    }
    const evento = DeviceMotionEvent as EventoMovimiento;
    try {
      if (typeof evento.requestPermission === 'function') {
        if (!solicitarPermiso) {
          this.estado.set('permiso');
          return;
        }
        const permiso = await evento.requestPermission();
        if (generacion !== this.generacion) return;
        if (permiso !== 'granted') {
          this.estado.set('rechazado');
          return;
        }
      }
      this.estado.set('comprobando');
      this.espera = setTimeout(() => {
        if (generacion !== this.generacion || this.estado() === 'activo') return;
        this.estado.set('no-disponible');
        // Se conserva la escucha: algunos dispositivos tardan en emitir datos.
      }, 2500);
      const escucha = await Motion.addListener('accel', datos => {
        if (generacion !== this.generacion || document.hidden) return;
        const intensidad = intensidadMovimiento(datos.acceleration, datos.accelerationIncludingGravity);
        if (intensidad === null) return;
        clearTimeout(this.espera);
        this.estado.set('activo');
        if (this.detector.detectar(intensidad, performance.now())) alAgitar();
      });
      // El diálogo puede haberse cerrado mientras se registraba el listener.
      if (generacion !== this.generacion) {
        await escucha.remove();
        return;
      }
      this.escucha = escucha;
    } catch {
      if (generacion !== this.generacion) return;
      clearTimeout(this.espera);
      this.estado.set('error');
    }
  }

  registrarSorteoManual(): void {
    this.detector.registrarSorteo(performance.now());
  }

  detener(): void {
    this.generacion++;
    clearTimeout(this.espera);
    if (this.escucha) {
      void this.escucha.remove().catch(() => undefined);
      this.escucha = undefined;
    }
    this.detector = new DetectorAgitado();
    this.estado.set('inactivo');
  }

  ngOnDestroy(): void {
    this.detener();
  }
}
