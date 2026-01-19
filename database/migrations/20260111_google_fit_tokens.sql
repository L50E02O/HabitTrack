-- Migración para almacenar tokens de Google Fit
-- Uso: psql -U postgres -h localhost -d habittrack -f migrations/google_fit_tokens.sql

CREATE TABLE IF NOT EXISTS google_fit_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMP NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  CONSTRAINT user_id_not_empty CHECK (user_id != '')
);

CREATE INDEX IF NOT EXISTS idx_google_fit_tokens_user_id 
ON google_fit_tokens(user_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_google_fit_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_google_fit_tokens_updated_at 
ON google_fit_tokens;

CREATE TRIGGER trigger_update_google_fit_tokens_updated_at
BEFORE UPDATE ON google_fit_tokens
FOR EACH ROW
EXECUTE FUNCTION update_google_fit_tokens_updated_at();

-- Row Level Security (RLS)
ALTER TABLE google_fit_tokens ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios solo accedan a sus propios tokens
CREATE POLICY select_own_google_fit_tokens ON google_fit_tokens
FOR SELECT
USING (auth.uid()::text = user_id);

-- Política para que el servicio backend pueda insertar/actualizar (service role)
CREATE POLICY insert_service_google_fit_tokens ON google_fit_tokens
FOR INSERT
WITH CHECK (true);

CREATE POLICY update_service_google_fit_tokens ON google_fit_tokens
FOR UPDATE
USING (true);

-- Políticas para usuarios (si autenticados desde frontend)
DO $$
DECLARE
    ROLE_AUTHENTICATED CONSTANT TEXT := 'authenticated';
BEGIN
    EXECUTE format('CREATE POLICY insert_own_google_fit_tokens ON google_fit_tokens
        FOR INSERT
        WITH CHECK (auth.uid()::text = user_id OR auth.role() = %L)', ROLE_AUTHENTICATED);

    EXECUTE format('CREATE POLICY update_own_google_fit_tokens ON google_fit_tokens
        FOR UPDATE
        USING (auth.uid()::text = user_id OR auth.role() = %L)', ROLE_AUTHENTICATED);

    EXECUTE format('CREATE POLICY delete_own_google_fit_tokens ON google_fit_tokens
        FOR DELETE
        USING (auth.uid()::text = user_id OR auth.role() = %L)', ROLE_AUTHENTICATED);
END $$;
