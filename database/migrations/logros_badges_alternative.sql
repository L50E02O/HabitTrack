-- OPCIÓN ALTERNATIVA: Si el script anterior da error, usa este
-- Este script verifica si los logros ya existen antes de insertarlos

-- Insertar logros solo si no existen (verificando por criterio_racha)
INSERT INTO logro (nombre_logro, descripcion, icono, criterio_racha)
SELECT 'Primer Paso', '¡Tu primera racha de 1 día! El inicio de algo grande', 'Flame', 1
WHERE NOT EXISTS (SELECT 1 FROM logro WHERE criterio_racha = 1);

INSERT INTO logro (nombre_logro, descripcion, icono, criterio_racha)
SELECT 'En Marcha', 'Racha de 3 días. ¡Vas por buen camino!', 'Zap', 3
WHERE NOT EXISTS (SELECT 1 FROM logro WHERE criterio_racha = 3);

INSERT INTO logro (nombre_logro, descripcion, icono, criterio_racha)
SELECT 'Compromiso', 'Racha de 7 días. Una semana completa', 'Star', 7
WHERE NOT EXISTS (SELECT 1 FROM logro WHERE criterio_racha = 7);

INSERT INTO logro (nombre_logro, descripcion, icono, criterio_racha)
SELECT 'Dedicación', 'Racha de 10 días. ¡Doble dígito!', 'Gem', 10
WHERE NOT EXISTS (SELECT 1 FROM logro WHERE criterio_racha = 10);

INSERT INTO logro (nombre_logro, descripcion, icono, criterio_racha)
SELECT 'Disciplinado', 'Racha de 15 días. La constancia es clave', 'Award', 15
WHERE NOT EXISTS (SELECT 1 FROM logro WHERE criterio_racha = 15);

INSERT INTO logro (nombre_logro, descripcion, icono, criterio_racha)
SELECT 'Imparable', 'Racha de 25 días. ¡Nadie te detiene!', 'Sparkles', 25
WHERE NOT EXISTS (SELECT 1 FROM logro WHERE criterio_racha = 25);

INSERT INTO logro (nombre_logro, descripcion, icono, criterio_racha)
SELECT 'Leyenda', 'Racha de 50 días. Medio centenar de dedicación', 'Medal', 50
WHERE NOT EXISTS (SELECT 1 FROM logro WHERE criterio_racha = 50);

INSERT INTO logro (nombre_logro, descripcion, icono, criterio_racha)
SELECT 'Titán', 'Racha de 100 días. ¡Tres cifras de constancia!', 'Trophy', 100
WHERE NOT EXISTS (SELECT 1 FROM logro WHERE criterio_racha = 100);

INSERT INTO logro (nombre_logro, descripcion, icono, criterio_racha)
SELECT 'Maestro', 'Racha de 250 días. Un verdadero maestro del hábito', 'Crown', 250
WHERE NOT EXISTS (SELECT 1 FROM logro WHERE criterio_racha = 250);

INSERT INTO logro (nombre_logro, descripcion, icono, criterio_racha)
SELECT 'Épico', 'Racha de 500 días. Nivel épico alcanzado', 'Sparkle', 500
WHERE NOT EXISTS (SELECT 1 FROM logro WHERE criterio_racha = 500);

INSERT INTO logro (nombre_logro, descripcion, icono, criterio_racha)
SELECT 'Legendario', 'Racha de 1000 días. ¡Eres una leyenda viviente!', 'Rocket', 1000
WHERE NOT EXISTS (SELECT 1 FROM logro WHERE criterio_racha = 1000);

-- Verificar los logros insertados
SELECT * FROM logro ORDER BY criterio_racha;
