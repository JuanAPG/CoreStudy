"use client";

import { CSSProperties, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const STAR_COUNT = 50;

const starStyles: CSSProperties[] = Array.from({ length: STAR_COUNT }, (_, index) => {
  const tailLength = 5 + ((index * 17) % 26) / 10;
  const topOffset = ((index * 37) % 1000) / 10;
  const fallDuration = 6 + ((index * 23) % 60) / 10;
  const fallDelay = ((index * 29) % 1000) / 100;

  return {
    "--star-tail-length": `${tailLength.toFixed(2)}em`,
    "--top-offset": `${topOffset.toFixed(2)}vh`,
    "--fall-duration": `${fallDuration.toFixed(2)}s`,
    "--fall-delay": `${fallDelay.toFixed(2)}s`,
  } as CSSProperties;
});

export default function Home() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      correo,
      contrasena,
      redirect: false,
    });

    if (result?.error) {
      setError("Correo o contraseña incorrectos");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="login-scene">
      <div className="stars" aria-hidden="true">
        {starStyles.map((style, index) => (
          <span key={index} className="star" style={style} />
        ))}
      </div>

      <div className="aurora" aria-hidden="true">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
      </div>

      <section className="login-stage" aria-label="Inicio de sesion">
        <header className="brand-pill">
          <span className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 3L4 7v5c0 5.25 3.4 10.15 8 11.35C16.6 22.15 20 17.25 20 12V7l-8-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <h1>
            Core Study <span>AI</span>
          </h1>
        </header>

        <form className="login-form" onSubmit={handleLogin} noValidate>
          <label className="input-pill">
            <span className="input-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path d="m4.5 7.5 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <input
              type="email"
              placeholder="Ingresa tu correo electrónico"
              autoComplete="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
              required
            />
          </label>

          <label className="input-pill">
            <span className="input-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 10V7.75a4 4 0 1 1 8 0V10" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              value={contrasena}
              onChange={e => setContrasena(e.target.value)}
              required
            />
          </label>

          {error && (
            <p style={{
              margin: 0,
              padding: "0.55rem 1rem",
              borderRadius: "12px",
              background: "rgba(239,68,68,0.13)",
              border: "1px solid rgba(239,68,68,0.28)",
              color: "#fca5a5",
              fontSize: "0.87rem",
              textAlign: "center",
            }}>
              {error}
            </p>
          )}

          <button type="submit" className="login-button" disabled={loading} aria-busy={loading}>
            {loading ? "VERIFICANDO..." : "INICIAR SESIÓN"}
          </button>
        </form>

        <a href="#" className="forgot-link">
          ¿Olvidaste tu contraseña?
        </a>

        <div className="divider" aria-hidden="true">
          <span />
          <p>o</p>
          <span />
        </div>

        <p className="register-copy">
          No tienes cuenta? <a href="/register">Regístrate</a>
        </p>
      </section>
    </main>
  );
}
