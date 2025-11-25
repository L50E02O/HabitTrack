import { useState } from "react";
import FormularioLogin from "../../core/components/Auth/fomularioLogin";
import { signIn } from "../../services/auth/authService";
import { useNavigate } from "react-router-dom";
import styles from "./loginPage.module.css";
import { Sprout, ArrowLeft } from "lucide-react";

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

    const handleRegistro = async () => {
        navigate("/registro");
    };

    return (
        <div className={styles.authPage}>
            <button 
                className={styles.backButton}
                onClick={() => navigate("/")}
                aria-label="Volver al inicio"
                title="Volver al inicio"
            >
                <ArrowLeft size={20} />
                <span>Volver</span>
            </button>
            
            <div className={styles.iconContainer}>
                <span className={styles.icon}>
                    <Sprout size={24} />
                    
                </span>
            </div>
            <h1>Bienvenido</h1>
            <p className={styles.subtitle}>Inicia sesión para continuar tu progreso.</p>
            
            {error && <div className={styles.error} role="alert">{error}</div>}

            {loading ? (
                <div className={styles.loading}>Iniciando sesión...</div>
            ) : (
                <FormularioLogin onSubmit={handleLogin} />
            )}
            
            <div className={styles.footer}>
                <p className={styles.footerText}>¿No tienes una cuenta?</p>
                <a onClick={handleRegistro} className={styles.footerLink}>Regístrate aquí</a>
            </div>
        </div>
    );
}
