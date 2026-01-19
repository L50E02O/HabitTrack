import { useState } from 'react';
import { Activity, RefreshCw, Calendar, TrendingUp, LogOut, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useGoogleFit } from '../../../hooks/useGoogleFit';

import './SmartwatchModal.css';

interface SmartwatchModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

// Helper: Renderizar contenido cuando no está autenticado
function renderUnauthenticatedContent(
  error: string | null,
  loading: boolean,
  initiateLogin: () => void,
  onClose: () => void,
  darkMode: boolean
) {
  return (
    <div className={`smartwatch-modal-overlay ${darkMode ? 'dark' : ''}`} onClick={onClose}>
      <div className={`smartwatch-modal-body ${darkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="smartwatch-modal-header">
          <div className="smartwatch-modal-title">
            <Activity className="smartwatch-modal-icon" size={20} />
            <span className="smartwatch-modal-title-text">Smartwatch</span>
          </div>
          <button className="smartwatch-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="smartwatch-modal-content">
          <div className="smartwatch-connect-section">
            <p className="smartwatch-description">
              Conecta tu cuenta de Google Fit para sincronizar automáticamente tus datos de actividad.
            </p>
            {error && <div className="smartwatch-error">{error}</div>}
            <button
              onClick={initiateLogin}
              disabled={loading}
              className="smartwatch-connect-btn"
            >
              {loading ? 'Conectando...' : 'Conectar Google Fit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: Renderizar estadísticas principales
function renderMainStats(stepsData: any, loading: boolean) {
  if (stepsData) {
    return (
      <div className="smartwatch-stats">
        <div className="smartwatch-stat">
          <div className="smartwatch-stat-label">PASOS</div>
          <div className="smartwatch-stat-value">{stepsData.steps.toLocaleString()}</div>
        </div>
        <div className="smartwatch-stat">
          <div className="smartwatch-stat-label">CALORÍAS</div>
          <div className="smartwatch-stat-value">{stepsData.calories.toLocaleString()}</div>
        </div>
        <div className="smartwatch-stat">
          <div className="smartwatch-stat-label">DISTANCIA</div>
          <div className="smartwatch-stat-value">{stepsData.distance.toFixed(2)} km</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="smartwatch-loading">
        <RefreshCw size={20} className="spinning" />
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="smartwatch-no-data">
      <p>No hay datos para este día</p>
    </div>
  );
}

// Helper: Renderizar sección de rango de fechas
function renderRangeSection(
  showRange: boolean,
  setShowRange: (show: boolean) => void,
  startDate: string,
  setStartDate: (date: string) => void,
  endDate: string,
  setEndDate: (date: string) => void,
  handleGetRange: () => void,
  loading: boolean,
  stepsRange: any[],
  showDetails: boolean,
  setShowDetails: (show: boolean) => void
) {
  return (
    <div className="smartwatch-range-section">
      <button
        onClick={() => setShowRange(!showRange)}
        className="smartwatch-toggle-btn"
      >
        <Calendar size={16} />
        {showRange ? 'Ocultar historial' : 'Ver historial'}
        {showRange ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showRange && (
        <div className="smartwatch-range-controls">
          <div className="smartwatch-range-inputs">
            <label>
              <span>Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="smartwatch-date-input"
              />
            </label>
            <label>
              <span>Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="smartwatch-date-input"
              />
            </label>
          </div>
          <button
            onClick={handleGetRange}
            disabled={loading}
            className="smartwatch-range-btn"
          >
            <TrendingUp size={16} />
            {loading ? 'Cargando...' : 'Obtener rango'}
          </button>
        </div>
      )}

      {stepsRange.length > 0 && (
        <div className="smartwatch-range-data">
          <div className="smartwatch-range-header">
            <h4>Historial ({stepsRange.length} días)</h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="smartwatch-details-toggle"
            >
              {showDetails ? 'Ocultar' : 'Ver detalles'}
            </button>
          </div>

          {showDetails && (
            <div className="smartwatch-data-table">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Pasos</th>
                    <th>Calorías</th>
                    <th>Distancia</th>
                  </tr>
                </thead>
                <tbody>
                  {stepsRange.map((day) => (
                    <tr key={day.date}>
                      <td>{day.date}</td>
                      <td>{day.steps.toLocaleString()}</td>
                      <td>{day.calories.toLocaleString()}</td>
                      <td>{day.distance.toFixed(2)} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SmartwatchModal({ userId, isOpen, onClose, darkMode = false }: SmartwatchModalProps) {
  const { stepsData, stepsRange, loading, error, isAuthenticated, refreshSteps, getStepsRange, initiateLogin, revoke } =
    useGoogleFit({ userId });

  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showRange, setShowRange] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateFilter(newDate);
    await refreshSteps(new Date(newDate));
  };

  const handleRefresh = async () => {
    await refreshSteps(new Date(dateFilter));
  };

  const handleGetRange = async () => {
    await getStepsRange(new Date(startDate), new Date(endDate));
  };

  if (!isOpen) return null;

  // Estado no autenticado
  if (!isAuthenticated) {
    return renderUnauthenticatedContent(error, loading, initiateLogin, onClose, darkMode);
  }

  // Estado autenticado
  return (
    <div className={`smartwatch-modal-overlay ${darkMode ? 'dark' : ''}`} onClick={onClose}>
      <div className={`smartwatch-modal-body ${darkMode ? 'dark' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="smartwatch-modal-header">
          <div className="smartwatch-modal-title">
            <Activity className="smartwatch-modal-icon" size={20} />
            <span className="smartwatch-modal-title-text">Smartwatch</span>
          </div>
          <div className="smartwatch-modal-actions">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="smartwatch-action-btn"
              title="Actualizar datos"
            >
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            </button>
            <button
              onClick={() => revoke()}
              className="smartwatch-disconnect-btn"
              title="Desconectar"
            >
              <LogOut size={16} />
            </button>
            <button className="smartwatch-modal-close" onClick={onClose} aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="smartwatch-modal-content">
          {error && <div className="smartwatch-error">{error}</div>}

          {/* Controles de fecha */}
          <div className="smartwatch-controls">
            <input
              type="date"
              value={dateFilter}
              onChange={handleDateChange}
              className="smartwatch-date-input"
            />
          </div>

          {/* Datos principales */}
          {renderMainStats(stepsData, loading)}

          {/* Sección expandible de rango de fechas */}
          {renderRangeSection(
            showRange,
            setShowRange,
            startDate,
            setStartDate,
            endDate,
            setEndDate,
            handleGetRange,
            loading,
            stepsRange,
            showDetails,
            setShowDetails
          )}
        </div>
      </div>
    </div>
  );
}
