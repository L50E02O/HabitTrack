import { supabase } from "../../config/supabase";
import type { IRecordatorio } from "../../types/IRecordatorio";
import { enviarNotificacionViaSW, tieneServiceWorkerActivo } from "../../utils/pwaService";
import { enviarEmailRecordatorio } from "./emailNotificationService";

/**
 * Solicita permiso al usuario para mostrar notificaciones
 * @returns Promise con el resultado del permiso ("granted", "denied", "default")
 */
export async function solicitarPermisoNotificaciones(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
        throw new Error("Este navegador no soporta notificaciones");
    }

    if (Notification.permission === "granted") {
        return "granted";
    }

    const permission = await Notification.requestPermission();
    return permission;
}

/**
 * Verifica si ya tiene permiso para mostrar notificaciones
 * @returns true si tiene permiso, false si no
 */
export function verificarPermisoNotificaciones(): boolean {
    if (!("Notification" in window)) {
        return false;
    }

    return Notification.permission === "granted";
}

/**
 * Envía una notificación del navegador
 * Usa Service Worker si está disponible (PWA), sino usa la API de Notification directamente
 * @param titulo Título de la notificación
 * @param cuerpo Cuerpo del mensaje
 * @param opciones Opciones adicionales de la notificación
 */
export async function enviarNotificacion(
    titulo: string,
    cuerpo: string,
    opciones?: NotificationOptions
): Promise<Notification | null> {
    if (!verificarPermisoNotificaciones()) {
        console.warn("No se puede enviar notificación: sin permiso");
        return null;
    }

    const opcionesCompletas: NotificationOptions = {
        body: cuerpo,
        icon: "/icon-192.png",
        badge: "/badge.png",
        ...opciones,
    };

    // Intentar usar Service Worker si está disponible (mejor para PWA)
    if (tieneServiceWorkerActivo()) {
        try {
            await enviarNotificacionViaSW(titulo, cuerpo, opcionesCompletas);
            // Retornar null porque el SW maneja la notificación
            return null;
        } catch (error) {
            console.warn("Error enviando notificación via SW, usando API directa:", error);
            // Fallback a API directa si el SW falla
        }
    }

    // Fallback: usar API de Notification directamente
    try {
        const notificacion = new Notification(titulo, opcionesCompletas);
        return notificacion;
    } catch (error) {
        console.error("Error creando notificación:", error);
        return null;
    }
}

/**
 * Obtiene todos los recordatorios activos de un usuario
 * @param idPerfil ID del perfil del usuario
 * @returns Lista de recordatorios activos
 */
export async function obtenerRecordatoriosActivos(
    idPerfil: string
): Promise<IRecordatorio[]> {
    const { data, error } = await supabase
        .from("recordatorio")
        .select("*")
        .eq("id_perfil", idPerfil)
        .eq("activo", true);

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
}

/**
 * Convierte una hora UTC (formato "HH:MM:SS") a hora local
 * @param horaUTC Hora en formato UTC "HH:MM:SS"
 * @returns Objeto con horas y minutos en hora local
 */
function convertirUTCAHoraLocal(horaUTC: string): { horas: number; minutos: number } {
    // intervalo_recordar tiene formato "HH:MM:SS" o "HH:MM"
    const [horasUTC, minutosUTC] = horaUTC.split(":").map(Number);
    
    // Crear una fecha con la hora UTC
    const fecha = new Date();
    fecha.setUTCHours(horasUTC, minutosUTC || 0, 0, 0);
    
    // Obtener la hora local equivalente
    return {
        horas: fecha.getHours(),
        minutos: fecha.getMinutes()
    };
}

/**
 * Verifica si un recordatorio debe activarse en este momento
 * @param recordatorio Recordatorio a verificar
 * @param horaActual Hora actual para comparar (opcional, por defecto new Date())
 * @returns true si debe activarse, false si no
 */
