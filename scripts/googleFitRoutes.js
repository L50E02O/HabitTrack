import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

const router = Router();

// Configuración de Google OAuth2
const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_FIT_CLIENT_ID,
    process.env.GOOGLE_FIT_CLIENT_SECRET,
    process.env.GOOGLE_FIT_REDIRECT_URI
);

// Cliente de Supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Ruta para iniciar el flujo de autenticación de Google Fit
 * GET /api/google-fit/auth
 */
router.get('/auth', (req, res) => {
    try {
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/fitness.activity.read',
                'https://www.googleapis.com/auth/fitness.body.read',
                'https://www.googleapis.com/auth/fitness.location.read'
            ],
            state: req.query.userId || ''
        });
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
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
        return res.status(400).json({
            error: 'Código de autorización faltante o inválido'
        });
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        const userId = state;

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
                    token_type: tokens.token_type || 'Bearer',
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'user_id' }
            );

        if (supabaseError) {
            throw supabaseError;
        }

        // Redirigir al frontend con éxito
        res.redirect('http://localhost:5173/?google_fit_auth=success');
    } catch (error) {
        console.error('Error en callback:', error);
        res.redirect('http://localhost:5173/?google_fit_auth=error');
    }
});

/**
 * Obtener pasos del día actual
 * GET /api/google-fit/steps?userId=USER_ID
 */
router.get('/steps', async (req, res) => {
    const { userId, date } = req.query;

    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
            error: 'userId es requerido'
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
                error: 'Usuario no autenticado con Google Fit. Por favor, autentica primero.'
            });
        }

        // Configurar tokens en el cliente OAuth2
        oauth2Client.setCredentials({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expiry_date: new Date(tokenData.expiry_date).getTime()
        });

        const fitness = google.fitness({ version: 'v1', auth: oauth2Client });

        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const response = await fitness.users.dataset.aggregate({
            userId: 'me',
            requestBody: {
                aggregateBy: [
                    {
                        dataTypeName: 'com.google.step_count.delta',
                        dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
                    },
                    {
                        dataTypeName: 'com.google.calories.expended'
                    },
                    {
                        dataTypeName: 'com.google.distance.delta'
                    }
                ],
                bucketByTime: { durationMillis: 86400000 }, // 1 día
                startTimeMillis: startOfDay.getTime(),
                endTimeMillis: endOfDay.getTime()
            }
        });

        let steps = 0;
        let calories = 0;
        let distance = 0;

        if (response.data.bucket && response.data.bucket.length > 0) {
            const bucket = response.data.bucket[0];

            if (bucket.dataset) {
                bucket.dataset.forEach(dataset => {
                    if (dataset.point && dataset.point.length > 0) {
                        dataset.point.forEach(point => {
                            if (point.value && point.value.length > 0) {
                                const value = point.value[0];

                                if (dataset.dataSourceId?.includes('step_count')) {
                                    steps += value.intVal || 0;
                                } else if (dataset.dataSourceId?.includes('calories')) {
                                    calories += value.fpVal || 0;
                                } else if (dataset.dataSourceId?.includes('distance')) {
                                    distance += (value.fpVal || 0) / 1000; // Convertir a km
                                }
                            }
                        });
                    }
                });
            }
        }

        res.json({
            steps,
            calories: Math.round(calories),
            distance: parseFloat(distance.toFixed(2)),
            date: targetDate.toISOString().split('T')[0]
        });
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
router.get('/steps-range', async (req, res) => {
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

        oauth2Client.setCredentials({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expiry_date: new Date(tokenData.expiry_date).getTime()
        });

        const fitness = google.fitness({ version: 'v1', auth: oauth2Client });

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const response = await fitness.users.dataset.aggregate({
            userId: 'me',
            requestBody: {
                aggregateBy: [
                    {
                        dataTypeName: 'com.google.step_count.delta',
                        dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
                    }
                ],
                bucketByTime: { durationMillis: 86400000 },
                startTimeMillis: start.getTime(),
                endTimeMillis: end.getTime()
            }
        });

        const stepsData = [];

        if (response.data.bucket) {
            response.data.bucket.forEach(bucket => {
                let steps = 0;

                if (bucket.dataset && bucket.dataset.length > 0) {
                    bucket.dataset.forEach(dataset => {
                        if (dataset.point) {
                            dataset.point.forEach(point => {
                                if (point.value && point.value.length > 0) {
                                    steps += point.value[0].intVal || 0;
                                }
                            });
                        }
                    });
                }

                const bucketDate = new Date(parseInt(bucket.startTimeMillis));
                stepsData.push({
                    steps,
                    calories: 0,
                    distance: 0,
                    date: bucketDate.toISOString().split('T')[0]
                });
            });
        }

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
router.post('/revoke', async (req, res) => {
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

export default router;
