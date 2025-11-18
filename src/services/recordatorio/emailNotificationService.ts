import { supabase } from "../../config/supabase";

/**
 * Envía un email de recordatorio usando Supabase Auth
 * Similar a resetPasswordForEmail, pero para recordatorios personalizados
 * @param email Email del destinatario
 * @param titulo Título del recordatorio
 * @param mensaje Mensaje del recordatorio
 * @param nombreHabito Nombre del hábito
 */
export async function enviarEmailRecordatorio(
    email: string,
    titulo: string,
    mensaje: string,
    nombreHabito: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Usar Supabase Auth para enviar email personalizado
        // Nota: Supabase Auth tiene limitaciones para emails personalizados
        // Por eso usamos la Edge Function que ya existe
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Configuración de Supabase no encontrada');
        }

        // Llamar a la Edge Function de Supabase para enviar el email
        const response = await fetch(`${supabaseUrl}/functions/v1/send-daily-reminders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
                email,
                titulo,
                mensaje,
                nombreHabito,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorData.error || 'Error enviando email');
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error enviando email de recordatorio:', error);
        return {
            success: false,
            error: error.message || 'Error enviando email',
        };
    }
}

/**
 * Envía notificación por email usando Supabase Auth (método alternativo)
 * Usa el sistema de emails de Supabase Auth
 */
export async function enviarEmailViaSupabaseAuth(
    email: string,
    subject: string,
    body: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Nota: Supabase Auth no tiene un método directo para enviar emails personalizados
        // excepto resetPasswordForEmail, confirmSignUp, etc.
        // Para emails personalizados, debemos usar Edge Functions o servicios externos
        
        // Por ahora, retornamos un error indicando que se debe usar la Edge Function
        console.warn('Para emails personalizados, usar la Edge Function send-daily-reminders');
        return {
            success: false,
            error: 'Use la Edge Function send-daily-reminders para emails personalizados',
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}

