/**
 * Ejemplo de integración de Google Fit en tu servidor Express
 * Archivo: scripts/dev-api.js (actualizado)
 */

import express from 'express';
import cors from 'cors';
import googleFitRoutes from '../src/services/googleFit/routes.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rutas de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas de Google Fit
app.use('/api/google-fit', googleFitRoutes);

// Otras rutas existentes...
// app.use('/api/habitos', habitosRoutes);
// app.use('/api/usuarios', usuariosRoutes);

app.listen(port, () => {
  console.log(`API corriendo en http://localhost:${port}`);
  console.log(`Google Fit auth disponible en http://localhost:${port}/api/google-fit/auth`);
});
