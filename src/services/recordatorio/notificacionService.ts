import { supabase } from "../../config/supabase";
import type { IRecordatorio } from "../../types/IRecordatorio";
import { enviarNotificacionViaSW, tieneServiceWorkerActivo } from "../../utils/pwaService";

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
        badge: "/icon-192.png",
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

    // intervalo_recordar tiene formato "HH:MM:SS"
    const [horasRecordatorio, minutosRecordatorio] = recordatorio.intervalo_recordar
        .split(":")
        .map(Number);

    const horasActuales = horaActual.getHours();
    const minutosActuales = horaActual.getMinutes();

    return (
        horasActuales === horasRecordatorio && minutosActuales === minutosRecordatorio
    );
}

/**
 * Programa la verificación de recordatorios cada minuto
 * @param idPerfil ID del perfil del usuario
 * @returns ID del intervalo para poder cancelarlo
 */
export function programarNotificacionesDiarias(idPerfil: string): ReturnType<typeof setInterval> {
    const intervalId = setInterval(async () => {
        try {
            const recordatorios = await obtenerRecordatoriosActivos(idPerfil);
            const horaActual = new Date();

            for (const recordatorio of recordatorios) {
                if (debeActivarseRecordatorio(recordatorio, horaActual)) {
                    // enviarNotificacion ahora es async, pero no necesitamos await aquí
                    // ya que las notificaciones se envían de forma independiente
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
                        console.error("Error enviando notificación de recordatorio:", error);
                    });
                }
            }
        } catch (error) {
            console.error("Error al verificar recordatorios:", error);
        }
    }, 60000); // Cada 60 segundos (1 minuto)

    return intervalId;
}

/**
 * Cancela la programación de notificaciones
 * @param intervalId ID del intervalo retornado por programarNotificacionesDiarias
 */
export function cancelarProgramacionNotificaciones(intervalId: ReturnType<typeof setInterval>): void {
    clearInterval(intervalId);
}