-- ============================================
-- Configuración de Cron Jobs para Recordatorios
-- ============================================
-- PREREQUISITO: Habilitar pg_cron en Supabase Dashboard:
-- Dashboard > Database > Extensions > Buscar "pg_cron" > Enable

-- Programar la ejecución cada minuto usando pg_cron
-- Esto invocará la Edge Function cada minuto
SELECT cron.schedule(
  'send-daily-reminders',
  '* * * * *',
  $$
    SELECT
      net.http_post(
        url:='https://pahegdcyadnndhbtzaps.supabase.co/functions/v1/send-daily-reminders',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhaGVnZGN5YWRubmRoYnR6YXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzU2NzgsImV4cCI6MjA3NzI1MTY3OH0.TOBPejsOHSqpOF6A4eG-9oehk-gYH1zFR_pHFVLrIq8'
        ),
        body:='{}'::jsonb
      ) AS request_id;
  $$
);
