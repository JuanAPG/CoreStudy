"use client";

import { CSSProperties, useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/app/actions/auth";

const STAR_COUNT = 50;

const starStyles: CSSProperties[] = Array.from({ length: STAR_COUNT }, (_, i) => ({
  "--star-tail-length": `${(5 + ((i * 17) % 26) / 10).toFixed(2)}em`,
  "--top-offset": `${((i * 37) % 1000) / 10}vh`,
  "--fall-duration": `${(6 + ((i * 23) % 60) / 10).toFixed(2)}s`,
  "--fall-delay": `${((i * 29) % 1000) / 100}s`,
} as CSSProperties));

function pwStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 3) as 0 | 1 | 2 | 3;
}

const STRENGTH_LABELS = ["", "Débil", "Regular", "Fuerte"];
const STRENGTH_CLASS  = ["", "weak",  "ok",      "strong"];

const FEATURES = [
  { icon: "⚡", title: "Mazos automáticos",       desc: "Desde PDF, Word o texto plano" },
  { icon: "📊", title: "Seguimiento de progreso", desc: "Visualiza tu avance por materia" },
  { icon: "🧠", title: "Repaso espaciado",         desc: "Algoritmo adaptativo a tu ritmo" },
];

export default function RegisterPage() {
  const router = useRouter();

  const [nombre,    setNombre]    = useState("");
  const [correo,    setCorreo]    = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [feedback,  setFeedback]  = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const strength = pwStrength(contrasena);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setFeedback(null);

    if (contrasena !== confirmar) {
      setFeedback({ type: "error", msg: "Las contraseñas no coinciden" });
      return;
    }

    setLoading(true);
    let result: { ok: boolean; error?: string };
    try {
      result = await registerUser(nombre, correo, contrasena);
    } catch {
      setLoading(false);
      setFeedback({ type: "error", msg: "Error de red. Por favor intenta de nuevo." });
      return;
    }
    setLoading(false);

    if (!result.ok) {
      setFeedback({ type: "error", msg: result.error! });
      return;
    }

    setFeedback({ type: "success", msg: "¡Cuenta creada! Redirigiendo al inicio de sesión…" });
    setTimeout(() => router.push("/"), 2000);
  };

  return (
    <main className="login-scene" style={{ alignItems: "center" }}>
      {/* Fondo compartido con login */}
      <div className="stars" aria-hidden="true">
        {starStyles.map((s, i) => <span key={i} className="star" style={s} />)}
      </div>
      <div className="aurora" aria-hidden="true">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
      </div>

      <div className="register-layout">

        {/* ── Panel izquierdo (marca) ─────────────────── */}
        <div className="reg-brand">
          <div className="reg-brand-logo">
            <span className="reg-brand-logo-icon">✦</span>
            <h2>Core Study <span>AI</span></h2>
          </div>

          <div className="reg-brand-tagline">
            <h3>Aprende más<br />inteligente</h3>
            <p>
              Genera mazos de estudio desde tus archivos
              con inteligencia artificial.
            </p>
          </div>

          <ul className="reg-features">
            {FEATURES.map(f => (
              <li key={f.title} className="reg-feature">
                <span className="reg-feature-icon">{f.icon}</span>
                <span className="reg-feature-text">
                  <strong>{f.title}</strong>
                  <small>{f.desc}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Panel derecho (formulario) ──────────────── */}
        <div className="reg-form-panel">
          <div className="reg-form-header">
            <h2>Crea tu cuenta</h2>
            <p>Completa los datos para comenzar</p>
          </div>

          <form className="reg-form" onSubmit={handleSubmit} noValidate>

            <div className="reg-field">
              <label className="reg-label">Nombre completo</label>
              <input
                className="reg-input"
                type="text"
                placeholder="Ej. María López"
                autoComplete="name"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Correo electrónico</label>
              <input
                className="reg-input"
                type="email"
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                required
              />
            </div>

            <div className="reg-field">
              <label className="reg-label">Contraseña</label>
              <input
                className="reg-input"
                type="password"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                required
              />
              {contrasena.length > 0 && (
                <div className="reg-pw-strength">
                  <div className="reg-pw-bars">
                    {[1, 2, 3].map(n => (
                      <div
                        key={n}
                        className={`reg-pw-bar ${strength >= n ? STRENGTH_CLASS[strength] : ""}`}
                      />
                    ))}
                  </div>
                  <span className="reg-pw-label">{STRENGTH_LABELS[strength]}</span>
                </div>
              )}
            </div>

            <div className="reg-field">
              <label className="reg-label">Confirmar contraseña</label>
              <input
                className="reg-input"
                type="password"
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                required
              />
            </div>

            {feedback && (
              <div className={`reg-feedback ${feedback.type}`}>
                {feedback.msg}
              </div>
            )}

            <button
              className="reg-submit"
              type="submit"
              disabled={loading || feedback?.type === "success"}
            >
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </form>

          <p className="reg-login-link">
            ¿Ya tienes cuenta? <a href="/">Inicia sesión</a>
          </p>
        </div>

      </div>
    </main>
  );
}
