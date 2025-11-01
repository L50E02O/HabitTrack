import { useState } from "react";
import FormularioLogin from "../../core/components/Auth/fomularioLogin";
import { signIn } from "../../services/auth/authService";
import { useNavigate } from "react-router-dom";
import styles from "./loginPage.module.css";

export default function LoginPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (email: string, password: string) => {
        setError(null);
        setLoading(true);
        try {
            const data = await signIn(email, password);
            if (data?.user) {
                navigate("/dashboard");
            } else {
                setError("No se pudo iniciar sesión. Revisa tus credenciales.");
            }
        } catch (err: any) {
            setError(err?.message || "Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.iconContainer}>
                <span className={styles.icon}>🌱</span>
            </div>
            <h1>Bienvenido de nuevo</h1>
            <p className={styles.subtitle}>Inicia sesión para continuar tu progreso.</p>
            
            {error && <div className={styles.error} role="alert">{error}</div>}

            {loading ? (
                <div className={styles.loading}>Iniciando sesión...</div>
            ) : (
                <FormularioLogin onSubmit={handleLogin} />
            )}
            
            <div className={styles.footer}>
                <p className={styles.footerText}>¿No tienes una cuenta?</p>
                <a href="/registro" className={styles.footerLink}>Regístrate aquí</a>
            </div>
        </div>
    );
}
