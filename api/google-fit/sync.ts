import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import googleFitService, { type GoogleFitTokens } from '../_shared/googleFitService';

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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}
