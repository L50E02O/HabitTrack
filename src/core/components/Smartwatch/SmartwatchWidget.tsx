import { useState } from 'react';
import { Activity, RefreshCw, Calendar, TrendingUp, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { useGoogleFit } from '../../../hooks/useGoogleFit';

import './SmartwatchWidget.css';

interface SmartwatchWidgetProps {
  userId: string;
  darkMode?: boolean;
}

export default function SmartwatchWidget({ userId, darkMode = false }: SmartwatchWidgetProps) {
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

  // Estado no autenticado
  if (!isAuthenticated) {
    return (
      <div className={`smartwatch-widget ${darkMode ? 'dark' : ''}`}>
        <div className="smartwatch-widget-header">
          <div className="smartwatch-widget-title">
            <Activity className="smartwatch-icon" size={20} />
            <h3>Smartwatch</h3>
          </div>
        </div>
        <div className="smartwatch-widget-content">
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
    );
  }

  // Estado autenticado
  return (
    <div className={`smartwatch-widget ${darkMode ? 'dark' : ''}`}>
      <div className="smartwatch-widget-header">
        <div className="smartwatch-widget-title">
          <Activity className="smartwatch-icon" size={20} />
          <h3>Smartwatch</h3>
        </div>
        <div className="smartwatch-widget-actions">
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
        </div>
      </div>

      <div className="smartwatch-widget-content">
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
        {stepsData ? (
          <div className="smartwatch-stats">
            <div className="smartwatch-stat">
              <div className="smartwatch-stat-label">Pasos</div>
              <div className="smartwatch-stat-value">{stepsData.steps.toLocaleString()}</div>
            </div>
            <div className="smartwatch-stat">
              <div className="smartwatch-stat-label">Calorías</div>
              <div className="smartwatch-stat-value">{stepsData.calories.toLocaleString()}</div>
            </div>
            <div className="smartwatch-stat">
              <div className="smartwatch-stat-label">Distancia</div>
              <div className="smartwatch-stat-value">{stepsData.distance.toFixed(2)} km</div>
            </div>
          </div>
        ) : loading ? (
          <div className="smartwatch-loading">
            <RefreshCw size={20} className="spinning" />
            <p>Cargando datos...</p>
          </div>
        ) : (
          <div className="smartwatch-no-data">
            <p>No hay datos para este día</p>
          </div>
        )}

        {/* Sección expandible de rango de fechas */}
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

          {/* Tabla de historial */}
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
      </div>
    </div>
  );
}
