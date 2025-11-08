import React, { useEffect, useState } from 'react';
import { Trophy, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LogroCard from '../core/components/Logro/LogroCard';
import { obtenerLogrosUsuario, obtenerProgresoLogros } from '../services/logro/logroAutoService';
import { ILogro } from '../types/ILogro';
import { ILogroUsuario } from '../types/ILogroUsuario';
import { supabase } from '../config/supabase';
import '../core/components/Logro/LogroCard.css';
import './LogrosPage.css';

interface LogroConUsuario {
  logro: ILogro;
  logroUsuario: ILogroUsuario | null;
}

export const LogrosPage: React.FC = () => {
  const navigate = useNavigate();
  const [logros, setLogros] = useState<LogroConUsuario[]>([]);
  const [progreso, setProgreso] = useState({ logrosObtenidos: 0, logosTotales: 0, porcentaje: 0 });
  const [loading, setLoading] = useState(true);
  const [maxStreak, setMaxStreak] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

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

      // Obtener racha máxima actual del usuario
      const { data: rachas } = await supabase
        .from('racha')
        .select('dias_consecutivos, id_registro_intervalo')
        .eq('racha_activa', true);

      if (rachas && rachas.length > 0) {
        // Filtrar rachas del usuario
        const { data: registros } = await supabase
          .from('registro_intervalo')
          .select('id_registro_intervalo, id_habito')
          .in('id_registro_intervalo', rachas.map(r => r.id_registro_intervalo));

        if (registros) {
          const { data: habitos } = await supabase
            .from('habito')
            .select('id_habito')
            .eq('id_perfil', perfil.id)
            .in('id_habito', registros.map(r => r.id_habito));

          if (habitos) {
            const rachasDelUsuario = rachas.filter(racha => 
              registros.some(reg => 
                reg.id_registro_intervalo === racha.id_registro_intervalo &&
                habitos.some(h => h.id_habito === reg.id_habito)
              )
            );

            const maxDias = Math.max(...rachasDelUsuario.map(r => r.dias_consecutivos), 0);
            setMaxStreak(maxDias);
          }
        }
      }

      // Obtener todos los logros
      const { data: todosLosLogros } = await supabase
        .from('logro')
        .select('*')
        .order('criterio_racha', { ascending: true });

      // Obtener logros del usuario
      const logrosUsuario = await obtenerLogrosUsuario(perfil.id);

      // Combinar datos
      const logrosConUsuario: LogroConUsuario[] = (todosLosLogros || []).map(logro => ({
        logro,
        logroUsuario: logrosUsuario.find(lu => lu.id_logro === logro.id_logro) || null,
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

  if (loading) {
    return (
      <div className="logros-loading">
        <div className="loading-spinner">
          <div className="spinner" />
          <div className="loading-text">Cargando logros...</div>
        </div>
      </div>
    );
  }

  const logrosDesbloqueados = logros.filter(l => l.logroUsuario !== null);
  const logrosBloqueados = logros.filter(l => l.logroUsuario === null);

  return (
    <div className={`logros-page ${darkMode ? '' : 'light'}`}>
      {/* Header */}
      <div className="logros-header">
        <div className="logros-title-section">
          <div className="logros-title-group">
            <button
              onClick={() => navigate('/dashboard')}
              className="back-button"
              style={{
                background: 'none',
                border: 'none',
                color: darkMode ? '#cbd5e1' : '#64748b',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Volver
            </button>
            <Trophy className="logros-title-icon" size={40} />
            <h1 className="logros-title">Mis Logros</h1>
          </div>
          <div className="logros-stats">
            <div className="logros-count">
              {progreso.logrosObtenidos}/{progreso.logosTotales}
            </div>
            <div className="logros-count-label">Logros desbloqueados</div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="logros-progress-card">
          <div className="progress-header">
            <span className="progress-label">Progreso total</span>
            <span className="progress-percentage">{progreso.porcentaje}%</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progreso.porcentaje}%` }}
            />
          </div>
          <div className="progress-streak">
            Tu racha más larga: <span className="progress-streak-value">{maxStreak} días</span>
          </div>
        </div>
      </div>

      {/* Logros desbloqueados */}
      {logrosDesbloqueados.length > 0 && (
        <div className="logros-section">
          <div className="section-header">
            <Trophy className="section-icon" size={24} />
            <h2 className="section-title">
              Desbloqueados <span className="section-count">({logrosDesbloqueados.length})</span>
            </h2>
          </div>
          <div className="logros-grid">
            {logrosDesbloqueados.map(({ logro, logroUsuario }) => (
              <LogroCard
                key={logro.id_logro}
                logro={logro}
                logroUsuario={logroUsuario}
                size="medium"
              />
            ))}
          </div>
        </div>
      )}

      {/* Logros bloqueados */}
      {logrosBloqueados.length > 0 && (
        <div className="logros-section">
          <div className="section-header">
            <Lock className="section-icon locked" size={24} />
            <h2 className="section-title">
              Por desbloquear <span className="section-count">({logrosBloqueados.length})</span>
            </h2>
          </div>
          <div className="logros-grid">
            {logrosBloqueados.map(({ logro }) => (
              <LogroCard
                key={logro.id_logro}
                logro={logro}
                logroUsuario={null}
                size="medium"
                showProgress={true}
                currentStreak={maxStreak}
              />
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {logros.length === 0 && (
        <div className="logros-section">
          <div className="logros-empty">
            <Trophy className="empty-icon" size={80} />
            <h2 className="empty-title">Aún no hay logros disponibles</h2>
            <p className="empty-description">
              Completa hábitos para desbloquear logros increíbles
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogrosPage;
