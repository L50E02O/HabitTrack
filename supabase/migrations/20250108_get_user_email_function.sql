-- ============================================
-- Función para obtener email de usuario
-- ============================================
-- Esta función permite a las Edge Functions obtener el email de auth.users

CREATE OR REPLACE FUNCTION get_user_email(user_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id::uuid;
  
  RETURN user_email;
END;
$$;

-- Drop old function if exists
DROP FUNCTION IF EXISTS get_user_email(uuid);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email(text) TO anon;
GRANT EXECUTE ON FUNCTION get_user_email(text) TO service_role;
