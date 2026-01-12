import { useState, useEffect, useCallback } from 'react';
import googleFitClient from '../services/googleFit/client';
import type { DailyStepsData } from '../services/googleFit/types';

interface UseGoogleFitOptions {
  userId: string;
  autoFetch?: boolean;
}

/**
 * Hook para gestionar datos de Google Fit
 * Uso: const { stepsData, loading, error, refreshSteps } = useGoogleFit({ userId })
 */
export function useGoogleFit({ userId, autoFetch = true }: UseGoogleFitOptions) {
  const [stepsData, setStepsData] = useState<DailyStepsData | null>(null);
  const [stepsRange, setStepsRange] = useState<DailyStepsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);


  const refreshSteps = useCallback(async (date?: Date) => {
    setLoading(true);
    setError(null);

    try {
      const data = await googleFitClient.getDailySteps(userId, date);
      setStepsData(data);
      setIsAuthenticated(true);
    } catch (err) {
      let errorMessage = 'Error desconocido';

      if (err instanceof Error) {
        errorMessage = err.message;

        // Detectar si el error es por servidor backend no disponible
        if (errorMessage.includes('Unexpected token') ||
          errorMessage.includes('JSON') ||
          errorMessage.includes('DOCTYPE')) {
          errorMessage = '⚠️ Servidor backend no disponible. Por favor, ejecuta "npm run dev:api" en otra terminal.';
        }
      }

      setError(errorMessage);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const getStepsRange = useCallback(async (startDate: Date, endDate: Date) => {
    setLoading(true);
    setError(null);

    try {
      const data = await googleFitClient.getDailyStepsRange(userId, startDate, endDate);
      setStepsRange(data);
      setIsAuthenticated(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const initiateLogin = useCallback(async () => {
    try {
      await googleFitClient.initiateLogin();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en autenticación';
      setError(errorMessage);
    }
  }, []);

  const revoke = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await googleFitClient.revokeAuthorization(userId);
      setIsAuthenticated(false);
      setStepsData(null);
      setStepsRange([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (autoFetch && userId) {
      refreshSteps();
    }
  }, [userId, autoFetch, refreshSteps]);

  return {
    stepsData,
    stepsRange,
    loading,
    error,
    isAuthenticated,
    refreshSteps,
    getStepsRange,
    initiateLogin,
    revoke
  };
}
