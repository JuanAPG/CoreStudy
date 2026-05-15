import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMazosParaPracticar } from "@/lib/queries/practicar";
import PracticarClient from "./PracticarClient";

export default async function PracticarPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const mazos = await getMazosParaPracticar(session.user.id);

  return <PracticarClient mazos={mazos} />;
}
