import pool from "@/lib/db";

export type MazoFull = {
  mazo_id: number;
  titulo: string;
  materia: string;
  fecha_creacion: string;
  total_tarjetas: number;
  completadas: number;
  pendientes: number;
};

export async function getAllMazos(userId: string): Promise<MazoFull[]> {
  try {
    const { rows } = await pool.query(
      `SELECT
         m.mazo_id,
         m.titulo,
         COALESCE(m.materia, 'General')                                    AS materia,
         TO_CHAR(m.fecha_creacion, 'DD Mon YYYY')                          AS fecha_creacion,
         COUNT(t.tarjeta_id)::int                                          AS total_tarjetas,
         COUNT(t.tarjeta_id) FILTER (WHERE t.completado = true)::int       AS completadas,
         COUNT(t.tarjeta_id) FILTER (WHERE t.completado = false)::int      AS pendientes
       FROM mazo m
       LEFT JOIN tarjetas t ON t.mazo_id = m.mazo_id
       WHERE m.user_id = $1
       GROUP BY m.mazo_id, m.titulo, m.materia, m.fecha_creacion
       ORDER BY m.fecha_creacion DESC`,
      [userId]
    );
    return rows as MazoFull[];
  } catch {
    return [];
  }
}

export async function deleteMazo(mazoId: number, userId: string): Promise<boolean> {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM mazo WHERE mazo_id = $1 AND user_id = $2`,
      [mazoId, userId]
    );
    return (rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}
