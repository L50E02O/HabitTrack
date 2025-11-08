import React, { useEffect, useState } from 'react';
import { Trophy, ChevronRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BadgeIcon from './BadgeIcon';
import { obtenerProgresoLogros } from '../../../services/logro/logroAutoService';
import { supabase } from '../../../config/supabase';
import { ILogro } from '../../../types/ILogro';
import { ILogroUsuario } from '../../../types/ILogroUsuario';

interface LogroConUsuario {
  logro: ILogro;
  logroUsuario: ILogroUsuario | null;
}

interface LogrosSidebarProps {
  className?: string;
}

export const LogrosSidebar: React.FC<LogrosSidebarProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [logros, setLogros] = useState<LogroConUsuario[]>([]);
  const [progreso, setProgreso] = useState({ logrosObtenidos: 0, logosTotales: 0, porcentaje: 0 });
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    loadLogros();
  }, []);

  const loadLogros = async () => {
    try {
      setLoading(true);

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener perfil del usuario
      const { data: perfil } = await supabase
        .from('perfil')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!perfil) return;

      // Obtener todos los logros
      const { data: todosLosLogros } = await supabase
        .from('logro')
        .select('*')
        .order('criterio_racha', { ascending: true });

      // Obtener logros del usuario
      const { data: logrosUsuario } = await supabase
        .from('logro_usuario')
        .select(`
          *,
          logro:id_logro (*)
        `)
        .eq('id_perfil', perfil.id);

      // Combinar datos
      const logrosConUsuario: LogroConUsuario[] = (todosLosLogros || []).map(logro => ({
        logro,
        logroUsuario: (logrosUsuario || []).find((lu: any) => lu.id_logro === logro.id_logro) || null,
      }));

      setLogros(logrosConUsuario);

      // Obtener progreso
      const prog = await obtenerProgresoLogros(perfil.id);
      setProgreso(prog);

    } catch (error) {
      console.error('Error al cargar logros:', error);
    } finally {
      setLoading(false);
    }
  };

  const logrosDesbloqueados = logros.filter(l => l.logroUsuario !== null);
  const proximoLogro = logros.find(l => l.logroUsuario === null);

  if (loading) {
    return (
      <aside className={`logros-sidebar loading ${className}`}>
        <div className="sidebar-header">
          <div className="skeleton skeleton-text" />
        </div>
        <div className="sidebar-content">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton skeleton-badge" />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className={`logros-sidebar ${collapsed ? 'collapsed' : ''} ${className}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-title">
          <Trophy className="sidebar-icon" size={20} />
          {!collapsed && <span>Mis Logros</span>}
        </div>
        
        {!collapsed && (
          <button 
            className="view-all-btn"
            onClick={() => navigate('/logros')}
            title="Ver todos los logros"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Progreso */}
      {!collapsed && (
        <div className="sidebar-progress">
          <div className="progress-info">
            <span className="progress-text">
              {progreso.logrosObtenidos}/{progreso.logosTotales}
            </span>
            <span className="progress-percentage">{progreso.porcentaje}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progreso.porcentaje}%` }}
            />
          </div>
        </div>
      )}

      {/* Logros Desbloqueados */}
      <div className="sidebar-content">
        {!collapsed && (
          <h3 className="section-title">Desbloqueados ({logrosDesbloqueados.length})</h3>
        )}
        
        <div className={`badges-grid ${collapsed ? 'collapsed' : ''}`}>
          {logrosDesbloqueados.length > 0 ? (
            logrosDesbloqueados.slice(0, collapsed ? 6 : 5).map(({ logro }) => (
              <div 
                key={logro.id_logro} 
                className="badge-item unlocked"
                title={collapsed ? logro.nombre_logro : undefined}
              >
                <BadgeIcon 
                  iconName={logro.icono} 
                  size={collapsed ? 32 : 48} 
                  unlocked={true} 
                />
                {!collapsed && (
                  <div className="badge-info">
                    <span className="badge-name">{logro.nombre_logro}</span>
                    <span className="badge-days">{logro.criterio_racha} días</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            !collapsed && (
              <div className="empty-badges">
                <Lock size={32} className="empty-icon" />
                <p className="empty-text">Completa hábitos para desbloquear logros</p>
              </div>
            )
          )}
        </div>

        {/* Próximo Logro */}
        {!collapsed && proximoLogro && (
          <>
            <h3 className="section-title next-title">Próximo Logro</h3>
            <div className="next-badge">
              <div className="next-badge-icon">
                <BadgeIcon 
                  iconName={proximoLogro.logro.icono} 
                  size={56} 
                  unlocked={false} 
                />
              </div>
              <div className="next-badge-info">
                <span className="next-badge-name">{proximoLogro.logro.nombre_logro}</span>
                <span className="next-badge-requirement">
                  Racha de {proximoLogro.logro.criterio_racha} días
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toggle Collapse Button */}
      <button 
        className="collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expandir' : 'Contraer'}
      >
        <ChevronRight 
          size={16} 
          className={collapsed ? '' : 'rotated'}
        />
      </button>
    </aside>
  );
};

export default LogrosSidebar;
