-- ============================================
-- Script para crear un recordatorio de prueba
-- ============================================

-- INSTRUCCIONES:
-- 1. Copia este script
-- 2. Ve a: https://supabase.com/dashboard/project/pahegdcyadnndhbtzaps/editor
-- 3. Pega el script en el SQL Editor
-- 4. Reemplaza los valores marcados con [TU_ID_AQUI]
-- 5. Ejecuta

-- NOTA: Necesitarás conocer:
-- - Tu id_perfil (de la tabla perfil)
-- - Un id_habito (de la tabla habito)

-- Para obtener tu id_perfil:
-- SELECT id_perfil, email FROM perfil LIMIT 5;

-- Para obtener un id_habito:
-- SELECT id_habito, nombre_habito FROM habito LIMIT 5;

-- Calcula la hora actual + 2 minutos para la prueba
-- (Esto hará que el email se envíe en 2 minutos)
WITH hora_prueba AS (
  SELECT 
    TO_CHAR((NOW() + INTERVAL '2 minutes')::time, 'HH24:MI') as hora
)
-- Inserta el recordatorio de prueba
INSERT INTO recordatorio (
  id_perfil,
  id_habito,
  mensaje,
  activo,
  intervalo_recordar
)
SELECT 
  '[TU_ID_PERFIL_AQUI]',  -- Reemplaza con tu id_perfil
  '[TU_ID_HABITO_AQUI]',   -- Reemplaza con un id_habito válido
  '¡Es hora de completar tu hábito! Este es un recordatorio de prueba.',
  true,
  hora
FROM hora_prueba
RETURNING *;

-- Para ver los recordatorios creados:
-- SELECT * FROM recordatorio ORDER BY created_at DESC LIMIT 5;

-- Para eliminar este recordatorio después de la prueba:
-- DELETE FROM recordatorio WHERE mensaje LIKE '%recordatorio de prueba%';
