import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Award, X, ChevronRight } from 'lucide-react';
import { obtenerTopUsuarios, obtenerEstadisticasUsuario } from '../../../services/ranking/rankingService';
import type { IUsuarioRanking, IEstadisticasRanking } from '../../../types/IRanking';
import { BadgeIcon } from '../Logro/BadgeIcon';
import './RankingWidget.css';

interface RankingWidgetProps {
    userId: string;
    onVerCompleto?: () => void;
}

export default function RankingWidget({ userId, onVerCompleto }: RankingWidgetProps) {
    const [topUsuarios, setTopUsuarios] = useState<IUsuarioRanking[]>([]);
    const [estadisticas, setEstadisticas] = useState<IEstadisticasRanking | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandido, setExpandido] = useState(false);

    useEffect(() => {
        if (userId) {
            cargarDatos();
        }
    }, [userId]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [top, stats] = await Promise.all([
                obtenerTopUsuarios(5),
                obtenerEstadisticasUsuario(userId)
            ]);
            setTopUsuarios(top);
            setEstadisticas(stats);
        } catch (error) {
            console.error('Error cargando ranking:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !estadisticas) {
        return (
            <button 
                className="ranking-float-button loading"
                disabled
                aria-label="Cargando ranking"
            >
                <Trophy size={24} />
            </button>
        );
    }

    const { rangoActual, siguienteRango, progresoRango, puntosParaSiguienteRango, tuPosicion, totalUsuarios } = estadisticas;

    return (
        <>
            {/* Botón flotante (bolita) */}
            <button 
                className="ranking-float-button"
                onClick={() => setExpandido(!expandido)}
                aria-label="Ver ranking"
            >
                <Trophy size={24} />
                <span className="position-badge">#{tuPosicion}</span>
            </button>

            {/* Panel expandido */}
            {expandido && (
                <div className="ranking-widget-expanded">
                    {/* Header con cierre */}
                    <div className="ranking-header-expanded">
                        <div className="header-content">
                            <Trophy className="header-icon" size={20} />
                            <span className="header-title">Clasificación</span>
                        </div>
                        <button className="close-btn" onClick={() => setExpandido(false)} aria-label="Cerrar">
                            <X size={20} />
                        </button>
                    </div>

                <div className="ranking-content-expanded">
                    {/* Tu Rango Actual */}
                    <div className="tu-rango-section">
                        <div className="rango-header">
                            <div className="rango-icon-container" style={{ background: `linear-gradient(135deg, ${rangoActual.color}, ${rangoActual.color}99)` }}>
                                <BadgeIcon iconName={rangoActual.icono} size={32} unlocked={true} />
                            </div>
                            <div className="rango-info">
                                <h3 className="rango-nombre" style={{ color: rangoActual.color }}>
                                    {rangoActual.nombre}
                                </h3>
                                <p className="rango-posicion">#{tuPosicion} de {totalUsuarios}</p>
                            </div>
                        </div>

                        {/* Progreso al siguiente rango */}
                        {siguienteRango && (
                            <div className="progreso-rango">
                                <div className="progreso-header">
                                    <span className="progreso-label">
                                        Siguiente: {siguienteRango.nombre}
                                    </span>
                                    <span className="progreso-puntos">
                                        {puntosParaSiguienteRango} pts
                                    </span>
                                </div>
                                <div className="progreso-bar">
                                    <div 
                                        className="progreso-fill" 
                                        style={{ 
                                            width: `${progresoRango}%`,
                                            background: `linear-gradient(90deg, ${rangoActual.color}, ${siguienteRango.color})`
                                        }}
                                    >
                                        <span className="progreso-porcentaje">{progresoRango}%</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!siguienteRango && (
                            <div className="rango-maximo">
                                <Award size={16} />
                                <span>¡Rango Máximo Alcanzado!</span>
                            </div>
                        )}
                    </div>

                    {/* Top 5 Usuarios */}
                    <div className="top-usuarios-section">
                        <h4 className="section-title">
                            <TrendingUp size={16} />
                            Top 5 Jugadores
                        </h4>
                        <div className="top-lista">
                            {topUsuarios.map((usuario) => (
                                <div 
                                    key={usuario.id} 
                                    className={`top-item ${usuario.id === userId ? 'tu-usuario' : ''} posicion-${usuario.posicion}`}
                                >
                                    <div className="item-posicion">
                                        {usuario.posicion === 1 && <Trophy size={16} className="medalla oro" />}
                                        {usuario.posicion === 2 && <Trophy size={16} className="medalla plata" />}
                                        {usuario.posicion === 3 && <Trophy size={16} className="medalla bronce" />}
                                        {usuario.posicion > 3 && <span className="numero">#{usuario.posicion}</span>}
                                    </div>

                                    <div className="item-avatar" style={{ background: usuario.rango.color }}>
                                        {usuario.foto_perfil ? (
                                            <img src={usuario.foto_perfil} alt={usuario.nombre} />
                                        ) : (
                                            <span>{usuario.nombre.charAt(0).toUpperCase()}</span>
                                        )}
                                    </div>

                                    <div className="item-info">
                                        <p className="item-nombre">{usuario.nombre}</p>
                                        <p className="item-rango" style={{ color: usuario.rango.color }}>
                                            {usuario.rango.nombre}
                                        </p>
                                    </div>

                                    <div className="item-puntos">
                                        {usuario.puntos}
                                        <span className="puntos-label">pts</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Botón Ver Completo */}
                        <button className="btn-ver-completo" onClick={onVerCompleto}>
                            Ver Clasificación Completa
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
                </div>
            )}
        </>
    );
}
