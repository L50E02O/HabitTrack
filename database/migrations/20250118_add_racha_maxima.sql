-- ============================================
-- MIGRACIÓN: Racha Máxima en Perfil
-- Fecha: 2025-11-18
-- Descripción: Mueve racha_maxima de tabla racha a tabla perfil
--              para evitar consultas pesadas y mejorar rendimiento
-- ============================================

-- 1. Agregar columna racha_maxima a la tabla perfil (si no existe)
ALTER TABLE perfil 
ADD COLUMN IF NOT EXISTS racha_maxima INTEGER DEFAULT 0;

COMMENT ON COLUMN perfil.racha_maxima IS 'Racha máxima alcanzada por el usuario en cualquier hábito (se actualiza automáticamente)';

-- 2. Migrar datos: Calcular racha máxima de cada usuario y actualizar su perfil
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
WHERE racha_maxima IS NULL OR racha_maxima = 0;

-- 3. Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_perfil_racha_maxima 
    ON perfil(racha_maxima DESC);

-- 4. Eliminar columna racha_maxima de tabla racha (si existe)
-- Primero verificar si existe antes de intentar eliminarla
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'racha' AND column_name = 'racha_maxima'
    ) THEN
        ALTER TABLE racha DROP COLUMN racha_maxima;
    END IF;
END $$;

-- 5. Verificar que todo funcionó correctamente
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'perfil' 
  AND column_name = 'racha_maxima';

-- 6. Ver algunas muestras de racha máxima por usuario
SELECT 
    id,
    nombre,
    racha_maxima,
    puntos,
    protectores_racha
FROM perfil
ORDER BY racha_maxima DESC
LIMIT 10;

-- RESULTADO ESPERADO:
-- ✅ Columna racha_maxima agregada a tabla perfil
-- ✅ Valores migrados desde tabla racha
-- ✅ Índice creado para optimizar consultas
-- ✅ Columna racha_maxima eliminada de tabla racha
-- ✅ La aplicación ahora consulta directamente desde perfil (1 query en lugar de múltiples)

-- VENTAJAS:
-- ✅ 1 consulta simple en lugar de JOIN complejo
-- ✅ Mejor rendimiento
-- ✅ Datos centralizados en el perfil del usuario
-- ✅ Fácil de consultar y actualizar
