import pool from "@/lib/db";

export type WeekDay     = { day: string; hours: number };
export type SubjectH    = { name: string; hours: number };
export type PendingTask = { mazo_id: number; titulo: string; parcial: boolean };
export type Suggestion  = { subject: string; deck: string } | null;

export type DashboardData = {
  weeklyProgress : number;
  weeklyHours    : WeekDay[];
  subjectHours   : SubjectH[];
  pendingTasks   : PendingTask[];
  suggestion     : Suggestion;
};

const DAYS: Record<string, string> = {
  "1": "Lunes",
  "2": "Martes",
  "3": "Miércoles",
  "4": "Jueves",
  "5": "Viernes",
  "6": "Sábado",
  "0": "Domingo",
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  try {
    const [progR, daysR, subjR, tasksR, suggR] = await Promise.all([

      // Porcentaje de aciertos en la semana actual
      pool.query<{ progress: string }>(
        `SELECT
           CASE WHEN SUM(aciertos + errores) = 0 THEN '0'
                ELSE ROUND(SUM(aciertos)::numeric / SUM(aciertos + errores) * 100)::text
           END AS progress
         FROM sesion_estudio
         WHERE user_id = $1
           AND fecha_inicio >= DATE_TRUNC('week', NOW())`,
        [userId]
      ),

      // Horas estudiadas por día en la semana actual
      pool.query<{ day_num: string; hours: string }>(
        `SELECT
           EXTRACT(DOW FROM fecha_inicio)::text AS day_num,
           ROUND(
             SUM(EXTRACT(EPOCH FROM (COALESCE(fecha_fin, NOW()) - fecha_inicio))) / 3600
           , 1)::text AS hours
         FROM sesion_estudio
         WHERE user_id = $1
           AND fecha_inicio >= DATE_TRUNC('week', NOW())
         GROUP BY day_num
         ORDER BY day_num`,
        [userId]
      ),

      // Horas por materia esta semana (máx 4 para la gráfica)
      pool.query<{ materia: string; hours: string }>(
        `SELECT
           COALESCE(m.materia, 'General') AS materia,
           ROUND(
             SUM(EXTRACT(EPOCH FROM (COALESCE(s.fecha_fin, NOW()) - s.fecha_inicio))) / 3600
           , 1)::text AS hours
         FROM sesion_estudio s
         JOIN mazo m ON s.mazo_id = m.mazo_id
         WHERE s.user_id = $1
           AND s.fecha_inicio >= DATE_TRUNC('week', NOW())
         GROUP BY m.materia
         ORDER BY SUM(EXTRACT(EPOCH FROM (COALESCE(s.fecha_fin, NOW()) - s.fecha_inicio))) DESC
         LIMIT 4`,
        [userId]
      ),

      // Mazos con tarjetas pendientes (tareas)
      pool.query<{ mazo_id: number; titulo: string; parcial: boolean }>(
        `SELECT
           m.mazo_id,
           m.titulo,
           EXISTS(
             SELECT 1 FROM tarjetas t2
             WHERE t2.mazo_id = m.mazo_id AND t2.completado = true
           ) AS parcial
         FROM mazo m
         WHERE m.user_id = $1
           AND EXISTS (
             SELECT 1 FROM tarjetas t
             WHERE t.mazo_id = m.mazo_id AND t.completado = false
           )
         ORDER BY m.fecha_creacion DESC
         LIMIT 5`,
        [userId]
      ),

      // Sugerencia IA: materia con más tarjetas sin completar
      pool.query<{ subject: string; deck: string }>(
        `SELECT
           m.materia AS subject,
           m.titulo  AS deck
         FROM mazo m
         JOIN tarjetas t ON t.mazo_id = m.mazo_id
         WHERE m.user_id = $1 AND t.completado = false
         GROUP BY m.materia, m.titulo
         ORDER BY COUNT(t.tarjeta_id) DESC
         LIMIT 1`,
        [userId]
      ),
    ]);

    return {
      weeklyProgress: Math.round(Number(progR.rows[0]?.progress ?? 0)),
      weeklyHours: daysR.rows.length
        ? daysR.rows.map(r => ({ day: DAYS[r.day_num] ?? `Día ${r.day_num}`, hours: Number(r.hours) }))
        : [],
      subjectHours: subjR.rows.length
        ? subjR.rows.map(r => ({ name: r.materia, hours: Number(r.hours) }))
        : [],
      pendingTasks: tasksR.rows,
      suggestion: suggR.rows[0] ?? null,
    };
  } catch (err) {
    console.error("getDashboardData error:", err);
    return {
      weeklyProgress: 0,
      weeklyHours:    [],
      subjectHours:   [],
      pendingTasks:   [],
      suggestion:     null,
    };
  }
}
