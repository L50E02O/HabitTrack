import React from 'react';
import {
  Flame,
  Zap,
  Star,
  Gem,
  Award,
  Sparkles,
  Medal,
  Trophy,
  Crown,
  Sparkle,
  Rocket,
  LucideIcon,
} from 'lucide-react';

interface BadgeIconProps {
  iconName: string;
  size?: number;
  className?: string;
  unlocked?: boolean;
}

// Mapeo de nombres de iconos a componentes de Lucide
const iconMap: Record<string, LucideIcon> = {
  Flame,
  Zap,
  Star,
  Gem,
  Award,
  Sparkles,
  Medal,
  Trophy,
  Crown,
  Sparkle,
  Rocket,
};

// Colores según el nivel del logro
const colorMap: Record<string, { gradient: string; glow: string }> = {
  Flame: { gradient: 'from-orange-500 to-red-500', glow: 'shadow-orange-500/50' },
  Zap: { gradient: 'from-yellow-400 to-orange-500', glow: 'shadow-yellow-500/50' },
  Star: { gradient: 'from-blue-400 to-purple-500', glow: 'shadow-blue-500/50' },
  Gem: { gradient: 'from-cyan-400 to-blue-500', glow: 'shadow-cyan-500/50' },
  Award: { gradient: 'from-purple-400 to-pink-500', glow: 'shadow-purple-500/50' },
  Sparkles: { gradient: 'from-pink-400 to-rose-500', glow: 'shadow-pink-500/50' },
  Medal: { gradient: 'from-yellow-500 to-amber-600', glow: 'shadow-yellow-600/50' },
  Trophy: { gradient: 'from-amber-500 to-yellow-600', glow: 'shadow-amber-600/50' },
  Crown: { gradient: 'from-yellow-400 to-orange-500', glow: 'shadow-yellow-500/50' },
  Sparkle: { gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-600/50' },
  Rocket: { gradient: 'from-indigo-500 to-purple-600', glow: 'shadow-indigo-600/50' },
};

export const BadgeIcon: React.FC<BadgeIconProps> = ({
  iconName,
  size = 64,
  className = '',
  unlocked = true,
}) => {
  const IconComponent = iconMap[iconName] || Star;
  const colors = colorMap[iconName] || colorMap.Star;

  if (!unlocked) {
    // Badge bloqueado: gris con candado
    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <div
          className="flex items-center justify-center rounded-full bg-gray-700 border-4 border-gray-600"
          style={{ width: size, height: size }}
        >
          <IconComponent
            size={size * 0.5}
            className="text-gray-500"
            strokeWidth={2}
          />
        </div>
        {/* Candado superpuesto */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-gray-900/80 rounded-full p-2">
            <svg
              width={size * 0.3}
              height={size * 0.3}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-400"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
              <path d="M12 17v-2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Badge desbloqueado: gradiente con brillo
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Glow effect */}
      <div
        className={`absolute inset-0 rounded-full blur-xl opacity-60 ${colors.glow}`}
        style={{ width: size, height: size }}
      />

      {/* Badge principal */}
      <div
        className={`relative flex items-center justify-center rounded-full bg-gradient-to-br ${colors.gradient} border-4 border-white/20 shadow-2xl`}
        style={{ width: size, height: size }}
      >
        <IconComponent
          size={size * 0.5}
          className="text-white drop-shadow-lg"
          strokeWidth={2.5}
        />
      </div>

      {/* Brillo animado */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div className="absolute w-full h-full animate-pulse">
          <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shine" />
        </div>
      </div>
    </div>
  );
};

export default BadgeIcon;
