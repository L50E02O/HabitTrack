import { IRango } from "../../types/IRanking";

/**
 * Sistema de rangos del juego
 * Los usuarios suben de rango según los puntos acumulados
 */
export const RANGOS: IRango[] = [
    {
        nombre: "Novato",
        puntosMinimos: 0,
        puntosMaximos: 99,
        icono: "Seedling",
        color: "#8B7355",
        nivel: 1
    },
    {
        nombre: "Aprendiz",
        puntosMinimos: 100,
        puntosMaximos: 249,
        icono: "Sprout",
        color: "#6B8E23",
        nivel: 2
    },
    {
        nombre: "Comprometido",
        puntosMinimos: 250,
        puntosMaximos: 499,
        icono: "Flame",
        color: "#FF6B35",
        nivel: 3
    },
    {
        nombre: "Dedicado",
        puntosMinimos: 500,
        puntosMaximos: 999,
        icono: "Zap",
        color: "#FFD700",
        nivel: 4
    },
    {
        nombre: "Experto",
        puntosMinimos: 1000,
        puntosMaximos: 1999,
        icono: "Star",
        color: "#4169E1",
        nivel: 5
    },
    {
        nombre: "Maestro",
        puntosMinimos: 2000,
        puntosMaximos: 3999,
        icono: "Award",
        color: "#9370DB",
        nivel: 6
    },
    {
        nombre: "Élite",
        puntosMinimos: 4000,
        puntosMaximos: 7999,
        icono: "Crown",
        color: "#FF1493",
        nivel: 7
    },
    {
        nombre: "Leyenda",
        puntosMinimos: 8000,
        puntosMaximos: 15999,
        icono: "Trophy",
        color: "#FF4500",
        nivel: 8
    },
    {
        nombre: "Inmortal",
        puntosMinimos: 16000,
        puntosMaximos: Infinity,
        icono: "Sparkles",
        color: "#FFD700",
        nivel: 9
    }
];

/**
 * Obtiene el rango según los puntos
 */
export function obtenerRangoPorPuntos(puntos: number): IRango {
    for (const rango of RANGOS) {
        if (puntos >= rango.puntosMinimos && puntos <= rango.puntosMaximos) {
            return rango;
        }
    }
    return RANGOS[0]; // Por defecto, Novato
}

/**
 * Obtiene el siguiente rango
 */
export function obtenerSiguienteRango(rangoActual: IRango): IRango | null {
    const indiceActual = RANGOS.findIndex(r => r.nivel === rangoActual.nivel);
    if (indiceActual >= 0 && indiceActual < RANGOS.length - 1) {
        return RANGOS[indiceActual + 1];
    }
    return null; // Ya está en el rango máximo
}

/**
 * Calcula el progreso dentro del rango actual (0-100)
 */
export function calcularProgresoRango(puntos: number, rango: IRango): number {
    if (rango.puntosMaximos === Infinity) {
        return 100; // Rango máximo
    }
    const puntosEnRango = puntos - rango.puntosMinimos;
    const rangoTotal = rango.puntosMaximos - rango.puntosMinimos + 1;
    return Math.min(100, Math.round((puntosEnRango / rangoTotal) * 100));
}

/**
 * Calcula cuántos puntos faltan para el siguiente rango
 */
export function puntosFaltantesParaSiguienteRango(puntos: number, siguienteRango: IRango | null): number {
    if (!siguienteRango) return 0;
    return Math.max(0, siguienteRango.puntosMinimos - puntos);
}
