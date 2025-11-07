import { supabase } from "../../config/supabase";

/**
 * Envía un correo de recuperación de contraseña al usuario
 * @param email - Correo del usuario
 * @returns Promise con el resultado de la operación
 */
export async function sendPasswordResetEmail(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/new-password`,
  });
  return { data, error };
}

/**
 * Actualiza la contraseña del usuario con el token del correo de recuperación
 * @param newPassword - Nueva contraseña
 * @returns Promise con el resultado de la operación
 */
export async function updatePasswordWithToken(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}