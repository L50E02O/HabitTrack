/**
 * Funciones de utilidad para gestionar el reseteo de progreso en hábitos
 * basado en intervalos de tiempo
 */

/**
 * Calcula si debe resetearse el progreso basado en el intervalo y la fecha
 * @param intervalo - Tipo de intervalo: 'diario', 'semanal', 'mensual'
 * @param lastResetDate - Fecha del último reseteo
 * @returns true si debe resetear, false si no
 */
export function shouldResetProgress(
  intervalo: 'diario' | 'semanal' | 'mensual',
  lastResetDate: Date | string | null
): boolean {
  if (!lastResetDate) return true; // Primera vez, siempre resetea

  const last = new Date(lastResetDate);
  const now = new Date();

  // Normalizar horas a UTC para comparación correcta
  last.setUTCHours(0, 0, 0, 0);
  now.setUTCHours(0, 0, 0, 0);

  const diffTime = now.getTime() - last.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  switch (intervalo) {
    case 'diario':
      return diffDays >= 1;
    case 'semanal':
      return diffDays >= 7;
    case 'mensual':
      return diffDays >= 30;
    default:
      return false;
  }
}

/**
 * Calcula la próxima fecha de reseteo basada en el intervalo
 * @param intervalo - Tipo de intervalo
 * @returns Date de la próxima fecha de reseteo
 */
export function getNextResetDate(intervalo: 'diario' | 'semanal' | 'mensual'): Date {
  const now = new Date();
  const nextReset = new Date(now);

  switch (intervalo) {
    case 'diario':
      nextReset.setDate(nextReset.getDate() + 1);
      break;
    case 'semanal':
      nextReset.setDate(nextReset.getDate() + 7);
      break;
    case 'mensual':
      nextReset.setDate(nextReset.getDate() + 30);
      break;
  }

  return nextReset;
}

/**
 * Formatea un intervalo para mostrar en la UI
 * @param intervalo - Tipo de intervalo
 * @returns Texto formateado
 */
export function formatIntervaloReset(intervalo: 'diario' | 'semanal' | 'mensual'): string {
  switch (intervalo) {
    case 'diario':
      return 'Diario (24h)';
    case 'semanal':
      return 'Semanal (7 días)';
    case 'mensual':
      return 'Mensual (30 días)';
    default:
      return 'Desconocido';
  }
}
