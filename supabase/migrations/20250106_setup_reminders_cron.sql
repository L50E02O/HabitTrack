-- ============================================
-- Configuración de Cron Jobs para Recordatorios
-- ============================================
-- Este script configura la ejecución automática de recordatorios cada minuto
-- usando pg_cron (necesitas activar la extensión en Supabase Dashboard)

-- 1. Habilitar la extensión pg_cron (si no está habilitada)
-- Ir a: Supabase Dashboard > Database > Extensions > Buscar "pg_cron" > Enable

-- 2. Crear función que invoque la Edge Function
CREATE OR REPLACE FUNCTION invoke_send_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url text;
  service_role_key text;
  response text;
BEGIN
  -- URL de tu Edge Function (reemplaza con tu URL real)
  function_url := 'https://pahegdcyadnndhbtzaps.supabase.co/functions/v1/send-daily-reminders';
  
  -- Service Role Key (configúrala como secret en Supabase)
  service_role_key := current_setting('app.settings.supabase_service_role_key', true);
  
  -- Invocar la función usando pg_net (extensión de Supabase)
  SELECT content::text INTO response
  FROM http_post(
    function_url,
    '{}',
    'application/json',
    ARRAY[
      http_header('Authorization', 'Bearer ' || service_role_key)
    ]
  );
  
  -- Log del resultado (opcional)
  RAISE NOTICE 'Reminders sent: %', response;
END;
$$;

-- 3. Programar la ejecución cada minuto
-- Esto ejecutará la función cada minuto de cada hora de cada día
SELECT cron.schedule(
  'send-daily-reminders',           -- Nombre del job
  '* * * * *',                       -- Cron expression: cada minuto
  'SELECT invoke_send_reminders();'  -- Comando SQL a ejecutar
);

-- 4. Ver los jobs programados (para verificar)
SELECT * FROM cron.job;

-- 5. Para desactivar el cron job (si necesitas):
-- SELECT cron.unschedule('send-daily-reminders');

-- 6. Ver el historial de ejecuciones:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
