"use server";

import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function registerUser(
  nombre: string,
  correo: string,
  contrasena: string
): Promise<{ ok: boolean; error?: string }> {
  if (!nombre?.trim() || !correo?.trim() || !contrasena) {
    return { ok: false, error: "Todos los campos son requeridos" };
  }
  if (contrasena.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres" };
  }

  try {
    const existing = await pool.query(
      "SELECT user_id FROM usuario WHERE correo = $1",
      [correo.trim().toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return { ok: false, error: "Este correo ya está registrado" };
    }

    const hash = await bcrypt.hash(contrasena, 12);

    await pool.query(
      `INSERT INTO usuario (nombre, correo, contrasena, rol)
       VALUES ($1, $2, $3, 'estudiante')`,
      [nombre.trim(), correo.trim().toLowerCase(), hash]
    );

    return { ok: true };
  } catch {
    return { ok: false, error: "Error al crear la cuenta. Intenta de nuevo." };
  }
}
