import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import googleFitService from '../../src/services/googleFit/googleFitService';
import type { GoogleFitTokens } from '../../src/services/googleFit/types';

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

  const { userId, date } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      error: 'userId es requerido'
    });
  }

  try {
    console.log('DEBUG: Fetching tokens for user:', userId);
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_fit_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData) {
      console.error('❌ Error fetching tokens from Supabase:', tokenError);
      return res.status(401).json({
        error: 'Usuario no autenticado con Google Fit. Por favor, autentica primero.'
      });
    }

    const tokens: GoogleFitTokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: new Date(tokenData.expiry_date).getTime(),
      token_type: 'Bearer'
    };

    const targetDate = date ? new Date(date as string) : new Date();
    const stepsData = await googleFitService.getDailySteps(tokens, targetDate);

    if (tokenData.refresh_token && googleFitService.isTokenExpired(tokens.expiry_date)) {
      await supabase
        .from('google_fit_tokens')
        .update({
          access_token: tokens.access_token,
          expiry_date: new Date(tokens.expiry_date).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    res.json(stepsData);
  } catch (error) {
    console.error('Error al obtener pasos:', error);
    res.status(500).json({
      error: 'No se pudieron obtener los datos de pasos'
    });
  }
}
