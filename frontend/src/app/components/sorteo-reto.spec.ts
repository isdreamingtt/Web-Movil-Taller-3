import type { Problem } from '../models/problem';
import { problemasDisponibles, sortearProblema } from './sorteo-reto';

const problema = (id: number, estado: Problem['estado']): Problem => ({
  id, estado, titulo: `Problema ${id}`, plataforma: 'CSES', dificultad: null, url: null, tag: null,
});

describe('Sorteo de retos', () => {
  const pendientes = problema(1, 'Pendiente');
  const intentando = problema(2, 'Intentando');
  const resuelto = problema(3, 'Resuelto');
  const problemas = [pendientes, intentando, resuelto];

  it('excluye problemas resueltos', () => {
    expect(problemasDisponibles(problemas)).toEqual([pendientes, intentando]);
  });
  it('no repite el reto inmediatamente si hay otra alternativa', () => {
    expect(sortearProblema(problemas, 1)).toEqual(intentando);
    expect(sortearProblema(problemas, 2)).toEqual(pendientes);
  });
  it('permite repetir si solo hay uno disponible', () => {
    expect(sortearProblema([pendientes, resuelto], 1)).toEqual(pendientes);
  });
  it('devuelve null cuando no hay candidatos', () => {
    expect(sortearProblema([])).toBeNull();
    expect(sortearProblema([resuelto])).toBeNull();
  });
});
