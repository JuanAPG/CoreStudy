import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        correo: { label: "Correo", type: "email" },
        contrasena: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.correo || !credentials?.contrasena) return null;

        const { rows } = await pool.query(
          `SELECT user_id, nombre, correo, contrasena, rol
           FROM usuario
           WHERE correo = $1`,
          [credentials.correo]
        );

        const user = rows[0];
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.contrasena, user.contrasena);
        if (!valid) return null;

        return {
          id: String(user.user_id),
          name: user.nombre,
          email: user.correo,
          role: user.rol,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
    error: "/",
  },
};
