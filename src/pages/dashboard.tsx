import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Moon, Sun, Plus, LogOut } from 'lucide-react';
import HabitCard from '../core/components/Auth/HabitCard';
import type { IHabito } from '../types/IHabito';
import { getAllHabitos, deleteHabito } from '../services/habito/habitoService';
import { recordHabitProgress, getHabitCurrentProgress } from '../services/habito/progressService';
import { getRachasMultiplesHabitos } from '../services/racha/rachaAutoService';
import './dashboard.css';
import CreateHabitoModal from '../core/components/Habito/CreateHabitoModal';
import EditHabitoModal from '../core/components/Habito/EditHabitoModal';
import RecordatorioConfig from '../core/components/Recordatorio/RecordatorioConfig';

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [habitos, setHabitos] = useState<IHabito[]>([]);
    const [habitosProgress, setHabitosProgress] = useState<Record<string, number>>({});
    const [habitosRachas, setHabitosRachas] = useState<Record<string, number>>({});
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [habitoEditando, setHabitoEditando] = useState<IHabito | null>(null);
    const [advancingHabitId, setAdvancingHabitId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [openRecordatorio, setOpenRecordatorio] = useState(false);
    const [habitoParaRecordatorio, setHabitoParaRecordatorio] = useState<IHabito | null>(null);

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

                // Detectar si alguna racha se rompió (comparar con el estado anterior)
                Object.keys(rachasMapNuevo).forEach(habitoId => {
                    const rachaAnterior = habitosRachas[habitoId] || 0;
                    const rachaNueva = rachasMapNuevo[habitoId] || 0;

                    // Si la racha anterior era > 0 y la nueva es 0, se rompió
                    if (rachaAnterior > 0 && rachaNueva === 0) {
                        const habito = mine.find(h => h.id_habito === habitoId);
                        setNotification({
                            message: `⚠️ Perdiste tu racha de ${rachaAnterior} día${rachaAnterior > 1 ? 's' : ''} en "${habito?.nombre_habito || 'un hábito'}"! Vuelve a empezar 💪`,
                            type: 'error',
                        });
                        setTimeout(() => setNotification(null), 5000);
                    }
                });

                setHabitosRachas(rachasMapNuevo);
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [navigate]);

    // Verificar rachas automáticamente cada 30 segundos
    useEffect(() => {
        if (!user || habitos.length === 0) return;

        const intervalId = setInterval(async () => {
            console.log('🔍 Verificando rachas automáticamente...');
            const habitoIds = habitos.map(h => h.id_habito);
            const rachasMapNuevo = await getRachasMultiplesHabitos(habitoIds);

            // Detectar rachas rotas
            Object.keys(rachasMapNuevo).forEach(habitoId => {
                const rachaAnterior = habitosRachas[habitoId] || 0;
                const rachaNueva = rachasMapNuevo[habitoId] || 0;

                if (rachaAnterior > 0 && rachaNueva === 0) {
                    const habito = habitos.find(h => h.id_habito === habitoId);
                    setNotification({
                        message: `⚠️ ¡Perdiste tu racha de ${rachaAnterior} día${rachaAnterior > 1 ? 's' : ''} en "${habito?.nombre_habito}"! No completaste el hábito a tiempo 😔`,
                        type: 'error',
                    });
                    setTimeout(() => setNotification(null), 6000);
                }
            });

            setHabitosRachas(rachasMapNuevo);
        }, 30000); // Verificar cada 30 segundos

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

    const handleAdvanceHabito = async (habito: IHabito) => {
        setAdvancingHabitId(habito.id_habito);
        try {
            const result = await recordHabitProgress(
                habito.id_habito,
                user.id,
                habito.intervalo_meta,
                habito.meta_repeticion,
                habito.dificultad
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

            // Actualizar progreso del hábito
            setHabitosProgress(prev => ({
                ...prev,
                [habito.id_habito]: result.newProgress,
            }));

            // Actualizar rachas SOLO si el hábito se completó y hay info de racha
            if (result.isComplete && result.rachaInfo) {
                setHabitosRachas(prev => ({
                    ...prev,
                    [habito.id_habito]: result.rachaInfo!.diasConsecutivos,
                }));
                console.log(`✅ Racha actualizada a ${result.rachaInfo.diasConsecutivos}`);
            } else {
                console.log(`⏳ Hábito no completado, racha no cambia`);
            }

            // Limpiar notificación después de 3 segundos
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

    return (
        <div className={`dashboard ${darkMode ? 'dark' : ''}`}>
            {/* 1. HEADER */}
            <header className="header">
                <div className="logo">
                    <span className="logoIcon">🌱</span>
                    <h1 className="logoText">HabitTracker</h1>
                </div>

                <div className="headerActions">
                    <button
                        className="themeToggle"
                        onClick={() => setDarkMode(!darkMode)}
                        aria-label="Cambiar tema"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <div className="userAvatar">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <button
                        className="logoutButton"
                        onClick={handleLogout}
                        aria-label="Cerrar sesión"
                        title="Cerrar sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>
            <main className="main">
                {loading ? (
                    <div className="loading">
                        <p>Cargando...</p>
                    </div>
                ) : (
                    <>
                        {/* Notificación flotante */}
                        {notification && (
                            <div className={`notification notification-${notification.type}`}>
                                {notification.message}
                            </div>
                        )}

                        {/* Sección de Título y Botón */}
                        <div className="titleSection">
                            <div>
                                <h2 className="title">Mis Hábitos</h2>
                                <p className="subtitle">¡Sigue así, vas por buen camino!</p>
                            </div>

                            <button className="createButton" onClick={() => setOpenCreate(true)}>
                                <Plus size={20} />
                                Crear Nuevo Hábito
                            </button>
                        </div>

                        {/* Grid de Hábitos */}
                        <div className="habitsGrid">
                            {habitos.length === 0 ? (
                                <div className="emptyState">
                                    <span className="emptyIcon">📝</span>
                                    <h3>No tienes hábitos aún</h3>
                                    <p>Comienza creando tu primer hábito</p>
                                </div>
                            ) : (
                                <>
                                    {habitos.map(h => (
                                        <HabitCard
                                            key={h.id_habito}
                                            habito={h}
                                            weeklyCount={habitosProgress[h.id_habito] || 0}
                                            streakDays={habitosRachas[h.id_habito] || 0}
                                            onDelete={() => handleDeleteHabito(h.id_habito)}
                                            onEdit={() => handleEditHabito(h)}
                                            onAdvance={() => handleAdvanceHabito(h)}
                                            isAdvancing={advancingHabitId === h.id_habito}
                                            onConfigureReminder={() => handleConfigureReminder(h)}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                        {/* Modal Crear Hábito */}
                        <CreateHabitoModal
                            userId={user.id}
                            open={openCreate}
                            onClose={() => setOpenCreate(false)}
                            onCreated={(h) => setHabitos(prev => [h, ...prev])}
                        />

                        {/* Modal Editar Hábito */}
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

                        {/* Modal Configurar Recordatorio */}
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
                    </>
                )}
            </main>
        </div >
    );
}
