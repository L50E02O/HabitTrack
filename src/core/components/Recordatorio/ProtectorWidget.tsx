import React, { useEffect, useState } from 'react';
import { Shield, Info } from 'lucide-react';
import { obtenerProtectoresDisponibles } from '../../../services/racha/protectorRachaService';

interface ProtectorWidgetProps {
  idPerfil: string;
  className?: string;
}

export const ProtectorWidget: React.FC<ProtectorWidgetProps> = ({ idPerfil, className = '' }) => {
  const [protectores, setProtectores] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProtectores();
  }, [idPerfil]);

  const loadProtectores = async () => {
    try {
      setLoading(true);
      const count = await obtenerProtectoresDisponibles(idPerfil);
      setProtectores(count);
    } catch (error) {
      console.error('Error al cargar protectores:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-slate-800 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-slate-700 rounded w-24 mb-2" />
            <div className="h-3 bg-slate-700 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border-2 border-blue-500/30 shadow-lg shadow-blue-500/10 ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Protectores de Racha</h3>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Info size={18} />
          </button>
        </div>

        {/* Contador */}
        <div className="flex items-center justify-center py-4">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 blur-xl bg-blue-500/30 rounded-full animate-pulse" />
            
            {/* Shield icon grande */}
            <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full shadow-lg">
              <Shield className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>

            {/* Badge con número */}
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-yellow-500 to-orange-500 text-white font-bold w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg border-2 border-slate-900">
              {protectores}
            </div>
          </div>
        </div>

        <p className="text-center text-gray-300 mb-2">
          <span className="text-2xl font-bold text-blue-400">{protectores}</span>{' '}
          {protectores === 1 ? 'protector disponible' : 'protectores disponibles'}
        </p>

        {/* Info expandible */}
        {showInfo && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="bg-blue-500/10 rounded-lg p-3 text-sm text-gray-300">
              <p className="mb-2">
                <span className="text-blue-400 font-semibold">💡 ¿Qué son los protectores?</span>
              </p>
              <ul className="space-y-1 text-xs">
                <li>• Ganas 1 protector cada 3 días de racha</li>
                <li>• Úsalos para salvar rachas en peligro</li>
                <li>• Extienden tu racha por 1 día adicional</li>
                <li>• ¡No dejes que se pierdan tus rachas!</li>
              </ul>
            </div>
          </div>
        )}

        {/* Mensaje si no tiene protectores */}
        {protectores === 0 && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              Completa 3 días de racha para ganar tu primer protector
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProtectorWidget;
