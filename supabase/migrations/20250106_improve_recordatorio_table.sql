-- ============================================
-- Mejoras a la tabla recordatorio
-- ============================================
-- Este script agrega índices y constraints para optimizar el sistema

-- 1. Agregar índice para búsquedas por hora (muy importante para performance)
CREATE INDEX IF NOT EXISTS idx_recordatorio_activo_hora 
ON recordatorio(activo, intervalo_recordar) 
WHERE activo = true;

-- 2. Agregar índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_recordatorio_perfil 
ON recordatorio(id_perfil);

-- 3. Agregar índice para búsquedas por hábito
CREATE INDEX IF NOT EXISTS idx_recordatorio_habito 
ON recordatorio(id_habito);

-- 4. Agregar constraint para validar formato de hora
ALTER TABLE recordatorio 
ADD CONSTRAINT check_intervalo_format 
CHECK (intervalo_recordar::time IS NOT NULL);

-- 5. Agregar timestamp para tracking
ALTER TABLE recordatorio 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE recordatorio 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. Agregar columna para últimos envíos (opcional, para tracking)
ALTER TABLE recordatorio 
ADD COLUMN IF NOT EXISTS ultimo_envio TIMESTAMP WITH TIME ZONE;

-- 7. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_recordatorio_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_recordatorio_timestamp ON recordatorio;
CREATE TRIGGER trigger_update_recordatorio_timestamp
BEFORE UPDATE ON recordatorio
FOR EACH ROW
EXECUTE FUNCTION update_recordatorio_timestamp();

-- 9. Ver la estructura mejorada
\d recordatorio;

-- 10. Query de prueba para ver recordatorios activos agrupados por hora
SELECT 
  LEFT(intervalo_recordar::text, 5) as hora,
  COUNT(*) as total_recordatorios,
  COUNT(DISTINCT id_perfil) as usuarios_unicos
FROM recordatorio
WHERE activo = true
GROUP BY hora
ORDER BY hora;
