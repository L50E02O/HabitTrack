import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "../../services/auth/restorePassword";
import styles from "./loginPage.module.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!email || !email.includes("@")) {
      setError("Por favor, introduce un correo válido.");
      return;
    }

    setLoading(true);
    try {
      const { error: supabaseError } = await sendPasswordResetEmail(email);

      if (supabaseError) {
        setError(supabaseError.message);
      } else {
        setMessage(
          "Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña."
        );
        setEmail("");
        
        // Redirige después de 3 segundos
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err: any) {
      setError(err?.message ?? "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.iconContainer}>
        <span className={styles.icon}>🔑</span>
      </div>
      <h1>Recuperar contraseña</h1>
      <p className={styles.subtitle}>
        Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      {error && <div className={styles.error} role="alert">{error}</div>}
      {message && <div className={styles.success} role="status">{message}</div>}

      {!message && (
        <form onSubmit={handleSubmit} style={{ marginTop: "2rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="email" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              disabled={loading}
              style={{
                display: "block",
                width: "100%",
                padding: "0.75rem",
                borderRadius: "0.375rem",
                border: "1px solid #d1d5db",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: loading ? "#9ca3af" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: 500,
            }}
          >
            {loading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>
        </form>
      )}

      <div className={styles.footer}>
        <p className={styles.footerText}>¿Recordaste tu contraseña?</p>
        <a onClick={() => navigate('/login')} role="button" tabIndex={0} className={styles.footerLink}>
          Vuelve al login
        </a>
      </div>
    </div>
  );
}
