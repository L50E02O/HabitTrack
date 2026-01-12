import { useState } from 'react';
import { useGoogleFit } from '../hooks/useGoogleFit';
import type { DailyStepsData } from '../services/googleFit/types';
import './GoogleFitConnection.css';

interface GoogleFitConnectionProps {
  userId: string;
}

export default function GoogleFitConnection({ userId }: GoogleFitConnectionProps) {
  const { stepsData, loading, error, isAuthenticated, refreshSteps, initiateLogin, revoke } =
    useGoogleFit({ userId });

  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateFilter(newDate);
    await refreshSteps(new Date(newDate));
  };

  const handleRefresh = async () => {
    await refreshSteps(new Date(dateFilter));
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
          <p className="google-fit-no-data">No hay datos disponibles para esta fecha</p>
        )}
      </div>
    </div>
  );
}
