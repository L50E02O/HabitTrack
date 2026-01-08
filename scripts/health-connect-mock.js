/**
 * Servidor Mock para Health Connect API
 * Simula respuestas de Health Connect para desarrollo local
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  🏥 Health Connect Mock API                                ║
║  📡 Corriendo en http://localhost:${PORT}                   ║
║                                                            ║
║  Endpoints disponibles:                                    ║
║  - GET  /api/health-connect/estado                         ║
║  - GET  /api/health-connect/permisos                       ║
║  - POST /api/health-connect/permisos/solicitar             ║
║  - GET  /api/health-connect/datos?fecha=YYYY-MM-DD         ║
║                                                            ║
║  💡 Este es un servidor MOCK para desarrollo               ║
║  📊 Datos simulados - no conecta con Health Connect real   ║
╚════════════════════════════════════════════════════════════╝
  `);
});
