import { useState } from 'react';
import { useGoogleFit } from '../hooks/useGoogleFit';

import './GoogleFitConnection.css';

interface GoogleFitConnectionProps {
  userId: string;
}

export default function GoogleFitConnection({ userId }: GoogleFitConnectionProps) {
  const { stepsData, stepsRange, loading, error, isAuthenticated, refreshSteps, getStepsRange, initiateLogin, revoke } =
    useGoogleFit({ userId });

  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showRange, setShowRange] = useState(false);
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

  if (!isAuthenticated) {
    return (
      <div className="google-fit-container">
        <div className="google-fit-card">
          <h3>Sincronizar con Google Fit</h3>
          <p>Conecta tu cuenta de Google para sincronizar automáticamente tus datos de actividad.</p>

          {error && <div className="google-fit-error">{error}</div>}

          <button onClick={initiateLogin} disabled={loading} className="google-fit-login-btn">
            {loading ? 'Conectando...' : 'Conectar Google Fit'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="google-fit-container">
      <div className="google-fit-card">
        <div className="google-fit-header">
          <h3>Datos de Google Fit</h3>
          <button onClick={() => revoke()} className="google-fit-disconnect-btn">
            Desconectar
          </button>
        </div>

        {error && <div className="google-fit-error">{error}</div>}

        <div className="google-fit-controls">
          <input
            type="date"
            value={dateFilter}
            onChange={handleDateChange}
            className="google-fit-date-input"
          />
          <button onClick={handleRefresh} disabled={loading} className="google-fit-refresh-btn">
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>

        {stepsData ? (
          <div className="google-fit-data">
            <div className="google-fit-stat">
              <span className="google-fit-label">Pasos</span>
              <span className="google-fit-value">{stepsData.steps.toLocaleString()}</span>
            </div>
            <div className="google-fit-stat">
              <span className="google-fit-label">Calorías</span>
              <span className="google-fit-value">{stepsData.calories.toLocaleString()}</span>
            </div>
            <div className="google-fit-stat">
              <span className="google-fit-label">Distancia</span>
              <span className="google-fit-value">{stepsData.distance.toFixed(2)} km</span>
            </div>
            <small className="google-fit-date">{stepsData.date}</small>
          </div>
        ) : loading ? (
          <p className="google-fit-loading">Cargando datos...</p>
        ) : (
          <p className="google-fit-no-data">No hay datos para este día</p>
        )}

        <div className="google-fit-range-section">
          <button
            onClick={() => setShowRange(!showRange)}
            className="google-fit-toggle-btn"
          >
            {showRange ? 'Ocultar rango' : 'Ver rango de fechas'}
          </button>

          {showRange && (
            <div className="google-fit-range-controls">
              <div className="google-fit-range-inputs">
                <label>
                  Desde:
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="google-fit-date-input"
                  />
                </label>
                <label>
                  Hasta:
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="google-fit-date-input"
                  />
                </label>
              </div>
              <button
                onClick={handleGetRange}
                disabled={loading}
                className="google-fit-refresh-btn"
              >
                {loading ? 'Cargando...' : 'Obtener rango'}
              </button>
            </div>
          )}

          {stepsRange.length > 0 && (
            <div className="google-fit-range-data">
              <h4>Historial ({stepsRange.length} días)</h4>
              <div className="google-fit-data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Pasos</th>
                      <th>Calorías</th>
                      <th>Distancia (km)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stepsRange.map((day) => (
                      <tr key={day.date}>
                        <td>{day.date}</td>
                        <td>{day.steps.toLocaleString()}</td>
                        <td>{day.calories.toLocaleString()}</td>
                        <td>{day.distance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