export function debeActivarseRecordatorio(
    recordatorio: IRecordatorio,
    horaActual: Date = new Date()
): boolean {
    if (!recordatorio.activo) {
        return false;
    }

    // Convertir la hora UTC almacenada a hora local para comparar
    const horaLocalRecordatorio = convertirUTCAHoraLocal(recordatorio.intervalo_recordar);
    
    const horasActuales = horaActual.getHours();
    const minutosActuales = horaActual.getMinutes();

    return (
        horasActuales === horaLocalRecordatorio.horas && 
        minutosActuales === horaLocalRecordatorio.minutos
    );
}

// Mapa para rastrear qué recordatorios ya se enviaron en el minuto actual
// Clave: `${idPerfil}-${idRecordatorio}-${hora}-${minuto}`
const recordatoriosEnviados = new Map<string, number>();

/**
 * Limpia los recordatorios enviados que son de minutos anteriores
 * Esto evita que el mapa crezca indefinidamente
 */
function limpiarRecordatoriosAntiguos() {
    const ahora = new Date();
    const minutoActual = ahora.getHours() * 60 + ahora.getMinutes();
    
    // Eliminar entradas de minutos anteriores (más de 2 minutos atrás)
    for (const [key, minutoEnviado] of recordatoriosEnviados.entries()) {
        const diferencia = minutoActual - minutoEnviado;
        if (diferencia > 2 || diferencia < 0) { // Más de 2 minutos o día siguiente
            recordatoriosEnviados.delete(key);
        }
    }
}

/**
 * Verifica si un recordatorio ya fue enviado en este minuto
 * @param idPerfil ID del perfil
 * @param idRecordatorio ID del recordatorio
 * @param hora Hora actual (0-23)
 * @param minuto Minuto actual (0-59)
 * @returns true si ya fue enviado, false si no
 */
function yaFueEnviado(idPerfil: string, idRecordatorio: string, hora: number, minuto: number): boolean {
    const clave = `${idPerfil}-${idRecordatorio}-${hora}-${minuto}`;
    return recordatoriosEnviados.has(clave);
}

/**
 * Marca un recordatorio como enviado en este minuto
 * @param idPerfil ID del perfil
 * @param idRecordatorio ID del recordatorio
 * @param hora Hora actual (0-23)
 * @param minuto Minuto actual (0-59)
 */
function marcarComoEnviado(idPerfil: string, idRecordatorio: string, hora: number, minuto: number): void {
    const ahora = new Date();
    const minutoActual = ahora.getHours() * 60 + ahora.getMinutes();
    const clave = `${idPerfil}-${idRecordatorio}-${hora}-${minuto}`;
    recordatoriosEnviados.set(clave, minutoActual);
}

/**
 * Programa la verificación de recordatorios cada minuto
 * @param idPerfil ID del perfil del usuario
 * @returns ID del intervalo para poder cancelarlo
 */
