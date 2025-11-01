import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Moon, Sun, Plus, LogOut } from 'lucide-react';
import HabitCard from '../core/components/Auth/HabitCard';
import type { IHabito } from '../types/IHabito';
import { getAllHabitos, deleteHabito } from '../services/habito/habitoService';
import './dashboard.css';
import CreateHabitoModal from '../core/components/Habito/CreateHabitoModal';

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [habitos, setHabitos] = useState<IHabito[]>([]);
    const [openCreate, setOpenCreate] = useState(false);

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
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [navigate]);

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
                                            onDelete={() => handleDeleteHabito(h.id_habito)}
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
                    </>
                )}
            </main>
        </div >
    );
}
