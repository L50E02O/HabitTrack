import { useState, useEffect } from 'react';
import { Shield, ShoppingCart, TrendingUp } from 'lucide-react';
import { getProtectoresActuales, getPuntosActuales } from '../../../services/protector/protectorService';
import TiendaProtectores from './TiendaProtectores';
import './ProtectorWidget.css';

interface ProtectorWidgetProps {
  userId: string;
}

export default function ProtectorWidget({ userId }: ProtectorWidgetProps) {
  const [protectores, setProtectores] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tiendaAbierta, setTiendaAbierta] = useState(false);

  useEffect(() => {
    if (userId) {
      cargarDatos();
    }
  }, [userId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [protectoresData, puntosData] = await Promise.all([
        getProtectoresActuales(userId),
        getPuntosActuales(userId),
      ]);
      setProtectores(protectoresData);
      setPuntos(puntosData);
    } catch (error) {
      console.error('Error cargando datos del widget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompraExitosa = () => {
    cargarDatos(); // Recargar datos después de compra
  };

  if (loading) {
    return (
      <div className="protector-widget loading">
        <div className="spinner-widget" />
      </div>
    );
  }

  return (
    <>
      <div className="protector-widget">
        <div className="widget-header">
          <Shield className="widget-icon" size={24} />
          <h3>Recursos</h3>
        </div>

        <div className="widget-stats">
          {/* Protectores */}
          <div className="stat-item protectores">
            <div className="stat-icon">
              <Shield size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Protectores</span>
              <span className="stat-value">{protectores}</span>
            </div>
          </div>

          {/* Puntos */}
          <div className="stat-item puntos">
            <div className="stat-icon">
              <TrendingUp size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Puntos</span>
              <span className="stat-value">{puntos}</span>
            </div>
          </div>
        </div>

        {/* Botón de Tienda */}
        <button className="btn-tienda" onClick={() => setTiendaAbierta(true)}>
          <ShoppingCart size={18} />
          Abrir Tienda
        </button>

        {/* Info Rápida */}
        <div className="widget-info">
          <p className="info-text">
            💡 <strong>Tip:</strong> Usa protectores para salvar tu racha cuando falles un día
          </p>
        </div>
      </div>

      {/* Modal de Tienda */}
      <TiendaProtectores
        isOpen={tiendaAbierta}
        onClose={() => setTiendaAbierta(false)}
        userId={userId}
        onCompraExitosa={handleCompraExitosa}
      />
    </>
  );
}
