import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormularioRegistro from "../../core/components/Auth/formularioRegistro";
import { signUp } from "../../services/auth/authService";
import { createPerfil } from "../../services/perfil/perfilService";
import styles from "./registroPage.module.css";
 
export default function RegistroPage() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleRegister = async (payload: { email: string; password: string; nombre: string; }) => {
		setError(null);
		setLoading(true);
		try {
			// Registrar en Supabase Auth
			const data = await signUp(payload.email, payload.password);

			const user = (data as any)?.user;
			if (!user) {
				throw new Error("No se obtuvo el usuario tras el registro");
			}

			const perfil = { id: user.id, nombre: payload.nombre, puntos: 0, protectores_racha: 0};

			// Crear el perfil del usuario
			await createPerfil(perfil);

			// Mostrar un mensaje para decirle al usuario que revise su email para verificar su correo
			alert("Por favor, revisa tu correo electrónico para verificar tu cuenta.");
		} catch (err: any) {
			setError(err?.message || "Error al registrar usuario");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={styles.authPage}>
			<div className={styles.iconContainer}>
				<span className={styles.icon}>✓</span>
			</div>
			<h1>Crea tu cuenta</h1>
			<p className={styles.subtitle}>Únete para empezar a construir hábitos saludables.</p>
			
			{error && (
				<div className={styles.error} role="alert">
					{error}
				</div>
			)}

			{loading ? (
				<div className={styles.loading}>Registrando...</div>
			) : (
				<FormularioRegistro onSubmit={handleRegister} />
			)}
			
			<div className={styles.footer}>
				<span className={styles.footerText}>¿Ya tienes una cuenta?</span>
				<a onClick={() => navigate('/login')} role="button" tabIndex={0} className={styles.footerLink}>Inicia sesión</a>
			</div>
		</div>
	);
}
