-- ============================================
-- MIGRACIÓN COMPLETA: Sistema de Logros y Protectores
-- ============================================

-- PASO 1: Agregar columna de protectores en tabla perfil
-- ============================================
ALTER TABLE perfil 
ADD COLUMN IF NOT EXISTS protectores_racha INTEGER DEFAULT 0;

COMMENT ON COLUMN perfil.protectores_racha IS 'Cantidad de protectores de racha disponibles. Se gana 1 protector cada 3 días de racha consecutiva';

-- PASO 2: Agregar constraint UNIQUE a criterio_racha (si no existe)
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'logro_criterio_racha_unique'
    ) THEN
        ALTER TABLE logro ADD CONSTRAINT logro_criterio_racha_unique UNIQUE (criterio_racha);
    END IF;
END $$;

-- PASO 3: Insertar logros de racha (se omiten duplicados)
-- ============================================
INSERT INTO logro (nombre_logro, descripcion, icono, criterio_racha) VALUES
  ('Primer Paso', '¡Tu primera racha de 1 día! El inicio de algo grande', 'Flame', 1),
  ('En Marcha', 'Racha de 3 días. ¡Vas por buen camino!', 'Zap', 3),
  ('Compromiso', 'Racha de 7 días. Una semana completa', 'Star', 7),
  ('Dedicación', 'Racha de 10 días. ¡Doble dígito!', 'Gem', 10),
  ('Disciplinado', 'Racha de 15 días. La constancia es clave', 'Award', 15),
  ('Imparable', 'Racha de 25 días. ¡Nadie te detiene!', 'Sparkles', 25),
  ('Leyenda', 'Racha de 50 días. Medio centenar de dedicación', 'Medal', 50),
  ('Titán', 'Racha de 100 días. ¡Tres cifras de constancia!', 'Trophy', 100),
  ('Maestro', 'Racha de 250 días. Un verdadero maestro del hábito', 'Crown', 250),
  ('Épico', 'Racha de 500 días. Nivel épico alcanzado', 'Sparkle', 500),
  ('Legendario', 'Racha de 1000 días. ¡Eres una leyenda viviente!', 'Rocket', 1000)
ON CONFLICT (criterio_racha) DO NOTHING;

-- PASO 4: Verificar resultados
-- ============================================
-- Verificar que se insertaron los logros
SELECT 
  nombre_logro,
  icono,
  criterio_racha,
  descripcion
FROM logro 
ORDER BY criterio_racha;

-- Verificar que la columna protectores_racha existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'perfil' AND column_name = 'protectores_racha';

-- RESULTADO ESPERADO:
-- ✅ 11 logros insertados (1, 3, 7, 10, 15, 25, 50, 100, 250, 500, 1000 días)
-- ✅ Columna protectores_racha agregada a tabla perfil
-- ✅ Constraint UNIQUE en criterio_racha