export function programarNotificacionesDiarias(idPerfil: string): ReturnType<typeof setInterval> {
    console.log("🚀 [NOTIF] programarNotificacionesDiarias iniciado para perfil:", idPerfil);
    console.log("🚀 [NOTIF] Permiso de notificaciones:", Notification.permission);
    
    const intervalId = setInterval(async () => {
        try {
            // Limpiar recordatorios antiguos periódicamente
            limpiarRecordatoriosAntiguos();
            
            const recordatorios = await obtenerRecordatoriosActivos(idPerfil);
            const horaActual = new Date();
            const horasActuales = horaActual.getHours();
            const minutosActuales = horaActual.getMinutes();

            console.log(`⏰ [NOTIF] Verificando ${recordatorios.length} recordatorios a las ${horasActuales}:${minutosActuales.toString().padStart(2, '0')}`);
            
            if (recordatorios.length > 0) {
                console.log("📋 [NOTIF] Recordatorios encontrados:", recordatorios.map(r => ({
                    id: r.id_recordatorio,
                    hora: r.intervalo_recordar,
                    activo: r.activo,
                    mensaje: r.mensaje
                })));
            }

            for (const recordatorio of recordatorios) {
                const debeActivarse = debeActivarseRecordatorio(recordatorio, horaActual);
                
                console.log(`🔍 [NOTIF] Recordatorio ${recordatorio.id_recordatorio}:`, {
                    intervalo_recordar: recordatorio.intervalo_recordar,
                    horaActual: `${horasActuales}:${minutosActuales}`,
                    debeActivarse
                });
                
                if (debeActivarse) {
                    // Verificar si ya se envió en este minuto para evitar duplicados
                    if (yaFueEnviado(idPerfil, recordatorio.id_recordatorio, horasActuales, minutosActuales)) {
                        console.log(`⏭️ [NOTIF] Recordatorio ${recordatorio.id_recordatorio} ya fue enviado en este minuto, omitiendo...`);
                        continue;
                    }

                    // Marcar como enviado antes de enviar
                    marcarComoEnviado(idPerfil, recordatorio.id_recordatorio, horasActuales, minutosActuales);

                    console.log(`🔔 [NOTIF] *** ENVIANDO NOTIFICACIÓN *** Recordatorio ${recordatorio.id_recordatorio} a las ${horasActuales}:${minutosActuales.toString().padStart(2, '0')}`);

                    // Enviar notificación push (PWA)
                    enviarNotificacion(
                        "Recordatorio de Hábito",
                        recordatorio.mensaje || "Es hora de trabajar en tu hábito",
                        {
                            tag: `recordatorio-${recordatorio.id_recordatorio}`,
                            requireInteraction: false,
                            data: {
                                url: "/dashboard",
                                recordatorioId: recordatorio.id_recordatorio
                            }
                        }
                    ).catch((error) => {
                        console.error("❌ [NOTIF] Error enviando notificación push:", error);
                    });

                    // Enviar email usando Supabase (si está configurado)
                    try {
                        // Obtener email del usuario usando la función RPC
                        // Esto es más confiable que getUser() en el contexto del intervalo
                        const { data: userEmail, error: emailError } = await supabase
                            .rpc('get_user_email', { user_id: idPerfil });

                        if (emailError) {
                            console.warn("Error obteniendo email del usuario:", emailError);
                            // Fallback: intentar con getUser()
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user?.email) {
                                await enviarEmailConHabito(user.email, recordatorio);
                            }
                        } else if (userEmail) {
                            await enviarEmailConHabito(userEmail, recordatorio);
                        } else {
                            console.warn("No se encontró email para el usuario:", idPerfil);
                        }
                    } catch (emailError) {
                        console.warn("Error enviando email de recordatorio:", emailError);
                        // No bloqueamos la notificación push si falla el email
                    }
                }
            }
        } catch (error) {
            console.error("Error al verificar recordatorios:", error);
        }
    }, 60000); // Cada 60 segundos (1 minuto)

    return intervalId;
}

/**
 * Función auxiliar para enviar email con información del hábito
 */
async function enviarEmailConHabito(email: string, recordatorio: IRecordatorio): Promise<void> {
    // Obtener nombre del hábito si existe
    let nombreHabito = "tu hábito";
    if (recordatorio.id_habito) {
        const { data: habito } = await supabase
            .from('habito')
            .select('nombre_habito')
            .eq('id_habito', recordatorio.id_habito)
            .single();
        if (habito) {
            nombreHabito = habito.nombre_habito;
        }
    }

    const resultado = await enviarEmailRecordatorio(
        email,
        "Recordatorio de Hábito",
        recordatorio.mensaje || "Es hora de trabajar en tu hábito",
        nombreHabito
    );

    if (resultado.success) {
        console.log(`✅ Email enviado exitosamente a ${email}`);
    } else {
        console.warn(`⚠️ Error enviando email a ${email}:`, resultado.error);
    }
}

/**
 * Cancela la programación de notificaciones
 * @param intervalId ID del intervalo retornado por programarNotificacionesDiarias
 */
export function cancelarProgramacionNotificaciones(intervalId: ReturnType<typeof setInterval>): void {
    clearInterval(intervalId);
}