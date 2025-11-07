import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Recordatorio {
    id_recordatorio: string
    id_perfil: string
    id_habito: string
    mensaje: string
    activo: boolean
    intervalo_recordar: string
    perfil: {
        id: string
        nombre?: string
    }
    habito: {
        nombre_habito: string
        descripcion?: string
    }
}

serve(async (req) => {
    // Manejar CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Log de variables de entorno para debug
        console.log('🔧 Verificando configuración...')
        console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL') ? '✅ Configurada' : '❌ No configurada')
        console.log('SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? '✅ Configurada' : '❌ No configurada')
        console.log('RESEND_API_KEY:', Deno.env.get('RESEND_API_KEY') ? '✅ Configurada' : '❌ No configurada')

        // Cliente de Supabase
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Obtener la hora actual en formato HH:MM
        const now = new Date()
        const currentHour = String(now.getHours()).padStart(2, '0')
        const currentMinute = String(now.getMinutes()).padStart(2, '0')
        const currentTime = `${currentHour}:${currentMinute}:00`

        console.log(`🕐 Buscando recordatorios para las ${currentTime}...`)

        // Consultar recordatorios activos que coincidan con la hora actual
        // Usamos una función para convertir time a text y comparar solo HH:MM
        const { data: recordatorios, error: fetchError } = await supabaseClient
            .from('recordatorio')
            .select(`
        id_recordatorio,
        id_perfil,
        id_habito,
        mensaje,
        activo,
        intervalo_recordar,
        perfil:id_perfil (
          id,
          nombre
        ),
        habito:id_habito (
          nombre_habito,
          descripcion
        )
      `)
            .eq('activo', true)
            .gte('intervalo_recordar', `${currentHour}:${currentMinute}:00`)
            .lt('intervalo_recordar', `${currentHour}:${currentMinute}:59`)

        if (fetchError) {
            throw fetchError
        }

        if (!recordatorios || recordatorios.length === 0) {
            console.log('📭 No hay recordatorios para enviar en esta hora')
            return new Response(
                JSON.stringify({
                    message: 'No hay recordatorios para esta hora',
                    time: currentTime,
                    sent: 0
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                }
            )
        }

        console.log(`📬 Encontrados ${recordatorios.length} recordatorios para enviar`)

        // API Key de Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        if (!resendApiKey) {
            throw new Error('RESEND_API_KEY no está configurada')
        }

        // Enviar emails
        const results = []
        for (const recordatorio of recordatorios as Recordatorio[]) {
            try {
                // Obtener el email usando la función SQL (con cast explícito a UUID)
                const { data: userEmail, error: emailError } = await supabaseClient
                    .rpc('get_user_email', { user_id: recordatorio.id_perfil })

                if (emailError) {
                    console.error(`❌ Error obteniendo email para ${recordatorio.id_perfil}:`, emailError)
                }

                if (!userEmail) {
                    console.error(`❌ No se encontró email para perfil ${recordatorio.id_perfil}`)
                    results.push({
                        id: recordatorio.id_recordatorio,
                        success: false,
                        error: 'Email no encontrado'
                    })
                    continue
                }

                console.log(`📧 Email encontrado: ${userEmail}`)

                const userName = recordatorio.perfil?.nombre || 'Usuario'
                const habitName = recordatorio.habito?.nombre_habito || 'tu hábito'

                // Enviar email usando Resend
                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: 'HabitTrack <onboarding@resend.dev>',
                        to: [userEmail],
                        subject: `🔔 Recordatorio: ${habitName}`,
                        html: generateEmailHTML(userName, habitName, recordatorio.mensaje),
                    }),
                })

                const resendData = await emailResponse.json()

                if (!emailResponse.ok) {
                    console.error(`❌ Error enviando email a ${userEmail}:`, resendData)
                    results.push({
                        id: recordatorio.id_recordatorio,
                        success: false,
                        error: resendData.message || 'Error desconocido'
                    })
                } else {
                    console.log(`✅ Email enviado exitosamente a ${userEmail}`)
                    results.push({
                        id: recordatorio.id_recordatorio,
                        success: true,
                        emailId: resendData.id
                    })
                }

            } catch (emailError: any) {
                console.error(`❌ Error procesando recordatorio ${recordatorio.id_recordatorio}:`, emailError)
                results.push({
                    id: recordatorio.id_recordatorio,
                    success: false,
                    error: emailError.message
                })
            }
        }

        const successCount = results.filter(r => r.success).length
        console.log(`✅ Enviados ${successCount} de ${recordatorios.length} recordatorios`)

        return new Response(
            JSON.stringify({
                message: 'Proceso completado',
                time: currentTime,
                total: recordatorios.length,
                sent: successCount,
                failed: recordatorios.length - successCount,
                results
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error: any) {
        console.error('❌ Error en send-daily-reminders:', error)
        return new Response(
            JSON.stringify({
                error: error.message,
                details: error.toString()
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})

// Función para generar el HTML del email
function generateEmailHTML(userName: string, habitName: string, mensaje: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio - HabitTrack</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🔔 HabitTrack
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                Tu recordatorio diario
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 18px;">
                ¡Hola <strong>${userName}</strong>! 👋
              </p>
              
              <div style="background-color: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #667eea; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  RECORDATORIO
                </p>
                <h2 style="margin: 10px 0; color: #333333; font-size: 24px; font-weight: 700;">
                  ${habitName}
                </h2>
                <p style="margin: 15px 0 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
                  ${mensaje}
                </p>
              </div>
              
              <p style="margin: 30px 0 20px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                Este es tu recordatorio para mantener tu racha activa. ¡No pierdas el impulso! 🔥
              </p>
              
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center; padding: 20px 0;">
                    <a href="https://habittrack.app/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(102, 126, 234, 0.4);">
                      Ir a HabitTrack
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0; color: #888888; font-size: 14px; line-height: 1.6;">
                  💡 <strong>Consejo:</strong> La consistencia es clave. Aunque sea 5 minutos, cada día cuenta.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                HabitTrack - Construye mejores hábitos
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                Puedes desactivar este recordatorio desde tu dashboard
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
