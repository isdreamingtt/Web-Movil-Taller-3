export type Estado = 'Pendiente' | 'Intentando' | 'Resuelto';

export interface Problem {
  id: number;
  titulo: string;
  plataforma: string;
  dificultad: number | null;
  estado: Estado;
  url: string | null;
  tag: string | null;
  solved_lat?: number | null;
  solved_lng?: number | null;
  solved_location?: string | null;
  solved_at?: string | null;
  created_at?: string | null;
}

export type ProblemInput = Omit<Problem, 'id' | 'created_at'>;

export const PLATAFORMAS = ['Codeforces', 'LeetCode', 'CSES', 'AtCoder', 'Otra'];
export const ESTADOS: Estado[] = ['Pendiente', 'Intentando', 'Resuelto'];