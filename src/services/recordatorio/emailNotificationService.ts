// No se necesita importar supabase aquí, se usa directamente en la Edge Function

/**
 * Envía un email de recordatorio usando la Edge Function de Supabase
 * La Edge Function usa SendGrid para enviar el email
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
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Configuración de Supabase no encontrada');
        }

        // Llamar a la Edge Function con el formato correcto
        // La Edge Function debe aceptar parámetros directos para envío individual
        const response = await fetch(`${supabaseUrl}/functions/v1/send-daily-reminders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
                toEmail: email,
                subject: titulo,
                message: mensaje,
                habitName: nombreHabito,
                // Indicar que es un envío directo, no un cron job
                directSend: true
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            console.error('Error en respuesta de Edge Function:', errorData);
            throw new Error(errorData.error || `Error enviando email: ${response.status}`);
        }

        const result = await response.json().catch(() => ({ success: true }));
        console.log('✅ Email enviado exitosamente:', result);
        return { success: true };
    } catch (error: any) {
        console.error('❌ Error enviando email de recordatorio:', error);
        return {
            success: false,
            error: error.message || 'Error enviando email',
        };
    }
}


