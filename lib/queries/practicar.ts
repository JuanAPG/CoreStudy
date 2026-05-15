import pool from "@/lib/db";

export type MazoSummary = {
  mazo_id: number;
  titulo: string;
  materia: string;
  total_tarjetas: number;
  pendientes: number;
};

export type Tarjeta = {
  tarjeta_id: number;
  frente: string;
  verso: string;
  dificultad: string | null;
  completado: boolean;
};

export async function getMazosParaPracticar(userId: string): Promise<MazoSummary[]> {
  try {
    const { rows } = await pool.query(
      `SELECT
         m.mazo_id,
         m.titulo,
         COALESCE(m.materia, 'General') AS materia,
         COUNT(t.tarjeta_id)::int        AS total_tarjetas,
         COUNT(t.tarjeta_id) FILTER (WHERE t.completado = false)::int AS pendientes
       FROM mazo m
       LEFT JOIN tarjetas t ON t.mazo_id = m.mazo_id
       WHERE m.user_id = $1
       GROUP BY m.mazo_id, m.titulo, m.materia
       HAVING COUNT(t.tarjeta_id) > 0
       ORDER BY m.materia, m.titulo`,
      [userId]
    );
    return rows as MazoSummary[];
  } catch {
    return [];
  }
}

export async function getTarjetasByMazo(mazoId: number, userId: string): Promise<Tarjeta[]> {
  try {
    const { rows } = await pool.query(
      `SELECT
         t.tarjeta_id,
         t.frente,
         t.verso,
         t.dificultad,
         t.completado
       FROM tarjetas t
       JOIN mazo m ON t.mazo_id = m.mazo_id
       WHERE t.mazo_id = $1 AND m.user_id = $2
       ORDER BY t.completado ASC, t.tarjeta_id ASC`,
      [mazoId, userId]
    );
    return rows as Tarjeta[];
  } catch {
    return [];
  }
}
