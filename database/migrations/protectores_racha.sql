-- Agregar columna para protectores de racha en la tabla perfil
ALTER TABLE perfil 
ADD COLUMN IF NOT EXISTS protectores_racha INTEGER DEFAULT 0;

-- Comentario explicativo
COMMENT ON COLUMN perfil.protectores_racha IS 'Cantidad de protectores de racha disponibles. Se gana 1 protector cada 3 días de racha consecutiva';
