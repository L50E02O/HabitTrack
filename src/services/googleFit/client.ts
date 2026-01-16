import googleFitService from './googleFitService';
import type { GoogleFitTokens, DailyStepsData } from './types';

/**
 * Cliente para consumir Google Fit desde el frontend
 * Uso: const stepsData = await googleFitClient.getDailySteps(userId)
 */
class GoogleFitClient {
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = '/api') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Obtener URL de autenticación
   */
  async getAuthUrl(userId: string): Promise<string> {
    const response = await fetch(`${this.apiBaseUrl}/google-fit/auth?userId=${userId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener URL de autenticación');
    }

    return data.authUrl;
  }

  /**
   * Obtener pasos del día actual
   */
  async getDailySteps(userId: string, date?: Date): Promise<DailyStepsData> {
    const params = new URLSearchParams({ userId });

    if (date) {
      params.append('date', date.toISOString().split('T')[0]);
    }

    const response = await fetch(`${this.apiBaseUrl}/google-fit/steps?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener pasos');
    }

    return data;
  }

  /**
   * Obtener pasos de un rango de fechas
   */
  async getDailyStepsRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyStepsData[]> {
    const params = new URLSearchParams({
      userId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });

    const response = await fetch(`${this.apiBaseUrl}/google-fit/steps-range?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener rango de pasos');
    }

    return data;
  }

  /**
   * Revocar autorización
   */
  async revokeAuthorization(userId: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/google-fit/revoke?userId=${userId}`, {
      method: 'POST'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al revocar autorización');
    }
  }

  /**
   * Iniciar flujo de autenticación con redirección
   */
  async initiateLogin(userId: string): Promise<void> {
    const authUrl = await this.getAuthUrl(userId);
    window.location.href = authUrl;
  }
}

export default new GoogleFitClient();
