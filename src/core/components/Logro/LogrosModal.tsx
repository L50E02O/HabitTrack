import { useState, useEffect } from 'react';
import { X, Trophy, Lock } from 'lucide-react';
import { supabase } from '../../../config/supabase';
import { BadgeIcon } from './BadgeIcon';
import './LogrosModal.css';

interface Logro {
  id_logro: string;
  nombre_logro: string;
  descripcion: string;
  icono: string;
  criterio_racha: number;
}

interface LogroConEstado extends Logro {
  desbloqueado: boolean;
  fechaDesbloqueo?: string;
}

interface LogrosModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function LogrosModal({ isOpen, onClose, userId }: LogrosModalProps) {
  const [logros, setLogros] = useState<LogroConEstado[]>([]);
  const [loading, setLoading] = useState(true);
  const [rachaMaxima, setRachaMaxima] = useState(0);

  useEffect(() => {
    if (isOpen && userId) {
      cargarLogros();
    }
  }, [isOpen, userId]);

  const cargarLogros = async () => {
    try {
      setLoading(true);

      // Obtener la racha máxima del usuario
      const { data: rachaData } = await supabase
        .from('racha')
        .select('racha_maxima')
        .eq('id_perfil', userId)
        .order('racha_maxima', { ascending: false })
        .limit(1)
        .single();

      const maxRacha = rachaData?.racha_maxima || 0;
      setRachaMaxima(maxRacha);

      // Obtener todos los logros
      const { data: logrosData, error: logrosError } = await supabase
        .from('logro')
        .select('*')
        .order('criterio_racha', { ascending: true });

      if (logrosError) throw logrosError;

      // Obtener logros desbloqueados del usuario
      const { data: logrosUsuarioData } = await supabase
        .from('logro_usuario')
        .select('*')
        .eq('id_perfil', userId);

      // Combinar datos
      const logrosConEstado: LogroConEstado[] = (logrosData || []).map(logro => {
        const logroUsuario = (logrosUsuarioData || []).find(
          lu => lu.id_logro === logro.id_logro
        );

        return {
          ...logro,
          desbloqueado: !!logroUsuario,
          fechaDesbloqueo: logroUsuario?.fecha_desbloqueo,
        };
      });

      setLogros(logrosConEstado);
    } catch (error) {
      console.error('Error cargando logros:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const logrosDesbloqueados = logros.filter(l => l.desbloqueado);
  const logrosBloqueados = logros.filter(l => !l.desbloqueado);
  const porcentajeProgreso = Math.round((logrosDesbloqueados.length / logros.length) * 100) || 0;

  return (
    <div className="logros-modal-overlay" onClick={onClose}>
      <div className="logros-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="logros-modal-header">
          <div className="logros-modal-title">
            <Trophy className="trophy-icon" size={24} />
            <h2>Mis Logros</h2>
          </div>
          <button className="logros-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Progreso */}
        <div className="logros-modal-progress">
          <div className="progress-info">
            <span className="progress-text">{logrosDesbloqueados.length}/{logros.length} Logros</span>
            <span className="progress-percent">{porcentajeProgreso}%</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${porcentajeProgreso}%` }}
            />
          </div>
          <div className="racha-maxima">
            <span>🔥 Racha máxima: <strong>{rachaMaxima} días</strong></span>
          </div>
        </div>

        {/* Lista de Logros */}
        <div className="logros-modal-body">
          {loading ? (
            <div className="logros-modal-loading">
              <div className="spinner" />
              <p>Cargando logros...</p>
            </div>
          ) : (
            <>
              {/* Logros Desbloqueados */}
              {logrosDesbloqueados.length > 0 && (
                <div className="logros-section">
                  <h3 className="section-title unlocked">
                    <Trophy size={18} />
                    Desbloqueados ({logrosDesbloqueados.length})
                  </h3>
                  <div className="logros-list">
                    {logrosDesbloqueados.map(logro => (
                      <div key={logro.id_logro} className="logro-item unlocked">
                        <div className="logro-icon">
                          <BadgeIcon 
                            iconName={logro.icono} 
                            size={48} 
                            unlocked={true}
                          />
                        </div>
                        <div className="logro-info">
                          <h4>{logro.nombre_logro}</h4>
                          <p className="logro-description">{logro.descripcion}</p>
                          <p className="logro-criteria">🎯 {logro.criterio_racha} días de racha</p>
                          {logro.fechaDesbloqueo && (
                            <p className="logro-date">
                              🎉 {new Date(logro.fechaDesbloqueo).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logros Bloqueados */}
              {logrosBloqueados.length > 0 && (
                <div className="logros-section">
                  <h3 className="section-title locked">
                    <Lock size={18} />
                    Bloqueados ({logrosBloqueados.length})
                  </h3>
                  <div className="logros-list">
                    {logrosBloqueados.map(logro => {
                      const diasFaltantes = Math.max(0, logro.criterio_racha - rachaMaxima);
                      return (
                        <div key={logro.id_logro} className="logro-item locked">
                          <div className="logro-icon">
                            <BadgeIcon 
                              iconName={logro.icono} 
                              size={48} 
                              unlocked={false}
                            />
                          </div>
                          <div className="logro-info">
                            <h4>{logro.nombre_logro}</h4>
                            <p className="logro-description">{logro.descripcion}</p>
                            <p className="logro-criteria">🎯 {logro.criterio_racha} días de racha</p>
                            <p className="logro-missing">
                              Faltan <strong>{diasFaltantes}</strong> días
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {logros.length === 0 && (
                <div className="logros-empty">
                  <Trophy size={48} />
                  <p>No hay logros disponibles</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
