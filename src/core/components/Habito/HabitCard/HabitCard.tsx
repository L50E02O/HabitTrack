import './HabitCard.css';
import React, { useState } from 'react';
import {
    Flame,
    MoreVertical,
    Trash2,
    Edit2,
    CheckCircle,
    Bell,
    Shield,
    ShieldOff,
    HeartPulse,
    Ham,
    GraduationCap,
    BriefcaseBusiness,
    Dumbbell,
    Star,
    Edit3
} from 'lucide-react';
import type { IHabito } from '../../../../types/IHabito';
import { getHabitType, formatProgressDisplay } from '../../../../utils/habitTypeUtils';
import RegistroProgresoModal from '../RegistroProgresoModal/RegistroProgresoModal';
import RegistroDuracionModal from '../RegistroDuracionModal/RegistroDuracionModal';

type Props = {
    habito: IHabito;
    weeklyCount?: number; // cuántas veces se ha cumplido en la semana actual
    streakDays?: number;  // días consecutivos de racha
    protectoresAsignados?: number; // protectores asignados a este hábito
    onDelete?: () => void;
    onEdit?: () => void;
    onAdvance?: () => void;
    onAdvanceWithAmount?: (cantidad: number) => void; // NUEVO: registro con cantidad específica
    isAdvancing?: boolean;
    onConfigureReminder?: () => void;
    onAsignarProtector?: () => void;
    onQuitarProtector?: () => void;
};

