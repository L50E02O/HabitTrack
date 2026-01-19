-- ============================================
-- VERIFICACIÓN: Racha Máxima en Producción
-- Ejecuta esto en Supabase SQL Editor para verificar
-- ============================================

-- 1. Verificar que la columna existe
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'perfil' 
  AND column_name = 'racha_maxima';

-- 2. Ver valores actuales de racha_maxima
SELECT 
    id,
    email,
    racha_maxima,
    created_at
FROM perfil
ORDER BY racha_maxima DESC
LIMIT 10;

-- 3. Recalcular racha_maxima para todos los usuarios
-- (Por si acaso los valores están desactualizados)
-- IMPORTANTE: WHERE explícito para evitar actualizar todos los registros sin intención
UPDATE perfil p
SET racha_maxima = COALESCE(
  (
    SELECT MAX(r.dias_consecutivos)
    FROM racha r
    INNER JOIN registro_intervalo ri ON r.id_registro_intervalo = ri.id_registro
    INNER JOIN habito h ON ri.id_habito = h.id_habito
    WHERE h.id_perfil = p.id
  ),
  0
)
WHERE EXISTS (
  -- Solo actualizar perfiles que tienen hábitos asociados
  SELECT 1
  FROM habito h
  WHERE h.id_perfil = p.id
) OR p.racha_maxima IS NULL;

-- 4. Verificar que se actualizó correctamente
SELECT 
    p.email,
    p.racha_maxima,
    (
        SELECT MAX(r.dias_consecutivos)
        FROM racha r
        INNER JOIN registro_intervalo ri ON r.id_registro_intervalo = ri.id_registro
        INNER JOIN habito h ON ri.id_habito = h.id_habito
        WHERE h.id_perfil = p.id
    ) as racha_maxima_calculada
FROM perfil p
WHERE p.racha_maxima > 0
LIMIT 5;
