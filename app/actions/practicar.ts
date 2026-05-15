"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTarjetasByMazo, type Tarjeta } from "@/lib/queries/practicar";

export async function loadTarjetas(mazoId: number): Promise<Tarjeta[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  return getTarjetasByMazo(mazoId, session.user.id);
}
