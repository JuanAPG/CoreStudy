import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import styles from "./page.module.css";
import { authOptions } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries/dashboard";
import Sidebar from "@/app/components/Sidebar";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const { weeklyProgress, weeklyHours, subjectHours, pendingTasks, suggestion } =
    await getDashboardData(session.user.id);

  const firstName    = session.user.name?.split(" ")[0] ?? "Usuario";
  const maxDayHours  = Math.max(...weeklyHours.map(h => h.hours), 1);
  const maxSubjHours = Math.max(...subjectHours.map(s => s.hours), 1);

  return (
    <main className={styles.scene}>
      <Sidebar />

      <div className={styles.shell}>

        {/* ── Barra superior ─────────────────────────────── */}
        <header className={styles.topBar}>
          <p className={styles.title}>Mi Panel de Estudio</p>

          <div className={styles.actions}>
            <button type="button" className={styles.iconAction} aria-label="Notificaciones">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 10a6 6 0 1 1 12 0v4.1l1.2 1.4a1 1 0 0 1-.76 1.65H5.56a1 1 0 0 1-.76-1.65L6 14.1V10Z"
                  stroke="currentColor" strokeWidth="1.8"
                />
                <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
            <button type="button" className={styles.avatarAction} aria-label="Perfil">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8.3" r="3.1" stroke="currentColor" strokeWidth="1.8" />
                <path d="M5.5 18a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
          </div>
        </header>

        {/* ── Grid principal ──────────────────────────────── */}
        <section className={styles.contentGrid} aria-label="Resumen de estudio">

          {/* ── Bienvenida ──────────────────────────────── */}
          <article className={`${styles.card} ${styles.welcomeCard}`}>
            <div className={styles.welcomeHeader}>
              <h2>Hola {firstName}!</h2>
              <span className={styles.aiChip}>Ai</span>
            </div>
            {suggestion ? (
              <p>
                La IA ha analizado tu progreso y te sugiere enfocarte en{" "}
                <strong>{suggestion.subject}</strong> hoy.
              </p>
            ) : (
              <p>Bienvenido de nuevo. Crea un mazo para comenzar tu sesión de estudio.</p>
            )}
            <Link href="/practicar" className={styles.practiceButton}>
              {suggestion ? `Practicar ${suggestion.deck}` : "Ir a practicar"}
            </Link>
          </article>

          {/* ── Progreso semanal ────────────────────────── */}
          <article className={`${styles.card} ${styles.progressCard}`}>
            <h3>Mi progreso semanal</h3>

            <div className={styles.progressTop}>
              <div
                className={styles.progressCircle}
                style={{ "--progress": `${weeklyProgress}%` } as CSSProperties}
                aria-label={`${weeklyProgress}% de avance`}
              >
                <span>{weeklyProgress}%</span>
              </div>
              <p>Estudio completado</p>
            </div>

            <div className={styles.chartBlock}>
              <h4>Horas estudiadas</h4>
              {weeklyHours.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "#6a7fa8", margin: 0 }}>
                  Sin sesiones esta semana
                </p>
              ) : (
                <div className={styles.hChart}>
                  {weeklyHours.map(item => (
                    <div key={item.day} className={styles.hRow}>
                      <span>{item.day}</span>
                      <div className={styles.hTrack}>
                        <div style={{ width: `${(item.hours / maxDayHours) * 100}%` }} />
                      </div>
                      <strong>{item.hours}h</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.chartBlock}>
              <h4>Asignaturas estudiadas</h4>
              {subjectHours.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "#6a7fa8", margin: 0 }}>
                  Sin datos esta semana
                </p>
              ) : (
                <div
                  className={styles.vChart}
                  style={{ gridTemplateColumns: `repeat(${subjectHours.length}, 1fr)` }}
                >
                  {subjectHours.map(item => (
                    <div key={item.name} className={styles.vCol}>
                      <div className={styles.vBarWrap}>
                        <div style={{ height: `${(item.hours / maxSubjHours) * 100}%` }} />
                      </div>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>

          {/* ── Fila inferior ───────────────────────────── */}
          <div className={styles.lowerGrid}>

            <article className={`${styles.card} ${styles.tasksCard}`}>
              <h3>Tareas pendientes</h3>
              <ul>
                {pendingTasks.length === 0 ? (
                  <li>
                    <span className={`${styles.taskCheck} ${styles.checked}`} aria-hidden="true">✓</span>
                    Todo al día
                  </li>
                ) : (
                  pendingTasks.map(task => (
                    <li key={task.mazo_id}>
                      <span
                        className={`${styles.taskCheck} ${task.parcial ? styles.checked : ""}`}
                        aria-hidden="true"
                      >
                        {task.parcial ? "✓" : ""}
                      </span>
                      {task.titulo}
                    </li>
                  ))
                )}
              </ul>
            </article>

            <Link href="/mazos/nuevo" className={`${styles.card} ${styles.deckCard}`}>
              <h3>Empezar mazo de estudio</h3>
              <div className={styles.deckDropArea}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M8 18h8a4 4 0 1 0-.9-7.9 5 5 0 0 0-9.7 1.5A3.5 3.5 0 0 0 8 18Z"
                    stroke="currentColor" strokeWidth="1.7"
                  />
                  <path d="M12 14V9m0 0-2 2m2-2 2 2" stroke="currentColor" strokeWidth="1.7" />
                </svg>
                <p>Crear un nuevo mazo para comenzar.</p>
              </div>
              <span className={styles.deckButton}>Agregar mazo</span>
            </Link>

          </div>
        </section>
      </div>
    </main>
  );
}
