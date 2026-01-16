import { Request, Response, Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import googleFitService from './googleFitService';
import type { GoogleFitTokens } from './types';

// Crear cliente de Supabase con Service Role para bypass RLS
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor.');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const router = Router();

/**
 * Ruta para iniciar el flujo de autenticación de Google Fit
 * GET /api/google-fit/auth
 */
router.get('/auth', (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      error: 'userId es requerido'
    });
  }

  try {
    const authUrl = googleFitService.getAuthUrl(userId);
    res.json({ authUrl });
  } catch (error) {
    console.error('Error al generar URL de autenticación:', error);
    res.status(500).json({
      error: 'No se pudo generar la URL de autenticación'
    });
  }
});

/**
 * Ruta de callback para intercambiar código por tokens
 * GET /api/google-fit/callback?code=CODE&state=STATE
 */
router.get('/callback', async (req: Request, res: Response) => {
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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard?googleFit=success`);
  } catch (error) {
    console.error('Error en callback:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Error durante la autenticación. Por favor, intenta de nuevo.'
    });
  }
});

/**
 * Obtener pasos del día actual
 * GET /api/google-fit/steps?userId=USER_ID
 */
router.get('/steps', async (req: Request, res: Response) => {
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
});

/**
 * Obtener pasos de un rango de fechas
 * GET /api/google-fit/steps-range?userId=USER_ID&startDate=2024-01-01&endDate=2024-01-31
 */
router.get('/steps-range', async (req: Request, res: Response) => {
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
      .eq('user_id', userId)
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
});

/**
 * Revocar autorización
 * POST /api/google-fit/revoke?userId=USER_ID
 */
router.post('/revoke', async (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      error: 'userId es requerido'
    });
  }

  try {
    const { error } = await supabase
      .from('google_fit_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Autorización revocada exitosamente'
    });
  } catch (error) {
    console.error('Error al revocar autorización:', error);
    res.status(500).json({
      error: 'No se pudo revocar la autorización'
    });
  }
});

/**
 * Sincronizar datos a tabla datos_salud (más eficiente que llamar API cada vez)
 * POST /api/google-fit/sync?userId=USER_ID&daysBack=30
 * Guarda datos históricos en la BD para acceso rápido
 */
router.post('/sync', async (req: Request, res: Response) => {
  const { userId, daysBack = '30' } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      error: 'userId es requerido'
    });
  }

  try {
    console.log(`🔄 Sincronizando datos de Google Fit para usuario: ${userId}`);
    
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_fit_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('user_id', userId)
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

    const days = Math.min(parseInt(daysBack as string) || 30, 365);
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    console.log(`📊 Obteniendo datos de ${startDate.toDateString()} a ${endDate.toDateString()}`);

    const stepsData = await googleFitService.getDailyStepsRange(tokens, startDate, endDate);

    // Guardar en tabla datos_salud para acceso rápido después
    const dataToInsert = stepsData
      .filter(day => day.steps > 0 || day.calories > 0 || day.distance > 0) // Solo días con datos
      .map(day => ({
        id_perfil: userId,
        fecha: day.date,
        pasos: day.steps,
        calorias_quemadas: day.calories,
        distancia_km: day.distance,
        fecha_sincronizacion: new Date().toISOString()
      }));

    if (dataToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('datos_salud')
        .upsert(dataToInsert, { onConflict: 'id_perfil,fecha' });

      if (insertError) {
        console.error('Error al guardar datos en datos_salud:', insertError);
        return res.status(500).json({
          error: 'Error al guardar datos en la base de datos'
        });
      }
    }

    res.json({
      success: true,
      message: `Sincronizados ${dataToInsert.length} días de datos`,
      dataSync: {
        days: dataToInsert.length,
        totalSteps: dataToInsert.reduce((sum, d) => sum + d.pasos, 0),
        totalCalories: dataToInsert.reduce((sum, d) => sum + d.calorias_quemadas, 0),
        totalDistance: parseFloat(dataToInsert.reduce((sum, d) => sum + d.distancia_km, 0).toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error al sincronizar datos:', error);
    res.status(500).json({
      error: 'No se pudieron sincronizar los datos'
    });
  }
});

export default router;
