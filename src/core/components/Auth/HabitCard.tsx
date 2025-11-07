import './HabitCard.css';
import { Flame, MoreVertical, Trash2, Edit2, CheckCircle, Bell } from 'lucide-react';
import type { IHabito } from '../../../types/IHabito';
import { useState } from 'react';

type Props = {
    habito: IHabito;
    weeklyCount?: number; // cuántas veces se ha cumplido en la semana actual
    streakDays?: number;  // días consecutivos de racha
    onDelete?: () => void;
    onEdit?: () => void;
    onAdvance?: () => void;
    isAdvancing?: boolean;
    onConfigureReminder?: () => void;
};

export default function HabitCard({ habito, weeklyCount = 0, streakDays = 0, onDelete, onEdit, onAdvance, isAdvancing = false, onConfigureReminder }: Props) {
    const { nombre_habito, descripcion, intervalo_meta, categoria, meta_repeticion } = habito;
    const [menuOpen, setMenuOpen] = useState(false);

    // Usamos la meta del hábito si existe; si no, un objetivo razonable por intervalo
    const fallbackGoal = intervalo_meta === 'diario' ? 1 : intervalo_meta === 'mensual' ? 30 : 7;
    const goal = Math.max(1, meta_repeticion ?? fallbackGoal);
    const progress = Math.min(weeklyCount, goal);
    const pct = Math.round((progress / goal) * 100);
    const pctBucket = Math.min(100, Math.max(0, Math.round(pct / 10) * 10));
    const isComplete = progress >= goal;

    const handleDelete = () => {
        if (window.confirm(`¿Estás seguro de eliminar "${nombre_habito}"?`)) {
            onDelete?.();
        }
        setMenuOpen(false);
    };

    const handleEdit = () => {
        onEdit?.();
        setMenuOpen(false);
    };

    const handleConfigureReminder = () => {
        onConfigureReminder?.();
        setMenuOpen(false);
    };

    return (
        <div className="habitCard">
            <div className="habitHeader">
                <div className={`habitIcon ${categoriaClass(categoria)}`}>{pickIcon(categoria)}</div>
                <div className="habitMenuWrapper">
                    <button
                        className="habitMenu"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Opciones"
                    >
                        <MoreVertical size={18} />
                    </button>
                    {menuOpen && (
                        <div className="habitDropdown">
                            <button onClick={handleEdit} className="dropdownItem">
                                <Edit2 size={16} />
                                Editar
                            </button>
                            <button onClick={handleConfigureReminder} className="dropdownItem">
                                <Bell size={16} />
                                Recordatorio
                            </button>
                            <button onClick={handleDelete} className="dropdownItem danger">
                                <Trash2 size={16} />
                                Eliminar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <h3 className="habitTitle">{nombre_habito}</h3>
            <p className="habitFreq">{formatInterval(intervalo_meta)}</p>

            <div className="habitDificultad">
                <span className={`dificultadBadge ${habito.dificultad}`}>
                    {habito.dificultad === 'facil' && '⭐ Fácil (3 pts)'}
                    {habito.dificultad === 'medio' && '⭐⭐ Medio (5 pts)'}
                    {habito.dificultad === 'dificil' && '⭐⭐⭐ Difícil (8 pts)'}
                </span>
            </div>

            {descripcion && <p className="habitDesc">{descripcion}</p>}

            <div className="habitProgress">
                <div className="progressTop">
                    <span>Progreso</span>
                    <span>{progress}/{goal}</span>
                </div>
                <div className="progressBar">
                    <div className={`progressFill ${isComplete ? 'complete' : ''} pct-${pctBucket}`} />
                </div>
            </div>

            <div className={`habitStreak ${streakDays > 0 ? 'active' : ''}`}>
                <Flame size={16} />
                <span>{streakDays > 0 ? `Racha de ${streakDays} día${streakDays > 1 ? 's' : ''}` : 'Sin racha'}</span>
            </div>

            {!isComplete && (
                <button
                    className="advanceButton"
                    onClick={onAdvance}
                    disabled={isAdvancing}
                    title="Registrar un avance en este hábito"
                >
                    <CheckCircle size={18} />
                    {isAdvancing ? 'Registrando...' : 'Avanzar'}
                </button>
            )}
            {isComplete && (
                <button
                    className="advanceButton completeButton"
                    disabled
                    title="¡Hábito completado para este período!"
                >
                    <CheckCircle size={18} />
                    ¡Completado! ✓
                </button>
            )}
        </div>
    );
}

function formatInterval(intervalo: IHabito['intervalo_meta']) {
    switch (intervalo) {
        case 'diario':
            return 'Diario';
        case 'semanal':
            return 'Semanal';
        case 'mensual':
            return 'Mensual';
        default:
            return String(intervalo ?? '');
    }
}

function pickIcon(categoria: IHabito['categoria']) {
    const map: Record<string, string> = {
        ejercicio: '🏃',
        alimentacion: '🍎',
        estudio: '📚',
        salud: '💊',
        trabajo: '💼',
        otro: '✨',
    };
    const key = typeof categoria === 'string' ? categoria : 'otro';
    return map[key] || '✨';
}

function categoriaClass(categoria: IHabito['categoria']) {
    const key = typeof categoria === 'string' ? categoria : 'otro';
    return `cat-${key}`;
}