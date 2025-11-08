-- ============================================
-- SISTEMA COMPLETO DE PROTECTORES DE RACHA
-- ============================================

-- PASO 1: Tabla para registrar compras de protectores
-- ============================================
CREATE TABLE IF NOT EXISTS compra_protector (
  id_compra UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_perfil UUID NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1,
  costo_puntos INTEGER NOT NULL DEFAULT 250,
  fecha_compra TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  semana_compra INTEGER GENERATED ALWAYS AS (EXTRACT(WEEK FROM fecha_compra)) STORED,
  año_compra INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM fecha_compra)) STORED,
  CONSTRAINT compra_protector_cantidad_positiva CHECK (cantidad > 0),
  CONSTRAINT compra_protector_costo_positivo CHECK (costo_puntos > 0)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_compra_protector_perfil ON compra_protector(id_perfil);
CREATE INDEX IF NOT EXISTS idx_compra_protector_fecha ON compra_protector(fecha_compra);
CREATE INDEX IF NOT EXISTS idx_compra_protector_semana ON compra_protector(id_perfil, semana_compra, año_compra);

COMMENT ON TABLE compra_protector IS 'Registro de compras de protectores de racha con puntos';
COMMENT ON COLUMN compra_protector.semana_compra IS 'Semana del año en que se realizó la compra (1-53)';
COMMENT ON COLUMN compra_protector.año_compra IS 'Año en que se realizó la compra';

-- PASO 2: Tabla para registrar uso de protectores
-- ============================================
CREATE TABLE IF NOT EXISTS uso_protector (
  id_uso UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_perfil UUID NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
  id_habito UUID NOT NULL REFERENCES habito(id_habito) ON DELETE CASCADE,
  fecha_uso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  racha_protegida INTEGER NOT NULL,
  CONSTRAINT uso_protector_racha_positiva CHECK (racha_protegida >= 0)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_uso_protector_perfil ON uso_protector(id_perfil);
CREATE INDEX IF NOT EXISTS idx_uso_protector_habito ON uso_protector(id_habito);
CREATE INDEX IF NOT EXISTS idx_uso_protector_fecha ON uso_protector(fecha_uso);

COMMENT ON TABLE uso_protector IS 'Registro de cuándo y dónde se usaron los protectores de racha';
COMMENT ON COLUMN uso_protector.racha_protegida IS 'Número de días de racha que se protegió';

-- PASO 3: Función para verificar límite semanal de compras
-- ============================================
CREATE OR REPLACE FUNCTION puede_comprar_protector(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  compras_esta_semana INTEGER;
  semana_actual INTEGER;
  año_actual INTEGER;
BEGIN
  -- Obtener semana y año actuales
  semana_actual := EXTRACT(WEEK FROM NOW());
  año_actual := EXTRACT(YEAR FROM NOW());
  
  -- Contar compras en esta semana
  SELECT COUNT(*) INTO compras_esta_semana
  FROM compra_protector
  WHERE id_perfil = user_id
    AND semana_compra = semana_actual
    AND año_compra = año_actual;
  
  -- Permitir si no ha comprado esta semana (límite: 1 por semana)
  RETURN compras_esta_semana < 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION puede_comprar_protector IS 'Verifica si el usuario puede comprar un protector esta semana (límite: 1 por semana)';

-- PASO 4: Función para calcular protectores ganados por racha
-- ============================================
CREATE OR REPLACE FUNCTION calcular_protectores_por_racha(dias_racha INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Fórmula: 1 protector cada 7 días de racha
  -- Ejemplos:
  --   0-6 días: 0 protectores
  --   7-13 días: 1 protector
  --   14-20 días: 2 protectores
  --   21-27 días: 3 protectores
  --   100 días: 14 protectores
  RETURN FLOOR(dias_racha / 7);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_protectores_por_racha IS 'Calcula cuántos protectores debe tener un usuario según sus días de racha (1 cada 7 días)';

-- PASO 5: Vista para estadísticas de protectores
-- ============================================
CREATE OR REPLACE VIEW estadisticas_protectores AS
SELECT 
  p.id,
  p.nombre,
  p.protectores_racha,
  COALESCE(MAX(r.racha_actual), 0) as racha_maxima_actual,
  calcular_protectores_por_racha(COALESCE(MAX(r.racha_maxima), 0)) as protectores_esperados_por_racha,
  COUNT(DISTINCT cp.id_compra) as total_compras,
  COALESCE(SUM(cp.costo_puntos), 0) as total_puntos_gastados,
  COUNT(DISTINCT up.id_uso) as total_protectores_usados
FROM perfil p
LEFT JOIN racha r ON r.id_perfil = p.id
LEFT JOIN compra_protector cp ON cp.id_perfil = p.id
LEFT JOIN uso_protector up ON up.id_perfil = p.id
GROUP BY p.id, p.nombre, p.protectores_racha;

COMMENT ON VIEW estadisticas_protectores IS 'Vista con estadísticas completas de protectores por usuario';

-- PASO 6: Verificación final
-- ============================================
-- Verificar que las tablas se crearon correctamente
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as num_columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('compra_protector', 'uso_protector')
ORDER BY table_name;

-- Verificar que las funciones se crearon
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('puede_comprar_protector', 'calcular_protectores_por_racha')
ORDER BY routine_name;
