-- Verificar estructura real de la tabla recordatorio en Supabase
-- Ejecuta esto en Supabase SQL Editor para ver la estructura real:

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'recordatorio'
ORDER BY 
    ordinal_position;

-- Si la tabla no existe, crearla con la estructura del diagrama:
-- (Basándonos en lo que veo en el diagrama amarillo)

CREATE TABLE IF NOT EXISTS recordatorio (
    id_recordatorio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_perfil UUID REFERENCES perfil(id_perfil),
    id_habito UUID REFERENCES habito(id_habito),
    mensaje TEXT,
    activo BOOLEAN DEFAULT true,
    intervalo_recordatorio VARCHAR(50)
);

-- O si quieres usar la estructura que parece estar en el diagrama visual:
-- (que parece ser más como un registro de completitud)

/*
CREATE TABLE IF NOT EXISTS recordatorio (
    id_recordatorio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_perfil UUID REFERENCES perfil(id_perfil),
    id_habito UUID REFERENCES habito(id_habito),
    fecha DATE DEFAULT CURRENT_DATE,
    cumplido BOOLEAN DEFAULT false,
    puntos INTEGER DEFAULT 0
);
*/
