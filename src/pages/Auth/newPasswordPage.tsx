import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updatePasswordWithToken } from "../../services/auth/restorePassword";
import { supabase } from "../../config/supabase";
import styles from "./loginPage.module.css";

export default function NewPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Verifica si el usuario tiene una sesión activa (token válido)
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setValidToken(true);
      } else {
        setError("El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.");
        setTimeout(() => navigate("/forgot-password"), 3000);
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!password || !passwordConfirm) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await updatePasswordWithToken(password);

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setPassword("");
        setPasswordConfirm("");

        // Redirige al login después de 3 segundos
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err: any) {
      setError(err?.message ?? "Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (!validToken && !error) {
    return (
      <div className={styles.authPage}>
        <p>Verificando enlace de recuperación...</p>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.iconContainer}>
        <span className={styles.icon}>🔐</span>
      </div>
      <h1>Establecer nueva contraseña</h1>
      <p className={styles.subtitle}>
        Crea una nueva contraseña segura para tu cuenta.
      </p>

      {error && <div className={styles.error} role="alert">{error}</div>}
      {success && (
        <div className={styles.success} role="status">
          ¡Contraseña actualizada exitosamente! Serás redirigido al login...
        </div>
      )}

      {!success && validToken && (
        <form onSubmit={handleSubmit} style={{ marginTop: "2rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="password" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña (mín. 6 caracteres)"
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

          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="passwordConfirm" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
              Confirmar contraseña
            </label>
            <input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Confirma tu contraseña"
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
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
      )}

      <div className={styles.footer}>
        <p className={styles.footerText}>¿Necesitas ayuda?</p>
        <a href="/login" className={styles.footerLink}>
          Vuelve al login
        </a>
      </div>
    </div>
  );
}
