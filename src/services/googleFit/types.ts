export interface GoogleFitTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
}

export interface GoogleFitCredentials {
  userId: string;
  tokens: GoogleFitTokens;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyStepsData {
  date: string;
  steps: number;
  calories: number;
  distance: number;
}

export interface AggregateDataset {
  bucket: Array<{
    startTimeMillis: string;
    endTimeMillis: string;
    dataset: Array<{
      dataSourceId?: string;
      point: Array<{
        value: Array<{
          intVal?: number;
          fpVal?: number;
        }>;
      }>;
    }>;
  }>;
}

export interface GoogleFitAuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  id_token?: string;
}
