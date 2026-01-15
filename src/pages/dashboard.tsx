import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Moon, Sun, Plus, LogOut, ChevronRight, ShoppingCart, Sprout, Calendar, Trophy, Activity } from 'lucide-react';
import HabitCard from '../core/components/Habito/HabitCard/HabitCard.tsx';
import type { IHabito } from '../types/IHabito';
import { getAllHabitos, deleteHabito } from '../services/habito/habitoService';
import { recordHabitProgress, getHabitCurrentProgress } from '../services/habito/progressService';
import { recalcularRachaMaxima } from '../services/racha/rachaAutoService';
import { getRachasMultiplesHabitos } from '../services/racha/rachaAutoService';
import { programarNotificacionesDiarias, cancelarProgramacionNotificaciones } from '../services/recordatorio/notificacionService';
import {
    asignarProtectorAHabito,
    quitarProtectorDeHabito,
    getProtectoresPorHabito,
    getProtectoresActuales,
    getPuntosActuales
} from '../services/protector/protectorService';
import { obtenerEstadisticasUsuario } from '../services/ranking/rankingService';
import './dashboard.css';
import CreateHabitoModal from '../core/components/Habito/CreateHabitoModal/CreateHabitoModal.tsx';
import EditHabitoModal from '../core/components/Habito/EditHabitoModal/EditHabitoModal.tsx';
import RecordatorioConfig from '../core/components/Recordatorio/RecordatorioConfig';
import RecordatorioList from '../core/components/Recordatorio/RecordatorioList';
import LogrosModal from '../core/components/Logro/LogrosModal';
import TiendaProtectores from '../core/components/Protector/TiendaProtectores';
import RankingWidget from '../core/components/Ranking/RankingWidget';
import RankUpModal from '../core/components/Ranking/RankUpModal';
import CalendarioModal from '../core/components/Calendario/CalendarioModal';
import SmartwatchModal from '../core/components/Smartwatch/SmartwatchModal';
import { useRankDetection } from '../hooks/useRankDetection';
import { PermisosNotificacion } from '../components/PermisosNotificacion';
import { InstallPWAButton } from '../components/InstallPWAButton';

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : true;
    });
    const [habitos, setHabitos] = useState<IHabito[]>([]);
    const [habitosProgress, setHabitosProgress] = useState<Record<string, number>>({});
    const [habitosRachas, setHabitosRachas] = useState<Record<string, number>>({});
    const [habitosProtectores, setHabitosProtectores] = useState<Record<string, number>>({});
    const [protectoresDisponibles, setProtectoresDisponibles] = useState<number>(0);
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [habitoEditando, setHabitoEditando] = useState<IHabito | null>(null);
    const [advancingHabitId, setAdvancingHabitId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [openRecordatorio, setOpenRecordatorio] = useState(false);
    const [habitoParaRecordatorio, setHabitoParaRecordatorio] = useState<IHabito | null>(null);
    const [openLogros, setOpenLogros] = useState(false);
    const [openTienda, setOpenTienda] = useState(false);
    const [openCalendario, setOpenCalendario] = useState(false);
    const [openRanking, setOpenRanking] = useState(false);
    const [openSmartwatch, setOpenSmartwatch] = useState(false);
    const [tuPosicion, setTuPosicion] = useState<number | null>(null);
    const [puntosUsuario, setPuntosUsuario] = useState(0);
    const notificacionesIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Hook para detectar cambios de rango
    const { rangoAnterior, rangoActual, huboRankUp, resetRankUp } = useRankDetection(puntosUsuario);

    // Sincronizar tema oscuro con localStorage
    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    useEffect(() => {
        const run = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                navigate('/login');
                return;
            }

            setUser(session.user);

            try {
                const all = await getAllHabitos();
                const mine = (all || []).filter(h => h.id_perfil === session.user.id);
                setHabitos(mine);

                // Cargar progreso de cada hábito
                const progressMap: Record<string, number> = {};
                for (const habito of mine) {
                    const progress = await getHabitCurrentProgress(habito.id_habito, habito.intervalo_meta);
                    progressMap[habito.id_habito] = progress;
                }
                setHabitosProgress(progressMap);

                // Cargar rachas de todos los hábitos
                const habitoIds = mine.map(h => h.id_habito);
                const rachasMapNuevo = await getRachasMultiplesHabitos(habitoIds);
                setHabitosRachas(rachasMapNuevo);

                // Cargar protectores asignados a cada hábito
                const protectoresMap: Record<string, number> = {};
                for (const habito of mine) {
                    const protectores = await getProtectoresPorHabito(session.user.id, habito.id_habito);
                    protectoresMap[habito.id_habito] = protectores;
                }
                setHabitosProtectores(protectoresMap);

                // Cargar protectores disponibles del usuario
                const protectoresDisp = await getProtectoresActuales(session.user.id);
                setProtectoresDisponibles(protectoresDisp);

                // Cargar puntos del usuario para detección de rango
                const puntosActuales = await getPuntosActuales(session.user.id);
                setPuntosUsuario(puntosActuales);

                // Cargar posición en el ranking
                const stats = await obtenerEstadisticasUsuario(session.user.id);
                setTuPosicion(stats.tuPosicion);

                // Inicializar notificaciones programadas
                const intervalId = programarNotificacionesDiarias(session.user.id);
                notificacionesIntervalRef.current = intervalId;

                // Recalcular racha máxima del usuario al entrar al dashboard
                await recalcularRachaMaxima(session.user.id);
            } catch (error) {
                console.error('Error al cargar datos iniciales:', error);
            } finally {
                setLoading(false);
            }
        };

        run();

        return () => {
            if (notificacionesIntervalRef.current) {
                cancelarProgramacionNotificaciones(notificacionesIntervalRef.current);
                notificacionesIntervalRef.current = null;
            }
        };
    }, [navigate]);

    // Recargar rachas periódicamente
    useEffect(() => {
        if (!user || habitos.length === 0) return;

        const intervalId = setInterval(async () => {
            const habitoIds = habitos.map(h => h.id_habito);
            const rachasMapNuevo = await getRachasMultiplesHabitos(habitoIds);

            // Detectar rachas rotas
            Object.keys(rachasMapNuevo).forEach(habitoId => {
                const rachaAnterior = habitosRachas[habitoId] || 0;
                const rachaNueva = rachasMapNuevo[habitoId] || 0;

                if (rachaAnterior > 0 && rachaNueva === 0) {
                    const habito = habitos.find(h => h.id_habito === habitoId);
                    setNotification({
                        message: `Has perdido tu racha de ${rachaAnterior} día${rachaAnterior > 1 ? 's' : ''} en "${habito?.nombre_habito}". No se completó el hábito a tiempo.`,
                        type: 'error',
                    });
                    setTimeout(() => setNotification(null), 6000);
                }
            });

            setHabitosRachas(rachasMapNuevo);
        }, 30000);

        return () => clearInterval(intervalId);
    }, [user, habitos, habitosRachas]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleDeleteHabito = async (id: string) => {
        try {
            await deleteHabito(id);
            setHabitos(prev => prev.filter(h => h.id_habito !== id));
        } catch (err) {
            console.error('Error al eliminar hábito:', err);
        }
    };

    const handleEditHabito = (habito: IHabito) => {
        setHabitoEditando(habito);
        setOpenEdit(true);
    };

    const handleHabitoActualizado = (habitoActualizado: IHabito) => {
        setHabitos(prev =>
            prev.map(h => h.id_habito === habitoActualizado.id_habito ? habitoActualizado : h)
        );
        setOpenEdit(false);
        setHabitoEditando(null);
    };

    const handleConfigureReminder = (habito: IHabito) => {
        setHabitoParaRecordatorio(habito);
        setOpenRecordatorio(true);
    };

    const handleAdvanceHabito = async (habito: IHabito, cantidad: number = 1) => {
        setAdvancingHabitId(habito.id_habito);
        try {
            const result = await recordHabitProgress(
                habito.id_habito,
                user.id,
                habito.intervalo_meta,
                habito.meta_repeticion,
                habito.dificultad,
                cantidad
            );

            if (!result.success) {
                setNotification({
                    message: result.message,
                    type: 'error',
                });
                setTimeout(() => setNotification(null), 3000);
                return;
            }

            setNotification({
                message: result.message,
                type: 'success',
            });

            setHabitosProgress(prev => ({
                ...prev,
                [habito.id_habito]: result.newProgress,
            }));

            const habitoIds = habitos.map(h => h.id_habito);
            const rachasActualizadas = await getRachasMultiplesHabitos(habitoIds);
            setHabitosRachas(rachasActualizadas);

            const puntosActuales = await getPuntosActuales(user.id);
            setPuntosUsuario(puntosActuales);

            const stats = await obtenerEstadisticasUsuario(user.id);
            setTuPosicion(stats.tuPosicion);

            setTimeout(() => setNotification(null), 3000);
        } catch (err: any) {
            setNotification({
                message: err?.message || 'Error al avanzar en el hábito',
                type: 'error',
            });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setAdvancingHabitId(null);
        }
    };

    const handleAsignarProtector = async (habito: IHabito) => {
        if (protectoresDisponibles <= 0) {
            setNotification({
                message: 'No tienes protectores disponibles.',
                type: 'error',
            });
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        try {
            const result = await asignarProtectorAHabito(user.id, habito.id_habito, 1);
            if (result.success) {
                setNotification({
                    message: `Protector asignado a "${habito.nombre_habito}"`,
                    type: 'success',
                });
                setHabitosProtectores(prev => ({
                    ...prev,
                    [habito.id_habito]: (prev[habito.id_habito] || 0) + 1,
                }));
                setProtectoresDisponibles(prev => prev - 1);
            }
            setTimeout(() => setNotification(null), 3000);
        } catch (err: any) {
            setNotification({
                message: err?.message || 'Error al asignar protector',
                type: 'error',
            });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleQuitarProtector = async (habito: IHabito) => {
        const protectoresActuales = habitosProtectores[habito.id_habito] || 0;
        if (protectoresActuales <= 0) return;

        try {
            const result = await quitarProtectorDeHabito(user.id, habito.id_habito, 1);
            if (result.success) {
                setNotification({
                    message: `Protector removido de "${habito.nombre_habito}"`,
                    type: 'success',
                });
                setHabitosProtectores(prev => ({
                    ...prev,
                    [habito.id_habito]: Math.max(0, (prev[habito.id_habito] || 0) - 1),
                }));
                setProtectoresDisponibles(prev => prev + 1);
            }
            setTimeout(() => setNotification(null), 3000);
        } catch (err: any) {
            setNotification({
                message: err?.message || 'Error al quitar protector',
                type: 'error',
            });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    return (
        <div className={`dashboard ${darkMode ? 'dark' : ''}`}>
            <PermisosNotificacion />

            {/* Botones flotantes */}
            <button
                className="floating-smartwatch-button"
                onClick={() => setOpenSmartwatch(true)}
                title="Smartwatch"
            >
                <Activity size={24} />
            </button>

            <button
                className="floating-ranking-button"
                onClick={() => setOpenRanking(true)}
                title="Ver clasificación"
            >
                <Trophy size={24} />
                {tuPosicion !== null && <span className="position-badge">#{tuPosicion}</span>}
            </button>

            <button
                className="floating-calendario-button"
                onClick={() => setOpenCalendario(true)}
                title="Ver calendario de rachas"
            >
                <Calendar size={24} />
            </button>

            <button
                className="floating-protectores-button"
                onClick={() => setOpenTienda(true)}
                title="Tienda de Protectores"
            >
                <ShoppingCart size={24} />
            </button>

            <button
                className="floating-logros-button"
                onClick={() => setOpenLogros(true)}
                title="Ver mis logros"
            >
                <ChevronRight size={24} />
            </button>

            <header className="header">
                <div className="logo">
                    <span className="logoIcon"><Sprout size={24} /></span>
                    <h1 className="logoText">HabitTrack</h1>
                </div>

                <div className="headerActions">
                    <InstallPWAButton />
                    <button className="themeToggle" onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <div className="userAvatar">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <button className="logoutButton" onClick={handleLogout}>
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="main">
                {loading ? (
                    <div className="loading"><p>Cargando...</p></div>
                ) : (
                    <>
                        {notification && (
                            <div className={`notification notification-${notification.type}`}>
                                {notification.message}
                            </div>
                        )}

                        <div className="titleSection">
                            <div>
                                <h2 className="title">Mis Hábitos</h2>
                                <p className="subtitle">¡Sigue así, vas por buen camino!</p>
                            </div>
                            <button className="createButton" onClick={() => setOpenCreate(true)}>
                                <Plus size={20} /> Crear Nuevo Hábito
                            </button>
                        </div>

                        {/* Grid de Hábitos */}
                        <div className="habitsGrid">
                            {habitos.length === 0 ? (
                                <div className="emptyState">
                                    <span className="emptyIcon">-</span>
                                    <h3>No tienes hábitos aún</h3>
                                    <p>Comienza creando tu primer hábito</p>
                                </div>
                            ) : (
                                habitos.map(h => (
                                    <HabitCard
                                        key={h.id_habito}
                                        habito={h}
                                        weeklyCount={habitosProgress[h.id_habito] || 0}
                                        streakDays={habitosRachas[h.id_habito] || 0}
                                        protectoresAsignados={habitosProtectores[h.id_habito] || 0}
                                        onDelete={() => handleDeleteHabito(h.id_habito)}
                                        onEdit={() => handleEditHabito(h)}
                                        onAdvance={() => handleAdvanceHabito(h)}
                                        onAdvanceWithAmount={(cantidad) => handleAdvanceHabito(h, cantidad)}
                                        isAdvancing={advancingHabitId === h.id_habito}
                                        onConfigureReminder={() => handleConfigureReminder(h)}
                                        onAsignarProtector={() => handleAsignarProtector(h)}
                                        onQuitarProtector={() => handleQuitarProtector(h)}
                                    />
                                ))
                            )}
                        </div>

                        {habitos.length > 0 && (
                            <div className="recordatorios-section">
                                <RecordatorioList />
                            </div>
                        )}

                        <CreateHabitoModal
                            userId={user.id}
                            open={openCreate}
                            onClose={() => setOpenCreate(false)}
                            onCreated={(h) => setHabitos(prev => [h, ...prev])}
                            habitosActuales={habitos.length}
                        />

                        {habitoEditando && (
                            <EditHabitoModal
                                habito={habitoEditando}
                                open={openEdit}
                                onClose={() => {
                                    setOpenEdit(false);
                                    setHabitoEditando(null);
                                }}
                                onUpdated={handleHabitoActualizado}
                            />
                        )}

                        {openRecordatorio && habitoParaRecordatorio && (
                            <RecordatorioConfig
                                habitoId={habitoParaRecordatorio.id_habito}
                                nombreHabito={habitoParaRecordatorio.nombre_habito}
                                onClose={() => {
                                    setOpenRecordatorio(false);
                                    setHabitoParaRecordatorio(null);
                                }}
                            />
                        )}

                        {openLogros && user && (
                            <LogrosModal
                                isOpen={openLogros}
                                onClose={() => setOpenLogros(false)}
                                userId={user.id}
                            />
                        )}

                        {openTienda && user && (
                            <TiendaProtectores
                                isOpen={openTienda}
                                onClose={() => setOpenTienda(false)}
                                userId={user.id}
                                onCompraExitosa={async () => {
                                    const protectoresDisp = await getProtectoresActuales(user.id);
                                    setProtectoresDisponibles(protectoresDisp);
                                }}
                            />
                        )}

                        {openCalendario && user && (
                            <CalendarioModal
                                isOpen={openCalendario}
                                onClose={() => setOpenCalendario(false)}
                                userId={user.id}
                                darkMode={darkMode}
                                onEditHabito={(habitoId) => {
                                    const habito = habitos.find(h => h.id_habito === habitoId);
                                    if (habito) {
                                        setHabitoEditando(habito);
                                        setOpenEdit(true);
                                        setOpenCalendario(false);
                                    }
                                }}
                            />
                        )}

                        <RankingWidget
                            userId={user.id}
                            isOpen={openRanking}
                            onClose={() => setOpenRanking(false)}
                            onVerCompleto={() => navigate('/ranking')}
                        />

                        <SmartwatchModal
                            userId={user.id}
                            isOpen={openSmartwatch}
                            onClose={() => setOpenSmartwatch(false)}
                            darkMode={darkMode}
                        />

                        {huboRankUp && rangoAnterior && rangoActual && (
                            <RankUpModal
                                nuevoRango={rangoActual}
                                rangoAnterior={rangoAnterior}
                                isOpen={huboRankUp}
                                onClose={resetRankUp}
                            />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
