// Magnitudes en m/s² y tiempos en milisegundos.
export interface VectorAceleracion {
  x: number | null;
  y: number | null;
  z: number | null;
}

function magnitud(vector?: VectorAceleracion | null): number | null {
  if (!vector || typeof vector.x !== 'number' || typeof vector.y !== 'number' ||
      typeof vector.z !== 'number' || ![vector.x, vector.y, vector.z].every(Number.isFinite)) {
    return null;
  }
  return Math.hypot(vector.x, vector.y, vector.z);
}

export function intensidadMovimiento(
  aceleracion?: VectorAceleracion | null,
  conGravedad?: VectorAceleracion | null,
): number | null {
  const sinGravedad = magnitud(aceleracion);
  if (sinGravedad !== null) return sinGravedad;
  const total = magnitud(conGravedad);
  return total === null ? null : Math.abs(total - 9.81);
}

export class DetectorAgitado {
  private ultimoSorteo = -Infinity;
  private preparado = true;

  constructor(private readonly umbral = 15, private readonly pausa = 1800) {}

  detectar(intensidad: number, instante: number): boolean {
    if (intensidad < this.umbral * 0.5) this.preparado = true;
    if (intensidad < this.umbral || !this.preparado) return false;
    this.preparado = false;
    if (instante - this.ultimoSorteo < this.pausa) return false;
    this.ultimoSorteo = instante;
    return true;
  }

  registrarSorteo(instante: number): void {
    this.ultimoSorteo = instante;
  }
}
