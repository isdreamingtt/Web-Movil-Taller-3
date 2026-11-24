import type { Problem } from '../models/problem';

export function problemasDisponibles(problemas: readonly Problem[]): Problem[] {
  return problemas.filter(p => p.estado === 'Pendiente' || p.estado === 'Intentando');
}

export function sortearProblema(problemas: readonly Problem[], anterior?: number): Problem | null {
  const disponibles = problemasDisponibles(problemas);
  const distintos = disponibles.filter(p => p.id !== anterior);
  const candidatos = distintos.length ? distintos : disponibles;
  return candidatos[Math.floor(Math.random() * candidatos.length)] ?? null;
}
