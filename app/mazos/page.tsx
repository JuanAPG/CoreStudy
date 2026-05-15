import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllMazos } from "@/lib/queries/mazos";
import Sidebar from "@/app/components/Sidebar";
import MazosClient from "./MazosClient";
import styles from "./page.module.css";

export default async function MazosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const mazos = await getAllMazos(session.user.id);

  return (
    <main className={styles.scene}>
      <Sidebar />

      <div className={styles.shell}>
        <header className={styles.topBar}>
          <div>
            <p className={styles.eyebrow}>Biblioteca</p>
            <h1 className={styles.title}>Mis mazos</h1>
          </div>
          <div className={styles.topActions}>
            <span className={styles.countChip}>{mazos.length} mazo{mazos.length !== 1 ? "s" : ""}</span>
            <Link href="/mazos/nuevo" className={styles.newBtn}>+ Nuevo mazo</Link>
          </div>
        </header>

        <MazosClient mazos={mazos} />
      </div>
    </main>
  );
}
