"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeMazo } from "@/app/actions/mazos";
import styles from "./page.module.css";
import type { MazoFull } from "@/lib/queries/mazos";

const SUBJECT_COLORS: Record<string, string> = {
  "Cálculo Integral": "#0f92af",
  "Programación":     "#6d28d9",
  "Física":           "#dc7e00",
  "Gestión":          "#0f6b3c",
  "Matemáticas":      "#1d4ed8",
  "Historia":         "#9f1239",
  "Química":          "#065f46",
  "Biología":         "#166534",
  "General":          "#374151",
};

const SUBJECT_ICONS: Record<string, string> = {
  "Cálculo Integral": "∫",
  "Programación":     "</>",
  "Física":           "⚡",
  "Gestión":          "◈",
  "Matemáticas":      "∑",
  "Historia":         "◎",
  "Química":          "⚗",
  "Biología":         "◉",
  "General":          "◆",
};

function subjectColor(materia: string) {
  return SUBJECT_COLORS[materia] ?? "#374151";
}

function subjectIcon(materia: string) {
  return SUBJECT_ICONS[materia] ?? "◈";
}

function MazoCard({ mazo }: { mazo: MazoFull }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const progress = mazo.total_tarjetas > 0
    ? Math.round((mazo.completadas / mazo.total_tarjetas) * 100)
    : 0;

  const color = subjectColor(mazo.materia);

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    await removeMazo(mazo.mazo_id);
    router.refresh();
  };

  return (
    <article className={styles.mazoCard} style={{ "--accent": color } as React.CSSProperties}>
      <div className={styles.mazoTop}>
        <span className={styles.subjectIcon} style={{ background: `${color}22`, color }}>
          {subjectIcon(mazo.materia)}
        </span>
        <span className={styles.materiaChip} style={{ background: `${color}18`, color }}>
          {mazo.materia}
        </span>
      </div>

      <h3 className={styles.mazoTitulo}>{mazo.titulo}</h3>

      <div className={styles.statsRow}>
        <span className={styles.stat}>
          <strong>{mazo.total_tarjetas}</strong> tarjetas
        </span>
        <span className={styles.statDot} />
        <span className={styles.stat}>
          <strong>{mazo.pendientes}</strong> pendientes
        </span>
        <span className={styles.statDot} />
        <span className={styles.stat}>{mazo.fecha_creacion}</span>
      </div>

      <div className={styles.progressWrap}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%`, background: color }} />
        </div>
        <span className={styles.progressLabel}>{progress}%</span>
      </div>

      <div className={styles.mazoActions}>
        <Link href="/practicar" className={styles.practiceBtn}>
          Practicar
        </Link>
        {confirm ? (
          <div className={styles.confirmRow}>
            <span className={styles.confirmMsg}>¿Eliminar?</span>
            <button
              type="button"
              className={styles.confirmYes}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "…" : "Sí"}
            </button>
            <button type="button" className={styles.confirmNo} onClick={() => setConfirm(false)}>
              No
            </button>
          </div>
        ) : (
          <button type="button" className={styles.deleteBtn} onClick={handleDelete}>
            Eliminar
          </button>
        )}
      </div>
    </article>
  );
}

export default function MazosClient({ mazos }: { mazos: MazoFull[] }) {
  if (mazos.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="4" y="7" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <h2 className={styles.emptyTitle}>Sin mazos aún</h2>
        <p className={styles.emptyDesc}>Crea tu primer mazo para empezar a estudiar.</p>
        <Link href="/mazos/nuevo" className={styles.emptyAction}>Crear mazo</Link>
      </div>
    );
  }

  return (
    <div className={styles.mazoGrid}>
      {mazos.map(m => <MazoCard key={m.mazo_id} mazo={m} />)}
    </div>
  );
}
