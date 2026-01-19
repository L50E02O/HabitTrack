import type { VercelRequest, VercelResponse } from '@vercel/node';

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
}
