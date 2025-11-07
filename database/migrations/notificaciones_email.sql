-- Tabla para almacenar notificaciones de email
CREATE TABLE IF NOT EXISTS notificaciones_email (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destinatario VARCHAR(255) NOT NULL,
    asunto VARCHAR(500) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('habito_creado', 'racha_en_peligro', 'recordatorio_habito')),
    enviado BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_envio TIMESTAMP WITH TIME ZONE,
    error TEXT,
    reintentos INTEGER DEFAULT 0,
    CONSTRAINT notificaciones_email_reintentos_check CHECK (reintentos >= 0)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_notificaciones_email_destinatario ON notificaciones_email(destinatario);
CREATE INDEX idx_notificaciones_email_enviado ON notificaciones_email(enviado);
CREATE INDEX idx_notificaciones_email_tipo ON notificaciones_email(tipo);
CREATE INDEX idx_notificaciones_email_fecha_creacion ON notificaciones_email(fecha_creacion);

-- Comentarios de la tabla
COMMENT ON TABLE notificaciones_email IS 'Almacena las notificaciones de email pendientes y enviadas';
COMMENT ON COLUMN notificaciones_email.tipo IS 'Tipo de notificación: habito_creado, racha_en_peligro, recordatorio_habito';
COMMENT ON COLUMN notificaciones_email.enviado IS 'Indica si el email ya fue enviado exitosamente';
COMMENT ON COLUMN notificaciones_email.reintentos IS 'Número de intentos de envío en caso de fallo';
