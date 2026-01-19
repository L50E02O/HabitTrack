-- ============================================
-- MIGRACIÓN: Tabla de Datos de Salud del Smartwatch
-- Fecha: 2025-01-19
-- Descripción: Crea tabla para almacenar datos de salud sincronizados del smartwatch S100
-- ============================================

-- Tabla para almacenar datos de salud del smartwatch
CREATE TABLE IF NOT EXISTS datos_salud (
  id_datos UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_perfil UUID NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  pasos INTEGER NOT NULL DEFAULT 0,
  frecuencia_cardiaca INTEGER,
  calorias_quemadas DECIMAL(10, 2),
  distancia_km DECIMAL(10, 2),
  horas_sueno DECIMAL(4, 2),
  fecha_sincronizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT datos_salud_pasos_positivos CHECK (pasos >= 0),
  CONSTRAINT datos_salud_frecuencia_valida CHECK (frecuencia_cardiaca IS NULL OR (frecuencia_cardiaca >= 30 AND frecuencia_cardiaca <= 220)),
  CONSTRAINT datos_salud_calorias_positivas CHECK (calorias_quemadas IS NULL OR calorias_quemadas >= 0),
  CONSTRAINT datos_salud_distancia_positiva CHECK (distancia_km IS NULL OR distancia_km >= 0),
  CONSTRAINT datos_salud_sueno_valido CHECK (horas_sueno IS NULL OR (horas_sueno >= 0 AND horas_sueno <= 24)),
  CONSTRAINT datos_salud_unico_por_dia UNIQUE (id_perfil, fecha)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_datos_salud_perfil ON datos_salud(id_perfil);
CREATE INDEX IF NOT EXISTS idx_datos_salud_fecha ON datos_salud(fecha);
CREATE INDEX IF NOT EXISTS idx_datos_salud_perfil_fecha ON datos_salud(id_perfil, fecha DESC);

-- Comentarios
COMMENT ON TABLE datos_salud IS 'Datos de salud sincronizados del smartwatch S100 (pasos, frecuencia cardíaca, etc.)';
COMMENT ON COLUMN datos_salud.pasos IS 'Número de pasos registrados en el día';
COMMENT ON COLUMN datos_salud.frecuencia_cardiaca IS 'Frecuencia cardíaca en bpm (beats per minute)';
COMMENT ON COLUMN datos_salud.calorias_quemadas IS 'Calorías quemadas durante el día';
COMMENT ON COLUMN datos_salud.distancia_km IS 'Distancia recorrida en kilómetros';
COMMENT ON COLUMN datos_salud.horas_sueno IS 'Horas de sueño registradas';
COMMENT ON COLUMN datos_salud.fecha_sincronizacion IS 'Fecha y hora de la última sincronización con el smartwatch';

-- Habilitar RLS (Row Level Security)
ALTER TABLE datos_salud ENABLE ROW LEVEL SECURITY;

-- Política RLS: Los usuarios solo pueden ver y modificar sus propios datos
CREATE POLICY "Usuarios pueden ver sus propios datos de salud"
  ON datos_salud
  FOR SELECT
  USING (auth.uid() = id_perfil);

CREATE POLICY "Usuarios pueden insertar sus propios datos de salud"
  ON datos_salud
  FOR INSERT
  WITH CHECK (auth.uid() = id_perfil);

CREATE POLICY "Usuarios pueden actualizar sus propios datos de salud"
  ON datos_salud
  FOR UPDATE
  USING (auth.uid() = id_perfil)
  WITH CHECK (auth.uid() = id_perfil);

CREATE POLICY "Usuarios pueden eliminar sus propios datos de salud"
  ON datos_salud
  FOR DELETE
  USING (auth.uid() = id_perfil);

-- Verificar que la tabla se creó correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'datos_salud'
ORDER BY ordinal_position;

-- RESULTADO ESPERADO:
-- ✅ Tabla datos_salud creada con todas las columnas
-- ✅ Índices creados para optimizar consultas
-- ✅ RLS habilitado con políticas de seguridad
-- ✅ Constraint único para evitar duplicados por día

