"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { deleteMazo } from "@/lib/queries/mazos";

type TarjetaInput = { frente: string; verso: string };

export async function createMazoManual(
  titulo: string,
  materia: string,
  tarjetas: TarjetaInput[]
): Promise<{ ok: boolean; mazoId?: number; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, error: "No autenticado" };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const mazoRes = await client.query<{ mazo_id: number }>(
      `INSERT INTO mazo (titulo, materia, user_id) VALUES ($1, $2, $3) RETURNING mazo_id`,
      [titulo.trim(), materia.trim(), session.user.id]
    );
    const mazoId = mazoRes.rows[0].mazo_id;

    for (const t of tarjetas) {
      await client.query(
        `INSERT INTO tarjetas (mazo_id, frente, verso, completado) VALUES ($1, $2, $3, false)`,
        [mazoId, t.frente.trim(), t.verso.trim()]
      );
    }

    await client.query("COMMIT");
    revalidatePath("/mazos");
    return { ok: true, mazoId };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createMazoManual error:", err);
    return { ok: false, error: "Error al guardar el mazo." };
  } finally {
    client.release();
  }
}

export async function getMaterias(): Promise<string[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  try {
    const { rows } = await pool.query<{ materia: string }>(
      `SELECT DISTINCT materia FROM mazo WHERE user_id = $1 AND materia IS NOT NULL ORDER BY materia`,
      [session.user.id]
    );
    return rows.map(r => r.materia);
  } catch { return []; }
}

export async function removeMazo(mazoId: number): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false, error: "No autenticado" };

  const ok = await deleteMazo(mazoId, session.user.id);
  if (ok) revalidatePath("/mazos");
  return ok ? { ok: true } : { ok: false, error: "No se pudo eliminar el mazo." };
}
