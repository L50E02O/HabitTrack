import { useState, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';
import { getHabitoById } from '../../../services/habito/habitoService';
import { getRachaActivaByHabito } from '../../../services/racha/rachaAutoService';
import type { IHabito } from '../../../types/IHabito';
import { Dumbbell, Ham, GraduationCap, HeartPulse, BriefcaseBusiness, Star } from 'lucide-react';
import './HabitoInfoModal.css';

interface HabitoInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitoId: string;
  onEdit?: () => void;
  darkMode?: boolean;
}

export default function HabitoInfoModal({ isOpen, onClose, habitoId, onEdit, darkMode = false }: HabitoInfoModalProps) {
  const [habito, setHabito] = useState<IHabito | null>(null);
  const [racha, setRacha] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && habitoId) {
      cargarDatos();
    }
  }, [isOpen, habitoId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [habitoData, rachaData] = await Promise.all([
        getHabitoById(habitoId),
        getRachaActivaByHabito(habitoId)
      ]);
      setHabito(habitoData);
      setRacha(rachaData?.dias_consecutivos || 0);
    } catch (error) {
      console.error('Error cargando datos del hábito:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const pickIcon = (categoria: string) => {
    const iconSize = 24;
    const iconMap: Record<string, React.ReactElement> = {
      ejercicio: <Dumbbell size={iconSize} />,
      alimentacion: <Ham size={iconSize} />,
      estudio: <GraduationCap size={iconSize} />,
      salud: <HeartPulse size={iconSize} />,
      trabajo: <BriefcaseBusiness size={iconSize} />,
      otro: <Star size={iconSize} />,
    };
    return iconMap[categoria] || iconMap['otro'];
  };

  const formatInterval = (intervalo: string) => {
    const map: Record<string, string> = {
      diario: 'Diario',
      semanal: 'Semanal',
      mensual: 'Mensual',
    };
    return map[intervalo] || intervalo;
  };

  return (
    <div className={`habito-info-modal-overlay ${darkMode ? 'dark' : ''}`} onClick={onClose}>
      <div className="habito-info-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="habito-info-modal-header">
          <h3 className="habito-info-modal-title">Información del Hábito</h3>
          <button 
            className="habito-info-modal-close" 
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="habito-info-modal-loading">
            <p>Cargando...</p>
          </div>
        ) : habito ? (
          <div className="habito-info-modal-body">
            <div className="habito-info-icon-section">
              <div className={`habito-info-icon ${habito.categoria}`}>
                {pickIcon(habito.categoria)}
              </div>
              <div className="habito-info-main">
                <h4 className="habito-info-nombre">{habito.nombre_habito}</h4>
                <p className="habito-info-categoria">{habito.categoria}</p>
              </div>
            </div>

            {habito.descripcion && (
              <div className="habito-info-section">
                <label className="habito-info-label">Descripción</label>
                <p className="habito-info-text">{habito.descripcion}</p>
              </div>
            )}

            <div className="habito-info-stats">
              <div className="habito-info-stat">
                <label className="habito-info-stat-label">Intervalo</label>
                <span className="habito-info-stat-value">{formatInterval(habito.intervalo_meta)}</span>
              </div>
              <div className="habito-info-stat">
                <label className="habito-info-stat-label">Meta</label>
                <span className="habito-info-stat-value">{habito.meta_repeticion} veces</span>
              </div>
              <div className="habito-info-stat">
                <label className="habito-info-stat-label">Racha</label>
                <span className="habito-info-stat-value">{racha} días</span>
              </div>
              <div className="habito-info-stat">
                <label className="habito-info-stat-label">Dificultad</label>
                <span className="habito-info-stat-value">{habito.dificultad}</span>
              </div>
            </div>

            <div className="habito-info-actions">
              {onEdit && (
                <button 
                  className="habito-info-btn habito-info-btn-primary"
                  onClick={() => {
                    onEdit();
                    onClose();
                  }}
                >
                  <Edit2 size={16} />
                  Editar Hábito
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="habito-info-modal-error">
            <p>No se pudo cargar la información del hábito</p>
          </div>
        )}
      </div>
    </div>
  );
}

