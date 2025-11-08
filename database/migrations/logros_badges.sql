-- Insertar logros de racha tipo Duolingo
-- Los usuarios los desbloquearán automáticamente al alcanzar estos días de racha
-- El campo 'icono' ahora contiene el nombre del icono de Lucide React (sin emoji)

-- Primero, agregar constraint UNIQUE si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'logro_criterio_racha_unique'
    ) THEN
        ALTER TABLE logro ADD CONSTRAINT logro_criterio_racha_unique UNIQUE (criterio_racha);
    END IF;
END $$;

-- Insertar logros (se omiten si ya existen por criterio_racha)
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
