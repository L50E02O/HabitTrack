import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import googleFitService from '../_shared/googleFitService.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
}

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

  const { code, state } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      error: 'Código de autorización faltante o inválido'
    });
  }

  try {
    const tokens = await googleFitService.exchangeCodeForTokens(code);
    const userId = state as string;

    if (!userId) {
      return res.status(400).json({
        error: 'ID de usuario no proporcionado en state'
      });
    }

    const { error: supabaseError } = await supabase
      .from('google_fit_tokens')
      .upsert(
        {
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: new Date(tokens.expiry_date).toISOString(),
          token_type: tokens.token_type,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

    if (supabaseError) {
      console.error('❌ Error saving tokens to Supabase:', supabaseError);
      throw supabaseError;
    }

    // Redireccionar al dashboard del frontend
    const frontendUrl = process.env.FRONTEND_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard?googleFit=success`);
  } catch (error) {
    console.error('Error en callback:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Error durante la autenticación. Por favor, intenta de nuevo.'
    });
  }
}
