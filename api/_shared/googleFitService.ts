// Copia del servicio de Google Fit para uso en serverless functions
// Esto evita problemas de importación desde src/ en Vercel
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleFitTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
}

export interface DailyStepsData {
  date: string;
  steps: number;
  calories: number;
  distance: number;
}

class GoogleFitService {
  private oauth2Client: OAuth2Client;
  private fitnessApi: any;
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

  isTokenExpired(expiryDate: number): boolean {
    return Date.now() >= expiryDate - 60000;
  }

  async getDailySteps(tokens: GoogleFitTokens, date?: Date): Promise<DailyStepsData> {
    const targetDate = date || new Date();

    if (this.isTokenExpired(tokens.expiry_date)) {
      const refreshedTokens = await this.refreshAccessToken(tokens.refresh_token);
      Object.assign(tokens, refreshedTokens);
    }

    this.oauth2Client.setCredentials({
      access_token: tokens.access_token
    });

    try {
      const startTime = new Date(Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        0, 0, 0, 0
      ));

      const endTime = new Date(Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        23, 59, 59, 999
      ));

      const startTimeMillis = startTime.getTime().toString();
      const endTimeMillis = endTime.getTime().toString();

      const response = await (this.fitnessApi.users as any).dataset.aggregate({
        userId: 'me',
        auth: this.oauth2Client,
        requestBody: {
          aggregateBy: [
            { dataTypeName: 'com.google.step_count.delta' },
            { dataTypeName: 'com.google.calories.expended' },
            { dataTypeName: 'com.google.distance.delta' }
          ],
          bucketByTime: {
            durationMillis: '86400000'
          },
          startTimeMillis,
          endTimeMillis
        }
      });

      const data = (response as any).data;
      return this.parseAggregateData(data, targetDate);
    } catch (error) {
      console.error('Error al obtener pasos:', error);
      throw new Error('Error al obtener datos de fitness de Google Fit');
    }
  }

  async getDailyStepsRange(tokens: GoogleFitTokens, startDate: Date, endDate: Date): Promise<DailyStepsData[]> {
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

  private parseAggregateData(data: any, date: Date): DailyStepsData {
    let steps = 0;
    let calories = 0;
    let distance = 0;

    if (data.bucket && data.bucket.length > 0) {
      const bucket = data.bucket[0];

      if (bucket.dataset && bucket.dataset.length > 0) {
        if (bucket.dataset[0]?.point) {
          bucket.dataset[0].point.forEach((point: any) => {
            if (point.value && point.value.length > 0) {
              const value = point.value[0];
              if (value.intVal !== undefined) {
                steps += value.intVal;
              }
            }
          });
        }

        if (bucket.dataset[1]?.point) {
          bucket.dataset[1].point.forEach((point: any) => {
            if (point.value && point.value.length > 0) {
              const value = point.value[0];
              if (value.fpVal !== undefined) {
                calories += value.fpVal;
              }
            }
          });
        }

        if (bucket.dataset[2]?.point) {
          bucket.dataset[2].point.forEach((point: any) => {
            if (point.value && point.value.length > 0) {
              const value = point.value[0];
              if (value.fpVal !== undefined) {
                distance += value.fpVal / 1000;
              }
            }
          });
        }
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
