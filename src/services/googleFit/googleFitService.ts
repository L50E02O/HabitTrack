import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import type { GoogleFitTokens, GoogleFitAuthResponse, DailyStepsData, AggregateDataset } from './types';

class GoogleFitService {
  private oauth2Client: OAuth2Client;
  private fitnessApi;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.GOOGLE_FIT_CLIENT_ID || '';
    this.clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET || '';
    this.redirectUri = process.env.GOOGLE_FIT_REDIRECT_URI || '';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Faltan variables de entorno de Google Fit');
    }

    this.oauth2Client = new OAuth2Client(this.clientId, this.clientSecret, this.redirectUri);
    this.fitnessApi = google.fitness('v1');
  }

  /**
   * Obtener URL de autenticación de Google
   */
  /**
   * Obtener URL de autenticación de Google
   */
  getAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.location.read',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: userId
    });
  }

  /**
   * Intercambiar código de autorización por tokens
   */
  async exchangeCodeForTokens(code: string): Promise<GoogleFitTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new Error('No se recibió access_token');
      }

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
        expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
        token_type: tokens.token_type || 'Bearer'
      };
    } catch (error) {
      console.error('Error al intercambiar código:', error);
      throw new Error(`Error en la autenticación de Google Fit: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Refrescar token expirado
   */
  async refreshAccessToken(refreshToken: string): Promise<GoogleFitTokens> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('No se pudo refrescar el token');
      }

      return {
        access_token: credentials.access_token,
        refresh_token: refreshToken,
        expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
        token_type: credentials.token_type || 'Bearer'
      };
    } catch (error) {
      console.error('Error al refrescar token:', error);
      throw new Error('El token de refresco es inválido. Por favor, vuelve a autenticarte.');
    }
  }

  /**
   * Verificar si el token está expirado
   */
  isTokenExpired(expiryDate: number): boolean {
    return Date.now() >= expiryDate - 60000;
  }

  /**
   * Obtener pasos diarios
   */
  async getDailySteps(
    tokens: GoogleFitTokens,
    date?: Date
  ): Promise<DailyStepsData> {
    const targetDate = date || new Date();

    if (this.isTokenExpired(tokens.expiry_date)) {
      const refreshedTokens = await this.refreshAccessToken(tokens.refresh_token);
      Object.assign(tokens, refreshedTokens);
    }

    this.oauth2Client.setCredentials({
      access_token: tokens.access_token
    });

    try {
      const startTime = new Date(targetDate);
      startTime.setHours(0, 0, 0, 0);

      const endTime = new Date(targetDate);
      endTime.setHours(23, 59, 59, 999);

      const startTimeMillis = startTime.getTime();
      const endTimeMillis = endTime.getTime();

      const response = await this.fitnessApi.users.dataset.aggregate({
        userId: 'me',
        requestBody: {
          aggregateBy: [
            {
              dataTypeName: 'com.google.step_count.delta',
              dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
            },
            {
              dataTypeName: 'com.google.calories.expended',
              dataSourceId: 'derived:com.google.calories.expended:com.google.android.gms:total_calories_expended'
            },
            {
              dataTypeName: 'com.google.distance.delta',
              dataSourceId: 'derived:com.google.distance.delta:com.google.android.gms:total_distance'
            }
          ],
          bucketByTime: {
            durationMillis: 86400000
          },
          startTimeMillis,
          endTimeMillis
        },
        auth: this.oauth2Client
      });

      const data = response.data as AggregateDataset;
      return this.parseAggregateData(data, targetDate);
    } catch (error) {
      console.error('Error al obtener pasos:', error);
      throw new Error('Error al obtener datos de fitness de Google Fit');
    }
  }

  /**
   * Obtener pasos de múltiples días
   */
  async getDailyStepsRange(
    tokens: GoogleFitTokens,
    startDate: Date,
    endDate: Date
  ): Promise<DailyStepsData[]> {
    const results: DailyStepsData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      try {
        const dayData = await this.getDailySteps(tokens, new Date(currentDate));
        results.push(dayData);
      } catch (error) {
        console.error(`Error al obtener datos para ${currentDate}:`, error);
        results.push({
          date: currentDate.toISOString().split('T')[0],
          steps: 0,
          calories: 0,
          distance: 0
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return results;
  }

  /**
   * Parsear la respuesta de agregados de Google Fit
   */
  private parseAggregateData(data: AggregateDataset, date: Date): DailyStepsData {
    let steps = 0;
    let calories = 0;
    let distance = 0;

    if (data.bucket && data.bucket.length > 0) {
      const bucket = data.bucket[0];

      if (bucket.dataset) {
        bucket.dataset.forEach((dataset) => {
          if (dataset.point && dataset.point.length > 0) {
            dataset.point.forEach((point) => {
              if (point.value && point.value.length > 0) {
                const value = point.value[0];

                if (value.intVal !== undefined) {
                  steps += value.intVal;
                }

                if (value.fpVal !== undefined) {
                  if (steps === 0) {
                    calories += value.fpVal;
                  } else {
                    distance += value.fpVal / 1000;
                  }
                }
              }
            });
          }
        });
      }
    }

    return {
      date: date.toISOString().split('T')[0],
      steps: Math.round(steps),
      calories: Math.round(calories),
      distance: Math.round(distance * 100) / 100
    };
  }
}

export default new GoogleFitService();
