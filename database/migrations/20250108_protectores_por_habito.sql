-- =====================================================
-- MIGRACIÓN: Asignación de Protectores por Hábito
-- Fecha: 2025-11-08
-- Descripción: Permite asignar protectores específicos 
--              a cada hábito individual
-- =====================================================

-- 1. Agregar columna para protectores asignados por hábito en la tabla racha
ALTER TABLE racha 
ADD COLUMN IF NOT EXISTS protectores_asignados INTEGER DEFAULT 0;

COMMENT ON COLUMN racha.protectores_asignados IS 'Protectores asignados específicamente a este hábito';

-- 2. Crear tabla para histórico de asignaciones de protectores
CREATE TABLE IF NOT EXISTS asignacion_protector (
    id_asignacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id UUID NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
    id_habito UUID NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT asignacion_protector_cantidad_positiva CHECK (cantidad > 0)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_asignacion_protector_perfil 
    ON asignacion_protector(id);

CREATE INDEX IF NOT EXISTS idx_asignacion_protector_habito 
    ON asignacion_protector(id_habito);

COMMENT ON TABLE asignacion_protector IS 'Histórico de asignaciones de protectores a hábitos específicos';

-- 3. Crear tabla para histórico de remoción de protectores
CREATE TABLE IF NOT EXISTS remocion_protector (
    id_remocion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id UUID NOT NULL REFERENCES perfil(id) ON DELETE CASCADE,
    id_habito UUID NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    fecha_remocion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT remocion_protector_cantidad_positiva CHECK (cantidad > 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_remocion_protector_perfil 
    ON remocion_protector(id);

CREATE INDEX IF NOT EXISTS idx_remocion_protector_habito 
    ON remocion_protector(id_habito);

COMMENT ON TABLE remocion_protector IS 'Histórico de remociones de protectores de hábitos específicos';

-- 4. Función para asignar protector a un hábito específico
CREATE OR REPLACE FUNCTION asignar_protector_a_habito(
    p_user_id UUID,
    p_habito_id UUID,
    p_cantidad INTEGER DEFAULT 1
) RETURNS JSON AS $$
DECLARE
    v_protectores_disponibles INTEGER;
    v_racha_id UUID;
    v_protectores_actuales INTEGER;
    -- Constantes para mensajes
    MSG_CANTIDAD_INVALIDA CONSTANT TEXT := 'La cantidad debe ser mayor a 0';
    MSG_PROTECTORES_INSUFICIENTES CONSTANT TEXT := 'No tienes suficientes protectores disponibles';
    MSG_ASIGNACION_EXITOSA CONSTANT TEXT := 'Protector asignado exitosamente';
BEGIN
    -- Validar que la cantidad sea positiva
    IF p_cantidad <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', MSG_CANTIDAD_INVALIDA
        );
    END IF;

    -- Obtener protectores disponibles en el perfil
    SELECT protectores_racha INTO v_protectores_disponibles
    FROM perfil
    WHERE id = p_user_id;

    -- Verificar que tenga suficientes protectores
    IF v_protectores_disponibles < p_cantidad THEN
        RETURN json_build_object(
            'success', false,
            'message', MSG_PROTECTORES_INSUFICIENTES
        );
    END IF;

    -- Obtener la racha del hábito usando JOIN con registro_intervalo
    SELECT r.id_racha, COALESCE(r.protectores_asignados, 0) 
    INTO v_racha_id, v_protectores_actuales
    FROM racha r
    INNER JOIN registro_intervalo ri ON r.id_registro_intervalo = ri.id_registro
    WHERE ri.id_habito = p_habito_id 
      AND r.racha_activa = true
    ORDER BY r.fin_racha DESC
    LIMIT 1;

    -- Si existe la racha, actualizar protectores
    IF v_racha_id IS NOT NULL THEN
        UPDATE racha
        SET protectores_asignados = protectores_asignados + p_cantidad
        WHERE id_racha = v_racha_id;
    ELSE
        -- No hay racha activa, pero igual registramos la intención
        -- Los protectores se usarán cuando se cree la primera racha
        v_protectores_actuales := 0;
    END IF;

    -- Descontar protectores del perfil
    UPDATE perfil
    SET protectores_racha = protectores_racha - p_cantidad
    WHERE id = p_user_id;

    -- Registrar la asignación
    INSERT INTO asignacion_protector (id, id_habito, cantidad)
    VALUES (p_user_id, p_habito_id, p_cantidad);

    RETURN json_build_object(
        'success', true,
        'message', MSG_ASIGNACION_EXITOSA,
        'protectores_asignados', v_protectores_actuales + p_cantidad
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Función para quitar protector de un hábito específico
CREATE OR REPLACE FUNCTION quitar_protector_de_habito(
    p_user_id UUID,
    p_habito_id UUID,
    p_cantidad INTEGER DEFAULT 1
) RETURNS JSON AS $$
DECLARE
    v_racha_id UUID;
    v_protectores_actuales INTEGER;
BEGIN
    -- Validar que la cantidad sea positiva
    IF p_cantidad <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'La cantidad debe ser mayor a 0'
        );
    END IF;

    -- Obtener la racha del hábito usando JOIN
    SELECT r.id_racha, COALESCE(r.protectores_asignados, 0) 
    INTO v_racha_id, v_protectores_actuales
    FROM racha r
    INNER JOIN registro_intervalo ri ON r.id_registro_intervalo = ri.id_registro
    WHERE ri.id_habito = p_habito_id 
      AND r.racha_activa = true
    ORDER BY r.fin_racha DESC
    LIMIT 1;

    -- Verificar que la racha existe
    IF v_racha_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', MSG_RACHA_NO_ENCONTRADA
        );
    END IF;

    -- Verificar que tenga suficientes protectores asignados
    IF v_protectores_actuales < p_cantidad THEN
        RETURN json_build_object(
            'success', false,
            'message', MSG_PROTECTORES_ASIGNADOS_INSUFICIENTES
        );
    END IF;

    -- Quitar protectores de la racha
    UPDATE racha
    SET protectores_asignados = protectores_asignados - p_cantidad
    WHERE id_racha = v_racha_id;

    -- Devolver protectores al perfil
    UPDATE perfil
    SET protectores_racha = protectores_racha + p_cantidad
    WHERE id = p_user_id;

    -- Registrar la remoción
    INSERT INTO remocion_protector (id, id_habito, cantidad)
    VALUES (p_user_id, p_habito_id, p_cantidad);

    RETURN json_build_object(
        'success', true,
        'message', MSG_REMOCION_EXITOSA,
        'protectores_asignados', v_protectores_actuales - p_cantidad
    );
END;
$$ LANGUAGE plpgsql;

-- 6. Función para obtener protectores asignados a un hábito
CREATE OR REPLACE FUNCTION obtener_protectores_de_habito(
    p_user_id UUID,
    p_habito_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_protectores INTEGER;
BEGIN
    SELECT COALESCE(r.protectores_asignados, 0) INTO v_protectores
    FROM racha r
    INNER JOIN registro_intervalo ri ON r.id_registro_intervalo = ri.id_registro
    WHERE ri.id_habito = p_habito_id 
      AND r.racha_activa = true
    ORDER BY r.fin_racha DESC
    LIMIT 1;

    RETURN COALESCE(v_protectores, 0);
END;
$$ LANGUAGE plpgsql;

-- 7. Vista para estadísticas de protectores por hábito
CREATE OR REPLACE VIEW estadisticas_protectores_habito AS
SELECT 
    h.id_perfil as id_perfil,
    h.id_habito,
    h.nombre_habito,
    COALESCE(MAX(r.protectores_asignados), 0) as protectores_asignados,
    COUNT(DISTINCT ap.id_asignacion) as total_asignaciones,
    COALESCE(SUM(ap.cantidad), 0) as total_asignados_historico,
    COUNT(DISTINCT rp.id_remocion) as total_remociones,
    COALESCE(SUM(rp.cantidad), 0) as total_removidos_historico,
    COUNT(DISTINCT up.id_uso) as total_usos,
    COALESCE(MAX(r.dias_consecutivos), 0) as dias_consecutivos
FROM habito h
LEFT JOIN registro_intervalo ri ON h.id_habito = ri.id_habito
LEFT JOIN racha r ON ri.id_registro = r.id_registro_intervalo AND r.racha_activa = true
LEFT JOIN asignacion_protector ap ON h.id_habito = ap.id_habito AND h.id_perfil = ap.id
LEFT JOIN remocion_protector rp ON h.id_habito = rp.id_habito AND h.id_perfil = rp.id
LEFT JOIN uso_protector up ON h.id_habito = up.id_habito AND h.id_perfil = up.id_perfil
GROUP BY h.id_perfil, h.id_habito, h.nombre_habito;

COMMENT ON VIEW estadisticas_protectores_habito IS 'Estadísticas completas de protectores por hábito';

-- 8. Trigger para validar que no se asignen más protectores de los disponibles
CREATE OR REPLACE FUNCTION validar_protectores_disponibles()
RETURNS TRIGGER AS $$
DECLARE
    v_protectores_disponibles INTEGER;
BEGIN
    SELECT protectores_racha INTO v_protectores_disponibles
    FROM perfil
    WHERE id = NEW.id;

    IF v_protectores_disponibles < NEW.cantidad THEN
        RAISE EXCEPTION 'No hay suficientes protectores disponibles';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_protectores
    BEFORE INSERT ON asignacion_protector
    FOR EACH ROW
    EXECUTE FUNCTION validar_protectores_disponibles();

-- =====================================================
-- EJEMPLOS DE USO
-- =====================================================

-- Asignar 2 protectores a un hábito
-- SELECT asignar_protector_a_habito('user-uuid', 'habito-uuid', 2);

-- Quitar 1 protector de un hábito
-- SELECT quitar_protector_de_habito('user-uuid', 'habito-uuid', 1);

-- Obtener protectores asignados a un hábito
-- SELECT obtener_protectores_de_habito('user-uuid', 'habito-uuid');

-- Ver estadísticas de protectores por hábito
-- SELECT * FROM estadisticas_protectores_habito WHERE id = 'user-uuid';
