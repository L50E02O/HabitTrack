import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import googleFitRoutes from '../src/services/googleFit/routes.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Set them in your shell or in a .env file before running `npm run dev:api`.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Rutas de Google Fit
app.use('/api/google-fit', googleFitRoutes);

app.get('/api/getRanking', async (req, res) => {
  try {
    const rawLimit = req.query.limit ? Number(req.query.limit) : undefined;
    const MAX_LIMIT = 500;
    const limit = rawLimit && !Number.isNaN(rawLimit) ? Math.min(rawLimit, MAX_LIMIT) : undefined;

    let q = supabaseAdmin
      .from('perfil')
      .select('id, nombre, puntos, foto_perfil')
      .order('puntos', { ascending: false });

    if (limit) q = q.limit(limit);

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (err) {
    console.error('Error in /api/getRanking:', err);
    return res.status(500).json({ error: String(err) });
  }
});

// --- Health Connect Mock Implementation ---

// Datos simulados
let datosMock = {
  pasos: 8542,
  frecuenciaCardiaca: 72,
  caloriasQuemadas: 425.5,
  distanciaKm: 6.3,
  horasSueno: 7.5,
  minutosEjercicio: 45,
  nivelOxigeno: 98,
};

// Estado de Health Connect
app.get('/api/health-connect/estado', (req, res) => {
  console.log('GET /api/health-connect/estado');
  res.json({
    disponible: true,
    aplicacionOrigen: 'Mi Smartwatch (Mock)',
    ultimaSincronizacion: new Date().toISOString(),
    permisosOtorgados: true
  });
});

// Obtener permisos
app.get('/api/health-connect/permisos', (req, res) => {
  console.log('GET /api/health-connect/permisos');
  res.json({
    leerPasos: true,
    leerFrecuenciaCardiaca: true,
    leerCalorias: true,
    leerDistancia: true,
    leerSueno: true,
    leerEjercicio: true,
    leerOxigeno: true
  });
});

// Solicitar permisos
app.post('/api/health-connect/permisos/solicitar', (req, res) => {
  console.log('POST /api/health-connect/permisos/solicitar', req.body);
  res.json({
    otorgados: true
  });
});

// Obtener datos del día
app.get('/api/health-connect/datos', (req, res) => {
  const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
  console.log(`GET /api/health-connect/datos?fecha=${fecha}`);

  // Simular pequeñas variaciones en los datos
  const variacion = Math.random() * 0.1 + 0.95; // 95% - 105%

  res.json({
    pasos: Math.floor(datosMock.pasos * variacion),
    frecuenciaCardiaca: Math.floor(datosMock.frecuenciaCardiaca * variacion),
    caloriasQuemadas: parseFloat((datosMock.caloriasQuemadas * variacion).toFixed(1)),
    distanciaKm: parseFloat((datosMock.distanciaKm * variacion).toFixed(2)),
    horasSueno: parseFloat((datosMock.horasSueno * variacion).toFixed(1)),
    minutosEjercicio: Math.floor(datosMock.minutosEjercicio * variacion),
    nivelOxigeno: Math.min(100, Math.floor(datosMock.nivelOxigeno * variacion)),
    ultimaActualizacion: new Date().toISOString()
  });
});

// Actualizar datos (para testing)
app.post('/api/health-connect/datos', (req, res) => {
  console.log('POST /api/health-connect/datos', req.body);
  datosMock = { ...datosMock, ...req.body };
  res.json({ success: true, datos: datosMock });
});

// --- End Health Connect Mock ---

// --- Compatibility Routes (handle requests to root) ---
app.get('/estado', (req, res) => res.redirect('/api/health-connect/estado'));
app.get('/permisos', (req, res) => res.redirect('/api/health-connect/permisos'));
app.post('/permisos/solicitar', (req, res) => res.redirect(307, '/api/health-connect/permisos/solicitar'));
app.get('/datos', (req, res) => res.redirect('/api/health-connect/datos'));
app.post('/datos', (req, res) => res.redirect(307, '/api/health-connect/datos'));

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`Google Fit disponible en http://localhost:${port}/api/google-fit`);
  console.log(`Health Connect Mock disponible en http://localhost:${port}/api/health-connect`);
});
