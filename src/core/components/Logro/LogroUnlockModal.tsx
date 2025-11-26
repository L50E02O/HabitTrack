import React, { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import BadgeIcon from './BadgeIcon';
import { ILogro } from '../../../types/ILogro';
import './LogroCard.css';

interface LogroUnlockModalProps {
  logro: ILogro;
  isOpen: boolean;
  onClose: () => void;
  protectoresGanados?: number;
}

export const LogroUnlockModal: React.FC<LogroUnlockModalProps> = ({
  logro,
  isOpen,
  onClose,
  protectoresGanados = 0,
}) => {
  const [showContent, setShowContent] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      // Mostrar contenido con delay para animación
      setTimeout(() => setShowContent(true), 100);

      // Generar confetti
      const confettiColors = ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#9370DB', '#00CED1'];
      const newConfetti = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      }));
      setConfetti(newConfetti);

      // Limpiar confetti después de animación
      setTimeout(() => setConfetti([]), 3000);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Confetti */}
      {confetti.map((conf) => (
        <div
          key={conf.id}
          className="confetti absolute w-2 h-2 rounded-full"
          style={{
            left: `${conf.left}%`,
            backgroundColor: conf.color,
            animationDelay: `${conf.delay}s`,
          }}
        />
      ))}

      {/* Modal */}
      <div
        className={`relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-md w-full border-2 border-yellow-500/30 transition-all duration-500 ${
          showContent ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-6 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_70%)]" />
          <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-2 animate-pulse" />
          <h2 className="text-2xl font-bold text-white relative z-10">
            ¡LOGRO DESBLOQUEADO!
          </h2>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Badge con animación */}
          <div className={`mb-6 ${showContent ? 'animate-unlock' : ''}`}>
            <BadgeIcon iconName={logro.icono} size={120} unlocked={true} />
          </div>

          {/* Nombre del logro */}
          <h3 className="text-3xl font-bold text-white mb-2">{logro.nombre_logro}</h3>

          {/* Criterio */}
          <div className="inline-block bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            {logro.criterio_racha} {logro.criterio_racha === 1 ? 'día' : 'días'} de racha
          </div>

          {/* Descripción */}
          <p className="text-gray-300 mb-6">{logro.descripcion}</p>

          {/* Protectores ganados */}
          {protectoresGanados > 0 && (
            <div className="bg-blue-500/20 border-2 border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-400">
                <span className="font-semibold">
                  +{protectoresGanados} {protectoresGanados === 1 ? 'Protector' : 'Protectores'}
                </span>
              </div>
              <p className="text-sm text-blue-300 mt-1">
                Úsalos para proteger tus rachas
              </p>
            </div>
          )}

          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg shadow-yellow-500/30"
          >
            ¡Genial!
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogroUnlockModal;
