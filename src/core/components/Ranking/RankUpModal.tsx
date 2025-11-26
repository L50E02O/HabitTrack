import { useEffect, useState } from 'react';
import { TrendingUp, X } from 'lucide-react';
import { BadgeIcon } from '../Logro/BadgeIcon';
import type { IRango } from '../../../types/IRanking';
import './RankUpModal.css';

interface RankUpModalProps {
    nuevoRango: IRango;
    rangoAnterior: IRango;
    isOpen: boolean;
    onClose: () => void;
}

export default function RankUpModal({ nuevoRango, rangoAnterior, isOpen, onClose }: RankUpModalProps) {
    const [mostrar, setMostrar] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMostrar(true);
            // Cerrar automáticamente después de 5 segundos
            const timer = setTimeout(() => {
                handleClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleClose = () => {
        setMostrar(false);
        setTimeout(onClose, 300); // Esperar animación de salida
    };

    if (!isOpen) return null;

    return (
        <div className={`rankup-overlay ${mostrar ? 'show' : ''}`} onClick={handleClose}>
            <div className={`rankup-modal ${mostrar ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
                {/* Botón cerrar */}
                <button className="rankup-close" onClick={handleClose}>
                    <X size={20} />
                </button>

                {/* Confetti */}
                <div className="rankup-confetti">
                    {[...Array(30)].map((_, i) => (
                        <div 
                            key={i} 
                            className="confetti-piece"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 0.5}s`,
                                background: `hsl(${Math.random() * 360}, 70%, 60%)`
                            }}
                        />
                    ))}
                </div>

                {/* Contenido */}
                <div className="rankup-content">
                    <div className="rankup-header">
                        <TrendingUp className="rankup-icon" size={32} />
                        <h2 className="rankup-title">¡Subiste de Rango!</h2>
                    </div>

                    {/* Transición de rangos */}
                    <div className="rankup-transition">
                        {/* Rango anterior */}
                        <div className="rango-box anterior">
                            <div 
                                className="rango-badge-transition"
                                style={{ background: `linear-gradient(135deg, ${rangoAnterior.color}, ${rangoAnterior.color}99)` }}
                            >
                                <BadgeIcon iconName={rangoAnterior.icono} size={48} unlocked={true} />
                            </div>
                            <p className="rango-nombre-transition" style={{ color: rangoAnterior.color }}>
                                {rangoAnterior.nombre}
                            </p>
                            <p className="rango-nivel-transition">Nivel {rangoAnterior.nivel}</p>
                        </div>

                        {/* Flecha */}
                        <div className="rankup-arrow">
                            <TrendingUp size={32} />
                        </div>

                        {/* Rango nuevo */}
                        <div className="rango-box nuevo">
                            <div 
                                className="rango-badge-transition rango-nuevo-badge"
                                style={{ background: `linear-gradient(135deg, ${nuevoRango.color}, ${nuevoRango.color}99)` }}
                            >
                                <BadgeIcon iconName={nuevoRango.icono} size={48} unlocked={true} />
                            </div>
                            <p className="rango-nombre-transition nuevo" style={{ color: nuevoRango.color }}>
                                {nuevoRango.nombre}
                            </p>
                            <p className="rango-nivel-transition">Nivel {nuevoRango.nivel}</p>
                        </div>
                    </div>

                    {/* Mensaje */}
                    <div className="rankup-mensaje">
                        <p className="mensaje-principal">
                            ¡Felicidades! Has alcanzado el rango <strong style={{ color: nuevoRango.color }}>{nuevoRango.nombre}</strong>
                        </p>
                        <p className="mensaje-secundario">
                            Sigue así y alcanza nuevos niveles.
                        </p>
                    </div>

                    {/* Botón */}
                    <button className="rankup-btn" onClick={handleClose}>
                        ¡Genial!
                    </button>
                </div>
            </div>
        </div>
    );
}
