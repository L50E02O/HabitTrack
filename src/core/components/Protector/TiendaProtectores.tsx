import { useState, useEffect } from 'react';
import { ShoppingCart, Shield, X, Coins, Clock, Check } from 'lucide-react';
import {
  comprarProtector,
  puedeComprarProtectorEstaSemana,
  getPuntosActuales,
  getProtectoresActuales,
} from '../../../services/protector/protectorService';
import './TiendaProtectores.css';

interface TiendaProtectoresProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCompraExitosa?: () => void;
}

export default function TiendaProtectores({
  isOpen,
  onClose,
  userId,
  onCompraExitosa,
}: TiendaProtectoresProps) {
  const [loading, setLoading] = useState(false);
  const [puntosActuales, setPuntosActuales] = useState(0);
  const [protectoresActuales, setProtectoresActuales] = useState(0);
  const [puedeComprar, setPuedeComprar] = useState(false);
  const [mensaje, setMensaje] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const COSTO_PROTECTOR = 250;

  useEffect(() => {
    if (isOpen && userId) {
      cargarDatos();
    }
  }, [isOpen, userId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [puntos, protectores, puede] = await Promise.all([
        getPuntosActuales(userId),
        getProtectoresActuales(userId),
        puedeComprarProtectorEstaSemana(userId),
      ]);

      setPuntosActuales(puntos);
      setProtectoresActuales(protectores);
      setPuedeComprar(puede);
    } catch (error) {
      console.error('Error cargando datos de tienda:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComprar = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setMensaje(null);

      const resultado = await comprarProtector(userId);

      if (resultado.success) {
        setMensaje({ text: resultado.message, type: 'success' });
        setPuntosActuales((prev) => prev - COSTO_PROTECTOR);
        setProtectoresActuales(resultado.protectoresNuevos || protectoresActuales + 1);
        setPuedeComprar(false);

        if (onCompraExitosa) {
          onCompraExitosa();
        }

        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMensaje({ text: resultado.message, type: 'error' });
      }
    } catch (error: any) {
      setMensaje({ text: error.message || 'Error al comprar', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tienePuntosSuficientes = puntosActuales >= COSTO_PROTECTOR;
  const puedeRealizarCompra = puedeComprar && tienePuntosSuficientes && !loading;

  return (
    <div className="tienda-overlay" onClick={onClose}>
      <div className="tienda-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tienda-header">
          <div className="tienda-title">
            <ShoppingCart size={24} className="shop-icon" />
            <h2>Tienda de Protectores</h2>
          </div>
          <button className="tienda-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Saldo Actual */}
        <div className="tienda-saldo">
          <div className="saldo-item">
            <Coins className="coin-icon" size={20} />
            <div>
              <span className="saldo-label">Puntos</span>
              <span className="saldo-value">{puntosActuales}</span>
            </div>
          </div>
          <div className="saldo-item">
            <Shield className="shield-icon" size={20} />
            <div>
              <span className="saldo-label">Protectores</span>
              <span className="saldo-value">{protectoresActuales}</span>
            </div>
          </div>
        </div>

        {/* Producto */}
        <div className="tienda-producto">
          <div className="producto-icono">
            <Shield size={64} className="producto-shield" />
          </div>
          <div className="producto-info">
            <h3>Protector de Racha</h3>
            <p className="producto-descripcion">
              Protege tu racha de un día perdido. Úsalo cuando falles en completar un hábito para
              mantener tu racha activa.
            </p>
            <div className="producto-beneficios">
              <div className="beneficio">
                <Check size={16} />
                <span>Protege rachas de cualquier longitud</span>
              </div>
              <div className="beneficio">
                <Check size={16} />
                <span>Úsalo cuando lo necesites</span>
              </div>
              <div className="beneficio">
                <Check size={16} />
                <span>No expira</span>
              </div>
            </div>
          </div>
        </div>

        {/* Precio y Botón */}
        <div className="tienda-compra">
          <div className="producto-precio">
            <Coins size={24} className="precio-icon" />
            <span className="precio-valor">{COSTO_PROTECTOR}</span>
            <span className="precio-label">puntos</span>
          </div>

          {!puedeComprar && (
            <div className="limite-semanal">
              <Clock size={16} />
              <span>Ya compraste esta semana. Vuelve la próxima.</span>
            </div>
          )}

          {!tienePuntosSuficientes && puedeComprar && (
            <div className="puntos-insuficientes">
              <Coins size={16} />
              <span>Necesitas {COSTO_PROTECTOR - puntosActuales} puntos más</span>
            </div>
          )}

          <button
            className={`btn-comprar ${puedeRealizarCompra ? 'active' : 'disabled'}`}
            onClick={handleComprar}
            disabled={!puedeRealizarCompra}
          >
            {loading ? (
              <div className="spinner-small" />
            ) : puedeRealizarCompra ? (
              <>
                <ShoppingCart size={20} />
                Comprar Protector
              </>
            ) : !puedeComprar ? (
              'Límite semanal alcanzado'
            ) : (
              'Puntos insuficientes'
            )}
          </button>
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div className={`tienda-mensaje ${mensaje.type}`}>
            {mensaje.type === 'success' ? <Check size={20} /> : <X size={20} />}
            <span>{mensaje.text}</span>
          </div>
        )}

        {/* Info Adicional */}
        <div className="tienda-info">
          <h4>¿Cómo conseguir más puntos?</h4>
          <ul>
            <li>Completa tus hábitos diariamente (+10 puntos por hábito)</li>
            <li>Mantén rachas largas (bonus cada 7 días)</li>
            <li>Desbloquea logros (bonus especial)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
