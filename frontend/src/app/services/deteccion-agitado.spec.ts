import { DetectorAgitado, intensidadMovimiento } from './deteccion-agitado';

describe('Detección de agitado', () => {
  it('calcula la intensidad en los tres ejes', () => {
    expect(intensidadMovimiento({ x: 3, y: 4, z: 0 })).toBe(5);
  });
  it('no interpreta la gravedad en reposo como movimiento', () => {
    expect(intensidadMovimiento(null, { x: 0, y: 0, z: 9.81 })).toBe(0);
  });
  it('rechaza datos ausentes o inválidos', () => {
    expect(intensidadMovimiento({ x: null, y: 0, z: 0 })).toBeNull();
    expect(intensidadMovimiento({ x: NaN, y: 0, z: 0 })).toBeNull();
  });
  it('ignora movimientos suaves y exige una nueva sacudida', () => {
    const detector = new DetectorAgitado();
    expect(detector.detectar(3, 0)).toBe(false);
    expect(detector.detectar(16, 100)).toBe(true);
    expect(detector.detectar(20, 2100)).toBe(false);
    expect(detector.detectar(0, 2200)).toBe(false);
    expect(detector.detectar(17, 2300)).toBe(true);
  });
  it('respeta la pausa entre sorteos incluso al cambiar de movimiento', () => {
    const detector = new DetectorAgitado();
    expect(detector.detectar(17, 0)).toBe(true);
    detector.detectar(0, 100);
    expect(detector.detectar(18, 500)).toBe(false);
    detector.detectar(0, 600);
    expect(detector.detectar(18, 1800)).toBe(true);
  });
  it('también respeta la pausa después del sorteo manual', () => {
    const detector = new DetectorAgitado();
    detector.registrarSorteo(0);
    expect(detector.detectar(20, 200)).toBe(false);
    detector.detectar(0, 300);
    expect(detector.detectar(20, 1800)).toBe(true);
  });
});
