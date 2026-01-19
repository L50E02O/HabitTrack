-- ============================================
-- MIGRACIÓN: Actualización para Health Connect
-- Fecha: 2026-01-07
-- Descripción: Actualiza tabla datos_salud para soportar Health Connect API
--              Agrega campos adicionales: minutos_ejercicio y nivel_oxigeno
-- ============================================

-- Agregar nuevas columnas para datos de Health Connect
ALTER TABLE datos_salud 
ADD COLUMN IF NOT EXISTS minutos_ejercicio INTEGER,
ADD COLUMN IF NOT EXISTS nivel_oxigeno INTEGER;

-- Agregar constraints para validar los nuevos campos
ALTER TABLE datos_salud
ADD CONSTRAINT IF NOT EXISTS datos_salud_ejercicio_valido 
  CHECK (minutos_ejercicio IS NULL OR (minutos_ejercicio >= 0 AND minutos_ejercicio <= 1440)),
ADD CONSTRAINT IF NOT EXISTS datos_salud_oxigeno_valido 
  CHECK (nivel_oxigeno IS NULL OR (nivel_oxigeno >= 70 AND nivel_oxigeno <= 100));

-- Actualizar comentarios para reflejar el cambio a Health Connect
COMMENT ON TABLE datos_salud IS 'Datos de salud sincronizados desde Health Connect (pasos, frecuencia cardíaca, ejercicio, oxígeno, etc.)';
COMMENT ON COLUMN datos_salud.minutos_ejercicio IS 'Minutos de ejercicio activo registrados desde Health Connect';
COMMENT ON COLUMN datos_salud.nivel_oxigeno IS 'Nivel de saturación de oxígeno en sangre (%) desde Health Connect';
COMMENT ON COLUMN datos_salud.fecha_sincronizacion IS 'Fecha y hora de la última sincronización con Health Connect';

-- Verificar que las columnas se agregaron correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'datos_salud'
ORDER BY ordinal_position;

-- Verificar constraints
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'datos_salud'::regclass
ORDER BY conname;

-- RESULTADO ESPERADO:
-- ✅ Columna minutos_ejercicio agregada (INTEGER, permite NULL)
-- ✅ Columna nivel_oxigeno agregada (INTEGER, permite NULL)
-- ✅ Constraint para ejercicio (0-1440 minutos, equivalente a 24 horas)
-- ✅ Constraint para oxígeno (70-100%)
-- ✅ Comentarios actualizados a Health Connect
