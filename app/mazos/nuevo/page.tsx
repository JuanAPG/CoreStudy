"use client";

import type { ChangeEvent } from "react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { createMazoManual, getMaterias } from "@/app/actions/mazos";
import { generateCardsFromFile } from "@/app/actions/ai";
import Sidebar from "@/app/components/Sidebar";

type Mode = "upload" | "manual";
type UploadStage = "select" | "preview";
type CardPair = { id: number; frente: string; verso: string };

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

const ACCEPTED_EXTS = [".pdf", ".doc", ".docx", ".txt"];
const ACCEPTED_LABELS = ["PDF", "DOCX", "TXT"];

export default function NuevoMazoPage() {
  const router = useRouter();

  /* ── Shared ───────────────────────────────────────── */
  const [mode, setMode] = useState<Mode>("upload");
  const [existingMaterias, setExistingMaterias] = useState<string[]>([]);

  useEffect(() => {
    getMaterias().then(setExistingMaterias).catch(() => {});
  }, []);

  /* ── Upload mode state ────────────────────────────── */
  const [uploadStage, setUploadStage] = useState<UploadStage>("select");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadTitulo, setUploadTitulo] = useState("");
  const [uploadMateria, setUploadMateria] = useState("");
  const [processing, setProcessing] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<CardPair[]>([]);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const genId = useRef(1);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles(cur => {
      const next = [...cur];
      selected.forEach(f => {
        if (!next.some(c => c.name === f.name && c.size === f.size && c.lastModified === f.lastModified)) {
          next.push(f);
        }
      });
      return next;
    });
  };

  const removeFile = (idx: number) => setFiles(cur => cur.filter((_, i) => i !== idx));
  const totalSize = files.reduce((s, f) => s + f.size, 0);

  const canProcess = files.length > 0 && uploadTitulo.trim().length > 0 && uploadMateria.trim().length > 0;

  const handleProcess = async () => {
    if (!canProcess) return;
    setProcessing(true);
    setUploadFeedback(null);

    const fd = new FormData();
    fd.append("file", files[0]);

    const result = await generateCardsFromFile(fd);
    setProcessing(false);

    if (result.ok && result.cards) {
      genId.current = 1;
      setGeneratedCards(result.cards.map(c => ({ id: genId.current++, frente: c.frente, verso: c.verso })));
      setUploadStage("preview");
    } else {
      setUploadFeedback(result.error ?? "Error desconocido.");
    }
  };

  const addGenCard = () => setGeneratedCards(c => [...c, { id: genId.current++, frente: "", verso: "" }]);
  const removeGenCard = (id: number) => setGeneratedCards(c => c.length > 1 ? c.filter(p => p.id !== id) : c);
  const updateGenCard = (id: number, field: "frente" | "verso", value: string) =>
    setGeneratedCards(c => c.map(p => p.id === id ? { ...p, [field]: value } : p));

  const validGenCards = generatedCards.filter(c => c.frente.trim() && c.verso.trim());

  const handleSaveGenerated = async () => {
    if (validGenCards.length === 0) return;
    setProcessing(true);
    setUploadFeedback(null);
    const result = await createMazoManual(uploadTitulo, uploadMateria, validGenCards);
    setProcessing(false);
    if (result.ok) {
      router.push("/mazos");
    } else {
      setUploadFeedback(result.error ?? "Error al guardar.");
    }
  };

  /* ── Manual mode state ────────────────────────────── */
  const [titulo, setTitulo] = useState("");
  const [materia, setMateria] = useState("");
  const [cards, setCards] = useState<CardPair[]>([{ id: 1, frente: "", verso: "" }]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "error"; msg: string } | null>(null);
  const nextId = useRef(2);

  const addCard = () => setCards(c => [...c, { id: nextId.current++, frente: "", verso: "" }]);
  const removeCard = (id: number) => setCards(c => c.length > 1 ? c.filter(p => p.id !== id) : c);
  const updateCard = (id: number, field: "frente" | "verso", value: string) =>
    setCards(c => c.map(p => p.id === id ? { ...p, [field]: value } : p));

  const validCards = cards.filter(c => c.frente.trim() && c.verso.trim());

  const handleSubmit = async () => {
    setFeedback(null);
    if (!titulo.trim() || !materia.trim()) {
      setFeedback({ type: "error", msg: "El título y la materia son obligatorios." });
      return;
    }
    if (validCards.length === 0) {
      setFeedback({ type: "error", msg: "Agrega al menos una tarjeta con frente y verso." });
      return;
    }
    setSaving(true);
    const result = await createMazoManual(titulo, materia, validCards);
    setSaving(false);
    if (result.ok) {
      router.push("/mazos");
    } else {
      setFeedback({ type: "error", msg: result.error ?? "Error desconocido." });
    }
  };

  /* ── Materia datalist (shared) ────────────────────── */
  const dataList = (id: string) =>
    existingMaterias.length > 0 ? (
      <datalist id={id}>
        {existingMaterias.map(m => <option key={m} value={m} />)}
      </datalist>
    ) : null;

  /* ── Render helpers ───────────────────────────────── */
  const topDescription = () => {
    if (mode === "manual") return "Escribe el frente y verso de cada tarjeta para armar tu mazo.";
    if (uploadStage === "preview") return `${validGenCards.length} tarjetas generadas para "${uploadTitulo}". Revisa y edita antes de guardar.`;
    return "Sube un documento y la IA generará las flashcards automáticamente.";
  };

  const topTitle = () => {
    if (mode === "manual") return "Crear tarjetas manualmente";
    if (uploadStage === "preview") return "Revisa las tarjetas generadas";
    return "Generar tarjetas con IA";
  };

  return (
    <main className={styles.scene}>
      <Sidebar />
      <div className={styles.shell}>

        {/* ── Top bar ───────────────────────────────── */}
        <header className={styles.topBar}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>Nuevo mazo</p>
            <h1>{topTitle()}</h1>
            <p>{topDescription()}</p>
          </div>

          <div className={styles.headerActions}>
            {uploadStage === "select" && (
              <div className={styles.modeToggle} role="group" aria-label="Modo de creación">
                <button
                  type="button"
                  className={`${styles.modeBtn} ${mode === "upload" ? styles.modeBtnActive : ""}`}
                  onClick={() => setMode("upload")}
                >
                  Subir archivos
                </button>
                <button
                  type="button"
                  className={`${styles.modeBtn} ${mode === "manual" ? styles.modeBtnActive : ""}`}
                  onClick={() => setMode("manual")}
                >
                  Crear manualmente
                </button>
              </div>
            )}
            {uploadStage === "preview" ? (
              <button
                type="button"
                className={styles.backLinkBtn}
                onClick={() => { setUploadStage("select"); setUploadFeedback(null); }}
              >
                ← Volver a subir
              </button>
            ) : (
              <Link href="/dashboard" className={styles.backLink}>Volver al dashboard</Link>
            )}
          </div>
        </header>

        {/* ── Contenido ─────────────────────────────── */}
        <section className={styles.contentGrid}>

          {/* ═══════════════ UPLOAD MODE ═══════════════ */}
          {mode === "upload" && uploadStage === "select" && (
            <>
              {/* Left: metadata + dropzone */}
              <article className={styles.uploadCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.kicker}>Información del mazo</p>
                    <h2>Datos del mazo a crear</h2>
                  </div>
                  <span className={styles.statusChip}>{files.length} archivo(s)</span>
                </div>

                {/* Título + materia */}
                <div className={styles.mazoMeta}>
                  <label className={styles.metaLabel} htmlFor="up-titulo">Título del mazo</label>
                  <input
                    id="up-titulo"
                    type="text"
                    className={styles.metaInput}
                    value={uploadTitulo}
                    onChange={e => setUploadTitulo(e.target.value)}
                    placeholder="Ej. Antiderivadas e Integrales"
                  />
                  <label className={styles.metaLabel} htmlFor="up-materia">Materia</label>
                  <input
                    id="up-materia"
                    type="text"
                    list="up-materias-list"
                    className={styles.metaInput}
                    value={uploadMateria}
                    onChange={e => setUploadMateria(e.target.value)}
                    placeholder="Ej. Cálculo Integral"
                    autoComplete="off"
                  />
                  {dataList("up-materias-list")}
                </div>

                {/* Dropzone */}
                <label className={styles.dropzone}>
                  <input
                    type="file"
                    className={styles.fileInput}
                    accept={ACCEPTED_EXTS.join(",")}
                    onChange={handleFileChange}
                  />
                  <span className={styles.dropIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M8 18h8a4 4 0 1 0-.9-7.9 5 5 0 0 0-9.7 1.5A3.5 3.5 0 0 0 8 18Z" stroke="currentColor" strokeWidth="1.7" />
                      <path d="M12 14V9m0 0-2 2m2-2 2 2" stroke="currentColor" strokeWidth="1.7" />
                    </svg>
                  </span>
                  <strong>Arrastra un archivo o haz clic para elegirlo</strong>
                  <p>PDF, DOCX o TXT — máx. 10 MB</p>
                  <span className={styles.pickButton}>Seleccionar archivo</span>
                </label>

                {/* File list */}
                <div className={styles.filePanel}>
                  <div className={styles.filePanelHeader}>
                    <div>
                      <p className={styles.kicker}>Archivo seleccionado</p>
                      <h3>Vista previa</h3>
                    </div>
                    <span>{files.length > 0 ? formatFileSize(totalSize) : "Sin archivo"}</span>
                  </div>

                  {files.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>Todavía no has seleccionado un archivo.</p>
                      <span>Cuando lo agregues, aparecerá aquí con su tamaño y formato.</span>
                    </div>
                  ) : (
                    <ul className={styles.fileList}>
                      {files.map((file, idx) => (
                        <li key={`${file.name}-${file.lastModified}`} className={styles.fileItem}>
                          <div className={styles.fileMeta}>
                            <span className={styles.fileBadge}>{file.name.split(".").pop()?.toUpperCase() ?? "FILE"}</span>
                            <div>
                              <strong>{file.name}</strong>
                              <p>{formatFileSize(file.size)} · {file.type || "Formato no identificado"}</p>
                            </div>
                          </div>
                          <button type="button" className={styles.removeButton} onClick={() => removeFile(idx)} aria-label={`Quitar ${file.name}`}>
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>

              {/* Right: steps + process button */}
              <aside className={styles.infoCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.kicker}>Cómo funciona</p>
                    <h2>Análisis con IA</h2>
                  </div>
                </div>

                <div className={styles.steps}>
                  <div className={styles.stepItem}>
                    <span>1</span>
                    <div>
                      <strong>Completa los datos</strong>
                      <p>Escribe el título, la materia y sube tu documento de estudio.</p>
                    </div>
                  </div>
                  <div className={styles.stepItem}>
                    <span>2</span>
                    <div>
                      <strong>Gemini analiza el material</strong>
                      <p>La IA detecta conceptos clave y genera frente y verso de cada tarjeta.</p>
                    </div>
                  </div>
                  <div className={styles.stepItem}>
                    <span>3</span>
                    <div>
                      <strong>Revisa y guarda</strong>
                      <p>Edita, agrega o elimina tarjetas antes de guardar el mazo.</p>
                    </div>
                  </div>
                </div>

                <div className={styles.formatCard}>
                  <p className={styles.kicker}>Formatos compatibles</p>
                  <div className={styles.formatList}>
                    {ACCEPTED_LABELS.map(f => <span key={f}>{f}</span>)}
                  </div>
                </div>

                {uploadFeedback && (
                  <div className={`${styles.feedback} ${styles.feedbackError}`} role="alert">
                    {uploadFeedback}
                  </div>
                )}

                <button
                  type="button"
                  className={styles.primaryAction}
                  disabled={!canProcess || processing}
                  onClick={handleProcess}
                >
                  {processing
                    ? "Analizando con IA…"
                    : !uploadTitulo.trim() || !uploadMateria.trim()
                      ? "Completa título y materia"
                      : files.length === 0
                        ? "Selecciona un archivo"
                        : "Generar tarjetas con IA"}
                </button>

                <p className={styles.footnote}>
                  Se usará el primer archivo seleccionado. El proceso tarda entre 5 y 20 segundos dependiendo del tamaño.
                </p>
              </aside>
            </>
          )}

          {/* ═══════════════ PREVIEW STAGE ═══════════════ */}
          {mode === "upload" && uploadStage === "preview" && (
            <>
              {/* Left: editable card list */}
              <article className={styles.uploadCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.kicker}>Tarjetas generadas</p>
                    <h2>Edita antes de guardar</h2>
                  </div>
                  <span className={styles.statusChip}>{generatedCards.length} tarjeta(s)</span>
                </div>

                <div className={styles.cardEditor}>
                  {generatedCards.map((pair, i) => (
                    <div key={pair.id} className={styles.cardEditorItem}>
                      <span className={styles.cardNum}>{i + 1}</span>
                      <div className={styles.cardTextareas}>
                        <textarea
                          className={styles.cardTextarea}
                          placeholder="Frente (pregunta o concepto)"
                          value={pair.frente}
                          onChange={e => updateGenCard(pair.id, "frente", e.target.value)}
                          rows={3}
                        />
                        <textarea
                          className={styles.cardTextarea}
                          placeholder="Verso (respuesta o definición)"
                          value={pair.verso}
                          onChange={e => updateGenCard(pair.id, "verso", e.target.value)}
                          rows={3}
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.removeCardBtn}
                        onClick={() => removeGenCard(pair.id)}
                        disabled={generatedCards.length === 1}
                        aria-label={`Eliminar tarjeta ${i + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" className={styles.addCardBtn} onClick={addGenCard}>
                  + Agregar tarjeta
                </button>
              </article>

              {/* Right: summary + save */}
              <aside className={styles.infoCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.kicker}>Resumen del mazo</p>
                    <h2>{validGenCards.length} / {generatedCards.length} listas</h2>
                  </div>
                  <span className={styles.statusChip}>{validGenCards.length} válidas</span>
                </div>

                <div className={styles.mazoSummary}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Título</span>
                    <strong className={styles.summaryValue}>{uploadTitulo}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Materia</span>
                    <strong className={styles.summaryValue}>{uploadMateria}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Archivo</span>
                    <strong className={styles.summaryValue}>{files[0]?.name}</strong>
                  </div>
                </div>

                <div className={styles.steps}>
                  <div className={styles.stepItem}>
                    <span>✓</span>
                    <div>
                      <strong>IA completó el análisis</strong>
                      <p>Se generaron {generatedCards.length} tarjetas desde tu documento.</p>
                    </div>
                  </div>
                  <div className={styles.stepItem}>
                    <span>2</span>
                    <div>
                      <strong>Revisa el contenido</strong>
                      <p>Edita, elimina o agrega tarjetas según necesites.</p>
                    </div>
                  </div>
                  <div className={styles.stepItem}>
                    <span>3</span>
                    <div>
                      <strong>Guarda el mazo</strong>
                      <p>Quedará disponible en Practicar bajo la materia "{uploadMateria}".</p>
                    </div>
                  </div>
                </div>

                {uploadFeedback && (
                  <div className={`${styles.feedback} ${styles.feedbackError}`} role="alert">
                    {uploadFeedback}
                  </div>
                )}

                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={handleSaveGenerated}
                  disabled={processing || validGenCards.length === 0}
                >
                  {processing ? "Guardando…" : "Guardar mazo"}
                </button>

                <p className={styles.footnote}>
                  Solo se guardarán las tarjetas con frente y verso completos.
                </p>
              </aside>
            </>
          )}

          {/* ═══════════════ MANUAL MODE ═══════════════ */}
          {mode === "manual" && (
            <>
              {/* Left: metadata + card editor */}
              <article className={styles.uploadCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.kicker}>Información del mazo</p>
                    <h2>Datos y tarjetas</h2>
                  </div>
                  <span className={styles.statusChip}>{cards.length} tarjeta(s)</span>
                </div>

                <div className={styles.mazoMeta}>
                  <label className={styles.metaLabel} htmlFor="titulo">Título del mazo</label>
                  <input
                    id="titulo"
                    type="text"
                    className={styles.metaInput}
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    placeholder="Ej. Antiderivadas e Integrales"
                  />
                  <label className={styles.metaLabel} htmlFor="materia">Materia</label>
                  <input
                    id="materia"
                    type="text"
                    list="man-materias-list"
                    className={styles.metaInput}
                    value={materia}
                    onChange={e => setMateria(e.target.value)}
                    placeholder="Ej. Cálculo Integral"
                    autoComplete="off"
                  />
                  {dataList("man-materias-list")}
                </div>

                <div className={styles.cardEditor}>
                  {cards.map((pair, i) => (
                    <div key={pair.id} className={styles.cardEditorItem}>
                      <span className={styles.cardNum}>{i + 1}</span>
                      <div className={styles.cardTextareas}>
                        <textarea
                          className={styles.cardTextarea}
                          placeholder="Frente (pregunta o concepto)"
                          value={pair.frente}
                          onChange={e => updateCard(pair.id, "frente", e.target.value)}
                          rows={3}
                        />
                        <textarea
                          className={styles.cardTextarea}
                          placeholder="Verso (respuesta o definición)"
                          value={pair.verso}
                          onChange={e => updateCard(pair.id, "verso", e.target.value)}
                          rows={3}
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.removeCardBtn}
                        onClick={() => removeCard(pair.id)}
                        disabled={cards.length === 1}
                        aria-label={`Eliminar tarjeta ${i + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" className={styles.addCardBtn} onClick={addCard}>
                  + Agregar tarjeta
                </button>
              </article>

              {/* Right: progress + save */}
              <aside className={styles.infoCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <p className={styles.kicker}>Progreso</p>
                    <h2>{validCards.length} / {cards.length} completa{validCards.length !== 1 ? "s" : ""}</h2>
                  </div>
                  <span className={styles.statusChip}>{validCards.length} lista(s)</span>
                </div>

                <div className={styles.steps}>
                  <div className={styles.stepItem}>
                    <span>1</span>
                    <div>
                      <strong>Nombre y materia</strong>
                      <p>Dale un título y asigna la materia a la que pertenece el mazo.</p>
                    </div>
                  </div>
                  <div className={styles.stepItem}>
                    <span>2</span>
                    <div>
                      <strong>Escribe las tarjetas</strong>
                      <p>Cada tarjeta necesita un frente (pregunta) y un verso (respuesta).</p>
                    </div>
                  </div>
                  <div className={styles.stepItem}>
                    <span>3</span>
                    <div>
                      <strong>Guarda y practica</strong>
                      <p>Al guardar podrás estudiar el mazo desde la sección Practicar.</p>
                    </div>
                  </div>
                </div>

                {feedback && (
                  <div
                    className={`${styles.feedback} ${feedback.type === "ok" ? styles.feedbackSuccess : styles.feedbackError}`}
                    role="alert"
                  >
                    {feedback.msg}
                  </div>
                )}

                <button
                  type="button"
                  className={styles.primaryAction}
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? "Guardando…" : "Guardar mazo"}
                </button>

                <p className={styles.footnote}>
                  Solo se guardarán las tarjetas con frente y verso completos.
                </p>
              </aside>
            </>
          )}

        </section>
      </div>
    </main>
  );
}
