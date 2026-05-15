"use client";

import { useState } from "react";
import Link from "next/link";
import { loadTarjetas } from "@/app/actions/practicar";
import styles from "./page.module.css";
import type { MazoSummary, Tarjeta } from "@/lib/queries/practicar";

type View = "subjects" | "mazos" | "study";

const SUBJECT_ICONS: Record<string, string> = {
  "Cálculo Integral": "∫",
  "Programación": "</>",
  "Física": "⚡",
  "Gestión": "◈",
  "Matemáticas": "∑",
  "Historia": "◎",
  "Química": "⚗",
  "Biología": "◉",
  "General": "◆",
};

function subjectIcon(materia: string): string {
  return SUBJECT_ICONS[materia] ?? "◈";
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

type Props = { mazos: MazoSummary[] };

export default function PracticarClient({ mazos }: Props) {
  const [view, setView]                   = useState<View>("subjects");
  const [selectedSubject, setSubject]     = useState<string | null>(null);
  const [selectedMazo, setMazo]           = useState<MazoSummary | null>(null);
  const [tarjetas, setTarjetas]           = useState<Tarjeta[]>([]);
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [showBack, setShowBack]           = useState(false);
  const [loading, setLoading]             = useState(false);

  // Group mazos by materia
  const subjects = Array.from(new Set(mazos.map(m => m.materia)));
  const bySubject: Record<string, MazoSummary[]> = {};
  for (const m of mazos) {
    if (!bySubject[m.materia]) bySubject[m.materia] = [];
    bySubject[m.materia].push(m);
  }

  const pickSubject = (s: string) => {
    setSubject(s);
    setView("mazos");
  };

  const pickMazo = async (mazo: MazoSummary) => {
    setLoading(true);
    setMazo(mazo);
    try {
      const cards = await loadTarjetas(mazo.mazo_id);
      setTarjetas(cards);
      setCurrentIndex(0);
      setShowBack(false);
      setView("study");
    } catch {
      /* stay on mazo view */
    } finally {
      setLoading(false);
    }
  };

  const goTo = (dir: -1 | 1) => {
    setCurrentIndex(i => (i + dir + tarjetas.length) % tarjetas.length);
    setShowBack(false);
  };

  const selectCard = (i: number) => { setCurrentIndex(i); setShowBack(false); };

  // ── Subjects view ──────────────────────────────────────────
  if (view === "subjects") {
    return (
      <main className={styles.scene}>
        <div className={styles.shell}>
          <header className={styles.topBar}>
            <div>
              <p className={styles.eyebrow}>Modo estudio</p>
              <h1>¿Qué quieres estudiar?</h1>
            </div>
            <Link href="/dashboard" className={styles.backLink}>Volver al dashboard</Link>
          </header>

          {mazos.length === 0 ? (
            <div className={styles.emptyScreen}>
              <p className={styles.emptyTitle}>No tienes mazos con tarjetas</p>
              <p className={styles.emptyDesc}>Crea un mazo para comenzar a practicar.</p>
              <Link href="/mazos/nuevo" className={styles.backLink}>Crear mazo</Link>
            </div>
          ) : (
            <div className={styles.subjectGrid}>
              {subjects.map(subject => {
                const sm      = bySubject[subject];
                const total   = sm.reduce((s, m) => s + m.total_tarjetas, 0);
                const pending = sm.reduce((s, m) => s + m.pendientes, 0);
                return (
                  <button
                    key={subject}
                    className={styles.subjectCard}
                    onClick={() => pickSubject(subject)}
                  >
                    <span className={styles.subjectIconEl}>{subjectIcon(subject)}</span>
                    <div className={styles.subjectInfo}>
                      <strong>{subject}</strong>
                      <span>{sm.length} mazo{sm.length !== 1 ? "s" : ""} · {total} tarjetas</span>
                    </div>
                    {pending > 0 && (
                      <span className={styles.pendingBadge}>{pending} pendientes</span>
                    )}
                    <span className={styles.arrowHint}>Estudiar →</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── Mazos view ─────────────────────────────────────────────
  if (view === "mazos" && selectedSubject) {
    const sm = bySubject[selectedSubject] ?? [];
    return (
      <main className={styles.scene}>
        <div className={styles.shell}>
          <header className={styles.topBar}>
            <div>
              <p className={styles.eyebrow}>{selectedSubject}</p>
              <h1>Elige un mazo</h1>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.backButton} onClick={() => setView("subjects")}>
                ← Materias
              </button>
              <Link href="/dashboard" className={styles.backLink}>Dashboard</Link>
            </div>
          </header>

          {loading ? (
            <div className={styles.emptyScreen}>
              <p className={styles.emptyTitle}>Cargando tarjetas…</p>
            </div>
          ) : (
            <div className={styles.mazoGrid}>
              {sm.map(mazo => (
                <button key={mazo.mazo_id} className={styles.mazoCard} onClick={() => pickMazo(mazo)}>
                  <div className={styles.mazoCardTop}>
                    <strong>{mazo.titulo}</strong>
                    {mazo.pendientes > 0 && (
                      <span className={styles.pendingBadge}>{mazo.pendientes} pendientes</span>
                    )}
                  </div>
                  <span className={styles.mazoMeta}>{mazo.total_tarjetas} tarjetas en total</span>
                  <span className={styles.startLabel}>Comenzar estudio →</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── Study view ─────────────────────────────────────────────
  if (view === "study" && tarjetas.length > 0) {
    const card     = tarjetas[currentIndex];
    const progress = ((currentIndex + 1) / tarjetas.length) * 100;

    return (
      <main className={styles.scene}>
        <div className={styles.shell}>
          <header className={styles.topBar}>
            <div>
              <p className={styles.eyebrow}>Modo estudio · {selectedMazo?.materia}</p>
              <h1>{selectedMazo?.titulo}</h1>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.backButton} onClick={() => setView("mazos")}>
                ← Mazos
              </button>
              <Link href="/dashboard" className={styles.backLink}>Dashboard</Link>
            </div>
          </header>

          <section className={styles.contentGrid} aria-label="Mazo de estudio">
            <aside className={styles.sidebarCard}>
              <div className={styles.sidebarIntro}>
                <p className={styles.kicker}>Mazo activo</p>
                <h2>{selectedMazo?.titulo}</h2>
                <p>
                  {tarjetas.length} tarjeta{tarjetas.length !== 1 ? "s" : ""} en este mazo.
                </p>
              </div>

              <div className={styles.progressBlock}>
                <div className={styles.progressText}>
                  <span>Tarjeta {currentIndex + 1} de {tarjetas.length}</span>
                  <strong>{Math.round(progress)}%</strong>
                </div>
                <div className={styles.progressTrack} aria-hidden="true">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>

              <ul className={styles.cardList}>
                {tarjetas.map((t, i) => {
                  const active = i === currentIndex;
                  return (
                    <li key={t.tarjeta_id}>
                      <button
                        type="button"
                        className={`${styles.cardSelector} ${active ? styles.cardSelectorActive : ""}`}
                        onClick={() => selectCard(i)}
                        aria-pressed={active}
                      >
                        <span className={styles.cardNumber}>
                          {String(i + 1).padStart(2, "0")}
                          {t.completado ? " ✓" : ""}
                        </span>
                        <span className={styles.cardSelectorText}>
                          {truncate(t.frente, 58)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <article className={styles.studyCard}>
              <div className={styles.cardHeader}>
                <div>
                  <p className={styles.kicker}>Tarjeta actual</p>
                  <h2>{card.dificultad ? `Dificultad: ${card.dificultad}` : `Tarjeta ${currentIndex + 1}`}</h2>
                </div>
                <span className={styles.modeChip}>{showBack ? "Respuesta" : "Pregunta"}</span>
              </div>

              <button
                type="button"
                className={`${styles.flashcard} ${showBack ? styles.flipped : ""}`}
                onClick={() => setShowBack(v => !v)}
                aria-live="polite"
              >
                <span className={styles.faceLabel}>{showBack ? "Lado B" : "Lado A"}</span>
                <div className={styles.flashcardBody}>
                  <h3>{showBack ? card.verso : card.frente}</h3>
                  <p>
                    {showBack
                      ? "Repasa la idea en voz alta y vuelve a la pregunta si quieres."
                      : "Intenta responder antes de voltear la tarjeta."}
                  </p>
                </div>
                <span className={styles.tapHint}>
                  Haz clic para {showBack ? "volver a la pregunta" : "ver la respuesta"}
                </span>
              </button>

              <div className={styles.actions}>
                <button type="button" className={styles.secondaryAction} onClick={() => goTo(-1)}>
                  Anterior
                </button>
                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={() => setShowBack(v => !v)}
                >
                  {showBack ? "Mostrar pregunta" : "Voltear tarjeta"}
                </button>
                <button type="button" className={styles.secondaryAction} onClick={() => goTo(1)}>
                  Siguiente
                </button>
              </div>

              <section className={styles.tipCard} aria-label="Consejo de estudio">
                <p className={styles.kicker}>Sugerencia</p>
                <h3>Haz una ronda rápida y luego una ronda estricta.</h3>
                <p>
                  En la primera pasada solo familiarízate. En la segunda intenta responder
                  sin mirar y marca las que todavía te cuestan.
                </p>
              </section>
            </article>
          </section>
        </div>
      </main>
    );
  }

  return null;
}
