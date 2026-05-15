/**
 * Crea los usuarios administradores en la base de datos.
 * Uso: npx tsx scripts/seed-admins.ts
 */

import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ADMINS = [
  {
    nombre:    "Administrador Principal",
    correo:    "admin@corestudy.com",
    contrasena: "Admin#2026",
  },
  {
    nombre:    "Super Administrador",
    correo:    "superadmin@corestudy.com",
    contrasena: "Super#2026",
  },
  {
    nombre:    "Director Académico",
    correo:    "director@corestudy.com",
    contrasena: "Director#2026",
  },
];

async function seed() {
  console.log("Conectando a la base de datos…\n");

  for (const admin of ADMINS) {
    const existing = await pool.query(
      "SELECT user_id FROM usuario WHERE correo = $1",
      [admin.correo]
    );

    if (existing.rows.length > 0) {
      console.log(`⚠  Ya existe: ${admin.correo}`);
      continue;
    }

    const hash = await bcrypt.hash(admin.contrasena, 12);

    await pool.query(
      `INSERT INTO usuario (nombre, correo, contrasena, rol)
       VALUES ($1, $2, $3, 'admin')`,
      [admin.nombre, admin.correo, hash]
    );

    console.log(`✓  Creado: ${admin.correo}  /  ${admin.contrasena}`);
  }

  console.log("\nSeed completado.");
  await pool.end();
}

seed().catch(err => {
  console.error("Error en seed:", err);
  process.exit(1);
});
