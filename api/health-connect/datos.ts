import type { VercelRequest, VercelResponse } from '@vercel/node';

// Datos simulados (en producción esto vendría de una base de datos o servicio real)
const datosMock = {
  pasos: 8542,
  frecuenciaCardiaca: 72,
  caloriasQuemadas: 425.5,
  distanciaKm: 6.3,
  horasSueno: 7.5,
  minutosEjercicio: 45,
  nivelOxigeno: 98,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
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
    return;
  }

  if (req.method === 'POST') {
    console.log('POST /api/health-connect/datos', req.body);
    // En producción, aquí guardarías los datos en una base de datos
    res.json({ success: true, datos: datosMock });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
