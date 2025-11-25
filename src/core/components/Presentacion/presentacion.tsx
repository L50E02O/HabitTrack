import { useNavigate } from "react-router-dom";
import "./presentacion.css";
import { useEffect } from "react";
import { Calendar, Bell, TrendingUp, Award } from "lucide-react";

export default function Presentacion() {
	const navigate = useNavigate();

    useEffect(()=>{
        console.log("Presentacion montada");
    }, []);

	return (
		<div className="landing-page">
			{/* Header */}
			<header className="landing-header">
				<div className="landing-nav">
					<div className="landing-logo">
						<Calendar size={24} />
						<span>HabitTrack</span>
					</div>
					<div className="landing-nav-buttons">
						<button className="btn-secondary" onClick={() => navigate("/login")}>
							Iniciar sesión
						</button>
						<button className="btn-primary" onClick={() => navigate("/registro")}>
							Crear cuenta
						</button>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="landing-hero">
				<h1 className="landing-title">Construye hábitos que perduran.</h1>
				<p className="landing-subtitle">Organiza tus hábitos y sigue tus rachas día a día.</p>
				<div className="landing-hero-buttons">
					<button className="btn-primary btn-large" onClick={() => navigate("/registro")}>
						Crear cuenta
					</button>
					<button className="btn-secondary btn-large" onClick={() => navigate("/login")}>
						Iniciar sesión
					</button>
				</div>
			</section>

			{/* Features Section */}
			<section className="landing-features">
				<h2 className="landing-features-title">Todo lo que necesitas para alcanzar tus metas</h2>
				<p className="landing-features-subtitle">
					Herramientas diseñadas para ayudarte a construir una rutina sólida y mantener la motivación.
				</p>
				
				<div className="landing-features-grid">
					<div className="feature-card">
						<div className="feature-icon">
							<Calendar size={32} />
						</div>
						<h3>Organiza tus hábitos</h3>
						<p>Crea y categoriza tus hábitos fácilmente para mantener tu rutina clara y organizada.</p>
					</div>

					<div className="feature-card">
						<div className="feature-icon">
							<Bell size={32} />
						</div>
						<h3>Sigue tus rachas</h3>
						<p>Mantén tu motivación viendo cómo creces tus rachas día a día. ¡No rompas la cadena!</p>
					</div>

					<div className="feature-card">
						<div className="feature-icon">
							<TrendingUp size={32} />
						</div>
						<h3>Visualiza tu progreso</h3>
						<p>Con gráficas y estadísticas detalladas, visualiza tu crecimiento a lo largo del tiempo.</p>
					</div>

					<div className="feature-card">
						<div className="feature-icon">
							<Award size={32} />
						</div>
						<h3>Mantén la motivación</h3>
						<p>Recibe recompensas y reconocimientos que te ayudan a seguir adelante con tus hábitos.</p>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="landing-cta">
				<div className="landing-cta-content">
					<h2>¿Listo para empezar a construir tu mejor versión?</h2>
					<p>Únete a miles de usuarios que están transformando sus vidas, un hábito a la vez.</p>
					<button className="btn-primary btn-large" onClick={() => navigate("/registro")}>
						Empieza ahora, es gratis
					</button>
				</div>
			</section>

			{/* Footer */}
			<footer className="landing-footer">
				<p>© 2024 HabitTrack. Todos los derechos reservados.</p>
			</footer>
		</div>
	);
}