import { useState, useEffect } from 'react';
import { obtenerRangoPorPuntos } from '../core/constants/rangos';
import type { IRango } from '../types/IRanking';

/**
 * Hook para detectar cambios de rango
 * Compara el rango actual con el anterior y notifica si hubo cambio
 */
export function useRankDetection(puntos: number) {
    const [rangoAnterior, setRangoAnterior] = useState<IRango | null>(null);
    const [rangoActual, setRangoActual] = useState<IRango | null>(null);
    const [huboRankUp, setHuboRankUp] = useState(false);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const nuevoRango = obtenerRangoPorPuntos(puntos);
        
        // Si no hay rango anterior, inicializar sin mostrar modal
        if (!rangoAnterior) {
            setRangoAnterior(nuevoRango);
            setRangoActual(nuevoRango);
            setInitialized(true);
            return;
        }

        // Solo detectar cambio si ya está inicializado (evita mostrar al cargar)
        if (initialized && nuevoRango.nivel > rangoAnterior.nivel) {
            setRangoActual(nuevoRango);
            setHuboRankUp(true);
        } else if (nuevoRango.nivel !== rangoAnterior.nivel) {
            setRangoAnterior(nuevoRango);
            setRangoActual(nuevoRango);
        }
    }, [puntos]);

    const resetRankUp = () => {
        if (rangoActual) {
            setRangoAnterior(rangoActual);
        }
        setHuboRankUp(false);
    };

    return {
        rangoAnterior,
        rangoActual,
        huboRankUp,
        resetRankUp
    };
}
