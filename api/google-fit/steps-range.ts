import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import googleFitService, { type GoogleFitTokens } from '../_shared/googleFitService.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, startDate, endDate } = req.query;

  if (!userId || !startDate || !endDate) {
    return res.status(400).json({
      error: 'userId, startDate y endDate son requeridos'
    });
  }

  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_fit_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', userId as string)
      .single();

    if (tokenError || !tokenData) {
      return res.status(401).json({
        error: 'Usuario no autenticado con Google Fit'
      });
    }

    const tokens: GoogleFitTokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: new Date(tokenData.expiry_date).getTime(),
      token_type: 'Bearer'
    };

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    const stepsData = await googleFitService.getDailyStepsRange(tokens, start, end);

    res.json(stepsData);
  } catch (error) {
    console.error('Error al obtener rango de pasos:', error);
    res.status(500).json({
      error: 'No se pudieron obtener los datos de pasos'
    });
  }
}
