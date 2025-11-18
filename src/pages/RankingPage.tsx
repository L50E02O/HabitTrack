import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Users, Award, Search, TrendingUp } from 'lucide-react';
import { supabase } from '../config/supabase';
import { obtenerRankingCompleto, obtenerEstadisticasUsuario } from '../services/ranking/rankingService';
import type { IUsuarioRanking, IEstadisticasRanking } from '../types/IRanking';
import { BadgeIcon } from '../core/components/Logro/BadgeIcon';
import { RANGOS } from '../core/constants/rangos';
import './RankingPage.css';

export default function RankingPage() {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState<IUsuarioRanking[]>([]);
    const [estadisticas, setEstadisticas] = useState<IEstadisticasRanking | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string>('');
    const [busqueda, setBusqueda] = useState('');
    const [darkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);

            // Obtener usuario actual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            setUserId(user.id);

            // Cargar estadísticas del usuario
            const stats = await obtenerEstadisticasUsuario(user.id);
            setEstadisticas(stats);

            // Cargar ranking completo - máximo 100 usuarios
            const ranking = await obtenerRankingCompleto(100);
            setUsuarios(ranking);
        } catch (error) {
            console.error('Error cargando ranking:', error);
        } finally {
            setLoading(false);
        }
    };

    const usuariosFiltrados = usuarios.filter(u => 
        u.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const handleVolver = () => {
        navigate('/dashboard');
    };

    return (
        <div className={`ranking-page ${darkMode ? '' : 'light'}`}>
            {/* Header */}
            <header className="ranking-page-header">
                <button className="btn-volver" onClick={handleVolver}>
                    <ArrowLeft size={20} />
                    Volver
                </button>

                <div className="header-title-section">
                    <Trophy className="trophy-icon" size={32} />
                    <div>
                        <h1>Clasificación Global</h1>
                        <p className="header-subtitle">Compite con otros usuarios</p>
                    </div>
                </div>
            </header>

            <div className="ranking-page-content">
                {/* Sidebar de estadísticas */}
                <aside className="ranking-sidebar">
                    {loading || !estadisticas ? (
                        <div className="sidebar-loading">
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <>
                            {/* Tu Rango Actual */}
                            <div className="stats-card tu-rango-card">
                                <h3 className="card-title">
                                    <Award size={20} />
                                    Tu Rango
                                </h3>
                                <div className="rango-display">
                                    <div 
                                        className="rango-badge-grande"
                                        style={{ background: `linear-gradient(135deg, ${estadisticas.rangoActual.color}, ${estadisticas.rangoActual.color}99)` }}
                                    >
                                        <BadgeIcon 
                                            iconName={estadisticas.rangoActual.icono} 
                                            size={64} 
                                            unlocked={true} 
                                        />
                                    </div>
                                    <h2 className="rango-nombre-grande" style={{ color: estadisticas.rangoActual.color }}>
                                        {estadisticas.rangoActual.nombre}
                                    </h2>
                                    <p className="rango-nivel">Nivel {estadisticas.rangoActual.nivel}</p>
                                </div>

                                {estadisticas.siguienteRango && (
                                    <div className="siguiente-rango-info">
                                        <p className="siguiente-label">Siguiente rango:</p>
                                        <p className="siguiente-nombre" style={{ color: estadisticas.siguienteRango.color }}>
                                            {estadisticas.siguienteRango.nombre}
                                        </p>
                                        <div className="progreso-barra-lateral">
                                            <div 
                                                className="progreso-fill-lateral"
                                                style={{ 
                                                    width: `${estadisticas.progresoRango}%`,
                                                    background: `linear-gradient(90deg, ${estadisticas.rangoActual.color}, ${estadisticas.siguienteRango.color})`
                                                }}
                                            />
                                        </div>
                                        <p className="puntos-faltantes">
                                            {estadisticas.puntosParaSiguienteRango} puntos restantes
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Estadísticas Generales */}
                            <div className="stats-card estadisticas-card">
                                <h3 className="card-title">
                                    <Users size={20} />
                                    Estadísticas
                                </h3>
                                <div className="stats-grid">
                                    <div className="stat-item-card">
                                        <p className="stat-label">Tu Posición</p>
                                        <p className="stat-value">#{estadisticas.tuPosicion}</p>
                                    </div>
                                    <div className="stat-item-card">
                                        <p className="stat-label">Jugadores</p>
                                        <p className="stat-value">{estadisticas.totalUsuarios}</p>
                                    </div>
                                    <div className="stat-item-card percentil">
                                        <p className="stat-label">Percentil</p>
                                        <p className="stat-value">
                                            Top {Math.round((estadisticas.tuPosicion / estadisticas.totalUsuarios) * 100)}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Todos los Rangos */}
                            <div className="stats-card rangos-card">
                                <h3 className="card-title">
                                    <TrendingUp size={20} />
                                    Todos los Rangos
                                </h3>
                                <div className="rangos-lista">
                                    {RANGOS.map((rango) => (
                                        <div 
                                            key={rango.nivel} 
                                            className={`rango-item-mini ${estadisticas.rangoActual.nivel === rango.nivel ? 'activo' : ''}`}
                                        >
                                            <div className="rango-icon-mini" style={{ background: rango.color }}>
                                                <BadgeIcon iconName={rango.icono} size={20} unlocked={true} />
                                            </div>
                                            <div className="rango-info-mini">
                                                <p className="rango-nombre-mini" style={{ color: rango.color }}>
                                                    {rango.nombre}
                                                </p>
                                                <p className="rango-puntos-mini">
                                                    {rango.puntosMinimos}
                                                    {rango.puntosMaximos !== Infinity && ` - ${rango.puntosMaximos}`}
                                                    {rango.puntosMaximos === Infinity && '+'} pts
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </aside>

                {/* Contenido principal - Tabla de clasificación */}
                <main className="ranking-main">
                    {/* Controles */}
                    <div className="ranking-controles">
                        <div className="busqueda-container">
                            <Search className="search-icon" size={18} />
                            <input 
                                type="text"
                                placeholder="Buscar usuario..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="busqueda-input"
                            />
                        </div>

                        <div className="total-usuarios-badge">
                            <Users size={16} />
                            {usuarios.length} usuarios
                        </div>
                    </div>

                    {/* Tabla de Ranking */}
                    {loading ? (
                        <div className="ranking-loading">
                            <div className="spinner-grande"></div>
                            <p>Cargando clasificación...</p>
                        </div>
                    ) : (
                        <div className="ranking-tabla-container">
                            <table className="ranking-tabla">
                                <thead>
                                    <tr>
                                        <th className="col-posicion">Pos.</th>
                                        <th className="col-usuario">Usuario</th>
                                        <th className="col-rango">Rango</th>
                                        <th className="col-puntos">Puntos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuariosFiltrados.map((usuario) => (
                                        <tr 
                                            key={usuario.id} 
                                            className={`tabla-fila ${usuario.id === userId ? 'tu-fila' : ''} posicion-${usuario.posicion}`}
                                        >
                                            <td className="col-posicion">
                                                {usuario.posicion === 1 && <Trophy className="medalla oro" size={20} />}
                                                {usuario.posicion === 2 && <Trophy className="medalla plata" size={20} />}
                                                {usuario.posicion === 3 && <Trophy className="medalla bronce" size={20} />}
                                                {usuario.posicion > 3 && <span className="numero-posicion">#{usuario.posicion}</span>}
                                            </td>
                                            <td className="col-usuario">
                                                <div className="usuario-info-tabla">
                                                    <div className="avatar-tabla" style={{ background: usuario.rango.color }}>
                                                        {usuario.foto_perfil ? (
                                                            <img src={usuario.foto_perfil} alt={usuario.nombre} />
                                                        ) : (
                                                            <span>{usuario.nombre.charAt(0).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div className="nombre-container">
                                                        <p className="nombre-usuario">{usuario.nombre}</p>
                                                        {usuario.id === userId && <span className="badge-tu">TÚ</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="col-rango">
                                                <div className="rango-tabla">
                                                    <div className="rango-icon-tabla" style={{ background: usuario.rango.color }}>
                                                        <BadgeIcon iconName={usuario.rango.icono} size={24} unlocked={true} />
                                                    </div>
                                                    <span className="rango-nombre-tabla" style={{ color: usuario.rango.color }}>
                                                        {usuario.rango.nombre}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="col-puntos">
                                                <span className="puntos-tabla">{usuario.puntos}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {usuariosFiltrados.length === 0 && (
                                <div className="no-resultados">
                                    <Search size={48} />
                                    <p>No se encontraron usuarios</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
