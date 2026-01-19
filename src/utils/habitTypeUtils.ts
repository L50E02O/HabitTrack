// Utilidades para clasificar y manejar diferentes tipos de hábitos

/**
 * Determina el tipo de hábito según su unidad de medida
 */
export function getHabitType(unidadMedida: string | null | undefined): 'duration' | 'accumulation' {
    // Validación defensiva: si no hay unidad de medida, asumir acumulación
    if (!unidadMedida) {
        return 'accumulation';
    }

    const unidad = unidadMedida.toLowerCase().trim();

    // Hábitos de duración (tiempo)
    if (unidad === 'minutos' || unidad === 'horas') {
        return 'duration';
    }

    // Resto son hábitos de acumulación
    return 'accumulation';
}

/**
 * Valida si una cadena tiene formato de tiempo válido (HH:MM)
 * Acepta: "1:30", "0:45", "12:00"
 * Rechaza: "1:90", "25:00", "abc", "1:5" (debe ser 1:05)
 */
export function isValidTimeFormat(timeString: string): boolean {
    const timeRegex = /^(\d{1,2}):([0-5]\d)$/;
    const match = timeString.match(timeRegex);

    if (!match) return false;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    // Validar que las horas sean razonables (0-23) y minutos válidos (0-59)
    return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
}

/**
 * Convierte una cadena de tiempo (HH:MM) a número decimal según la unidad objetivo
 * @param timeString - Formato "HH:MM" (ej. "1:30")
 * @param targetUnit - Unidad a la que convertir ('minutos' o 'horas')
 * @returns Número decimal en la unidad especificada
 * 
 * Ejemplos:
 * - parseTimeToNumber("1:30", "horas") → 1.5
 * - parseTimeToNumber("1:30", "minutos") → 90
 * - parseTimeToNumber("0:45", "horas") → 0.75
 */
export function parseTimeToNumber(
    timeString: string,
    targetUnit: 'minutos' | 'horas'
): number {
    if (!isValidTimeFormat(timeString)) {
        throw new Error('Formato de tiempo inválido. Use HH:MM');
    }

    const [hoursStr, minutesStr] = timeString.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    // Convertir todo a minutos primero
    const totalMinutes = hours * 60 + minutes;

    if (targetUnit === 'minutos') {
        return totalMinutes;
    } else {
        // Convertir a horas con decimales
        return totalMinutes / 60;
    }
}

/**
 * Convierte un número decimal a formato de tiempo (HH:MM)
 * @param value - Valor numérico
 * @param unit - Unidad del valor ('minutos' o 'horas')
 * @returns String en formato "HH:MM"
 * 
 * Ejemplos:
 * - numberToTimeFormat(1.5, "horas") → "1:30"
 * - numberToTimeFormat(90, "minutos") → "1:30"
 * - numberToTimeFormat(0.75, "horas") → "0:45"
 */
export function numberToTimeFormat(
    value: number,
    unit: 'minutos' | 'horas'
): string {
    let totalMinutes: number;

    if (unit === 'horas') {
        totalMinutes = Math.round(value * 60);
    } else {
        totalMinutes = Math.round(value);
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Formatea el progreso para visualización según el tipo de hábito
 * @param progress - Valor de progreso
 * @param unidadMedida - Unidad de medida del hábito
 * @returns String formateado para mostrar
 * 
 * Ejemplos:
 * - formatProgressDisplay(1.5, "horas") → "1:30"
 * - formatProgressDisplay(2.75, "litros") → "2.75"
 * - formatProgressDisplay(3, "repeticiones") → "3"
 */
export function formatProgressDisplay(
    progress: number,
    unidadMedida: string
): string {
    const habitType = getHabitType(unidadMedida);

    if (habitType === 'duration') {
        const unit = unidadMedida.toLowerCase() as 'minutos' | 'horas';
        return numberToTimeFormat(progress, unit);
    }

    // Para hábitos de acumulación, mostrar con máximo 2 decimales
    // Si es entero, no mostrar decimales
    if (progress % 1 === 0) {
        return progress.toString();
    }

    return progress.toFixed(2).replace(/\.?0+$/, '');
}