export default function HabitCard({
    habito,
    weeklyCount = 0,
    streakDays = 0,
    protectoresAsignados = 0,
    onDelete,
    onEdit,
    onAdvance,
    onAdvanceWithAmount,
    isAdvancing = false,
    onConfigureReminder,
    onAsignarProtector,
    onQuitarProtector
}: Props) {
    const { nombre_habito, descripcion, intervalo_meta, categoria, meta_repeticion } = habito;
    const [menuOpen, setMenuOpen] = useState(false);
    const [openRegistroModal, setOpenRegistroModal] = useState(false);

    // Usamos la meta del hábito si existe; si no, un objetivo razonable por intervalo
    const fallbackGoal = intervalo_meta === 'diario' ? 1 : intervalo_meta === 'mensual' ? 30 : 7;
    const goal = Math.max(1, meta_repeticion ?? fallbackGoal);
    const progress = Math.min(weeklyCount, goal);
    const pct = Math.round((progress / goal) * 100);
    const pctBucket = Math.min(100, Math.max(0, Math.round(pct / 10) * 10));
    const isComplete = progress >= goal;

    // La unidad es siempre días (el backend ya convierte a días)
    const unidadTiempo = streakDays === 1 ? 'día' : 'días';

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

    const handleAsignarProtector = () => {
        onAsignarProtector?.();
        setMenuOpen(false);
    };

    const handleQuitarProtector = () => {
        onQuitarProtector?.();
        setMenuOpen(false);
    };

    return (
        <div className="habitCard">
            {/* Indicador de protector asignado */}
            {protectoresAsignados > 0 && (
                <div className="protector-badge">
                    <Shield size={14} />
                    <span>{protectoresAsignados}</span>
                </div>
            )}

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
                            {streakDays > 0 ? (
                                <button onClick={handleAsignarProtector} className="dropdownItem protector-item">
                                    <Shield size={16} />
                                    Asignar Protector
                                </button>
                            ) : (
                                <button
                                    className="dropdownItem protector-item"
                                    disabled
                                    title="Necesitas tener una racha activa para asignar un protector"
                                >
                                    <Shield size={16} />
                                    Asignar Protector
                                </button>
                            )}
                            {protectoresAsignados > 0 && (
                                <button onClick={handleQuitarProtector} className="dropdownItem protector-item">
                                    <ShieldOff size={16} />
                                    Quitar Protector
                                </button>
                            )}
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
                    {habito.dificultad === 'facil' && (
                        <>
                            <span className="star-icon"><Star size={14} fill="currentColor" /></span> Fácil (3 pts)
                        </>
                    )}
                    {habito.dificultad === 'medio' && (
                        <>
                            <span className="star-icon"><Star size={14} fill="currentColor" /></span>
                            <span className="star-icon"><Star size={14} fill="currentColor" /></span> Medio (5 pts)
                        </>
                    )}
                    {habito.dificultad === 'dificil' && (
                        <>
                            <span className="star-icon"><Star size={14} fill="currentColor" /></span>
                            <span className="star-icon"><Star size={14} fill="currentColor" /></span>
                            <span className="star-icon"><Star size={14} fill="currentColor" /></span> Difícil (8 pts)
                        </>
                    )}
                </span>
            </div>

            {descripcion && <p className="habitDesc">{descripcion}</p>}

            <div className="habitProgress">
                <div className="progressTop">
                    <span>Progreso</span>
                    <span>
                        {formatProgressDisplay(progress, habito.unidad_medida || '')}/{formatProgressDisplay(goal, habito.unidad_medida || '')} {formatUnidad(goal, habito.unidad_medida || '')}
                    </span>
                </div>
                <div className="progressBar">
                    <div className={`progressFill ${isComplete ? 'complete' : ''} pct-${pctBucket}`} />
                </div>
            </div>

            <div className={`habitStreak ${streakDays > 0 ? 'active' : ''}`}>
                <Flame size={16} />
                <span>{streakDays > 0 ? `Racha de ${streakDays} ${unidadTiempo}` : 'Sin racha'}</span>
            </div>

            {!isComplete && (
                <div className="habitActions">
                    <button
                        className="advanceButton"
                        onClick={onAdvance}
                        disabled={isAdvancing}
                        title="Registrar +1"
                    >
                        <CheckCircle size={18} />
                        {isAdvancing ? 'Registrando...' : 'Avanzar'}
                    </button>
                    <button
                        className="manualButton"
                        onClick={() => setOpenRegistroModal(true)}
                        disabled={isAdvancing}
                        title="Registro manual"
                    >
                        <Edit3 size={18} />
                    </button>
                </div>
            )}
            {isComplete && (
                <button
                    className="advanceButton completeButton"
                    disabled
                    title="¡Hábito completado para este período!"
                >
                    <CheckCircle size={18} />
                    Hábito completado
                </button>
            )}

            {/* Modal de registro según tipo de hábito */}
            {getHabitType(habito.unidad_medida) === 'accumulation' && (
                <RegistroProgresoModal
                    isOpen={openRegistroModal}
                    onClose={() => setOpenRegistroModal(false)}
                    onSubmit={(cantidad) => {
                        onAdvanceWithAmount?.(cantidad);
                        setOpenRegistroModal(false);
                    }}
                    metaTotal={meta_repeticion}
                    progresoActual={progress}
                    unidadMedida={habito.unidad_medida}
                    nombreHabito={nombre_habito}
                />
            )}

            {getHabitType(habito.unidad_medida) === 'duration' && (
                <RegistroDuracionModal
                    isOpen={openRegistroModal}
                    onClose={() => setOpenRegistroModal(false)}
                    onSubmit={(cantidad) => {
                        onAdvanceWithAmount?.(cantidad);
                        setOpenRegistroModal(false);
                    }}
                    metaTotal={meta_repeticion}
                    progresoActual={progress}
                    unidadMedida={habito.unidad_medida as 'minutos' | 'horas'}
                    nombreHabito={nombre_habito}
                />
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
    const key = typeof categoria === 'string' ? categoria : 'otro';
    const iconSize = 20;

    const iconMap: Record<string, React.ReactElement> = {
        ejercicio: <Dumbbell size={iconSize} />,
        alimentacion: <Ham size={iconSize} />,
        estudio: <GraduationCap size={iconSize} />,
        salud: <HeartPulse size={iconSize} />,
        trabajo: <BriefcaseBusiness size={iconSize} />,
        otro: <Star size={iconSize} />,
    };

    return iconMap[key] || iconMap['otro'];
}

function categoriaClass(categoria: IHabito['categoria']) {
    const key = typeof categoria === 'string' ? categoria : 'otro';
    return `cat-${key}`;
}

function formatUnidad(count: number, unidad: string) {
    if (!unidad) return '';
    const isPlural = count !== 1;
    const u = unidad.toLowerCase();

    const mapping: Record<string, { singular: string; plural: string }> = {
        'minuto': { singular: 'minuto', plural: 'minutos' },
        'minutos': { singular: 'minuto', plural: 'minutos' },
        'hora': { singular: 'hora', plural: 'horas' },
        'horas': { singular: 'hora', plural: 'horas' },
        'litro': { singular: 'litro', plural: 'litros' },
        'litros': { singular: 'litro', plural: 'litros' },
        'dosis': { singular: 'dosis', plural: 'dosis' },
        'sesion': { singular: 'sesión', plural: 'sesiones' },
        'sesión': { singular: 'sesión', plural: 'sesiones' },
        'sesiones': { singular: 'sesión', plural: 'sesiones' },
        'porcion': { singular: 'porción', plural: 'porciones' },
        'porción': { singular: 'porción', plural: 'porciones' },
        'porciones': { singular: 'porción', plural: 'porciones' },
        'dia': { singular: 'día', plural: 'días' },
        'día': { singular: 'día', plural: 'días' },
        'días': { singular: 'día', plural: 'días' },
        'repeticion': { singular: 'repetición', plural: 'repeticiones' },
        'repetición': { singular: 'repetición', plural: 'repeticiones' },
        'repeticiones': { singular: 'repetición', plural: 'repeticiones' },
    };

    const entry = mapping[u];
    if (entry) {
        return isPlural ? entry.plural : entry.singular;
    }

    // Fallback
    if (isPlural) {
        if (u.endsWith('s')) return u;
        return u + 's';
    } else {
        if (u.endsWith('s') && u !== 'dosis') return u.slice(0, -1);
        return u;
    }
}