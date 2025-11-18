const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

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

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Dev API listening on http://localhost:${port}`));
