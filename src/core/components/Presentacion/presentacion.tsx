import { useNavigate } from "react-router-dom";
import "./presentacion.css";
import { useEffect } from "react";
import { Sprout } from "lucide-react";

export default function Presentacion() {
	const navigate = useNavigate();

    useEffect(()=>{
        console.log("Presentacion montada");
    }, []);

	return (
		<div className="pt-container">
			<div className="pt-hero">
				<Sprout size={48} className="pt-icon" />
				<h1 className="pt-title">HabitTrack</h1>
				<p className="pt-subtitle">Organiza tus hábitos y sigue tus rachas día a día.</p>

				<div className="pt-actions">
					<button className="pt-primary" onClick={() => navigate("/login")}>
						Iniciar sesión
					</button>
					<button className="pt-secondary" onClick={() => navigate("/registro")}>
						Crear cuenta
					</button>
				</div>
			</div>
		</div>
	);
}