-- ============================================
-- Verificar que el cron job esté configurado
-- ============================================
-- Copia este script y ejecútalo en el SQL Editor de Supabase
-- Dashboard > SQL Editor > New query > Pega esto

-- Ver los cron jobs configurados
SELECT * FROM cron.job;

-- Ver el historial de ejecuciones (últimas 10)
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
