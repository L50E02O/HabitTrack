import React from 'react';
import { ILogroUsuario } from '../../../types/ILogroUsuario';
import BadgeIcon from './BadgeIcon';

interface LogroCardProps {
  logro: {
    id_logro: string;
    nombre_logro: string;
    descripcion: string;
    icono: string;
    criterio_racha: number;
  };
  logroUsuario?: ILogroUsuario | null;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  currentStreak?: number;
}

const sizeMap = {
  small: { badge: 48, card: 'w-32' },
  medium: { badge: 80, card: 'w-48' },
  large: { badge: 120, card: 'w-64' },
};

export const LogroCard: React.FC<LogroCardProps> = ({
  logro,
  logroUsuario,
  size = 'medium',
  showProgress = false,
  currentStreak = 0,
}) => {
  const unlocked = !!logroUsuario;
  const { badge, card } = sizeMap[size];
  const progress = unlocked
    ? 100
    : Math.min(Math.round((currentStreak / logro.criterio_racha) * 100), 100);

  return (
    <div
      className={`${card} flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
        unlocked
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-yellow-500/30 shadow-lg shadow-yellow-500/20'
          : 'bg-slate-800/50 border-2 border-slate-700'
      }`}
      style={{
        background: unlocked 
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))'
          : 'rgba(30, 41, 59, 0.5)',
        border: unlocked
          ? '2px solid rgba(251, 191, 36, 0.3)'
          : '2px solid rgba(71, 85, 105, 0.5)',
        boxShadow: unlocked
          ? '0 10px 40px rgba(251, 191, 36, 0.2)'
          : 'none'
      }}
    >
      {/* Badge Icon */}
      <div className="mb-3">
        <BadgeIcon iconName={logro.icono} size={badge} unlocked={unlocked} />
      </div>

      {/* Nombre del logro */}
      <h3
        className={`text-center font-bold mb-1 ${
          size === 'small' ? 'text-sm' : size === 'medium' ? 'text-base' : 'text-lg'
        } ${unlocked ? 'text-white' : 'text-gray-500'}`}
      >
        {logro.nombre_logro}
      </h3>

      {/* Criterio */}
      <p
        className={`text-center mb-2 ${
          size === 'small' ? 'text-xs' : 'text-sm'
        } ${unlocked ? 'text-yellow-400' : 'text-gray-600'}`}
      >
        {logro.criterio_racha} {logro.criterio_racha === 1 ? 'día' : 'días'}
      </p>

      {/* Descripción */}
      {size !== 'small' && (
        <p
          className={`text-center text-xs ${
            unlocked ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          {logro.descripcion}
        </p>
      )}

      {/* Fecha de desbloqueo */}
      {unlocked && logroUsuario && (
        <div className="mt-2 text-xs text-gray-500">
          Desbloqueado:{' '}
          {new Date(logroUsuario.fecha_obtenido).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      )}

      {/* Barra de progreso */}
      {!unlocked && showProgress && (
        <div className="w-full mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{currentStreak} días</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LogroCard;
