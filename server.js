// server.js - Punto de entrada para Azure App Service
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import googleFitRoutes from './src/services/googleFit/routes.ts';

// Cargar variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Iniciando servidor en Azure...');
console.log('📍 SUPABASE_URL:', SUPABASE_URL ? 'Configurado ✓' : 'No configurado ✗');
console.log('🔑 SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'Configurado ✓' : 'No configurado ✗');
console.log('🏋️ GOOGLE_FIT_CLIENT_ID:', process.env.GOOGLE_FIT_CLIENT_ID ? 'Configurado ✓' : 'No configurado ✗');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Configure them in Azure App Service Settings.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();

// Configurar CORS
const frontendUrl = process.env.FRONTEND_URL;
app.use(cors({
  origin: frontendUrl ? frontendUrl.split(',') : '*', // Permitir múltiples URLs separadas por coma
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Rutas de Google Fit
console.log('📦 Cargando rutas de Google Fit...');
app.use('/api/google-fit', googleFitRoutes);

// Endpoint de ranking
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

// Health Connect Mock (para compatibilidad)
let datosMock = {
  pasos: 8542,
  frecuenciaCardiaca: 72,
  caloriasQuemadas: 425.5,
  distanciaKm: 6.3,
  horasSueno: 7.5,
  minutosEjercicio: 45,
  nivelOxigeno: 98,
};

app.get('/api/health-connect/estado', (req, res) => {
  res.json({
    disponible: true,
    aplicacionOrigen: 'Mi Smartwatch (Mock)',
    ultimaSincronizacion: new Date().toISOString(),
    permisosOtorgados: true
  });
});

app.get('/api/health-connect/permisos', (req, res) => {
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

app.post('/api/health-connect/permisos/solicitar', (req, res) => {
  res.json({ otorgados: true });
});

app.get('/api/health-connect/datos', (req, res) => {
  const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
  const variacion = Math.random() * 0.1 + 0.95;

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

app.post('/api/health-connect/datos', (req, res) => {
  datosMock = { ...datosMock, ...req.body };
  res.json({ success: true, datos: datosMock });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

const port = process.env.PORT || 3001;
app.listen(port, '0.0.0.0', () => {
  console.log('');
  console.log('✅ Servidor corriendo exitosamente!');
  console.log(`🌐 URL: http://0.0.0.0:${port}`);
  console.log(`🏋️ Google Fit API: http://0.0.0.0:${port}/api/google-fit`);
  console.log(`💊 Health Connect Mock: http://0.0.0.0:${port}/api/health-connect`);
  console.log(`🏥 Health Check: http://0.0.0.0:${port}/health`);
  console.log('');
});
