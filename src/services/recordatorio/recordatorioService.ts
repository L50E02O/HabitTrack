import { supabase } from "../../config/supabase";
import type { IRecordatorio, CreateIRecordatorio, UpdateIRecordatorio } from "../../types/IRecordatorio";

export async function createRecordatorio(nuevoRecordatorio: CreateIRecordatorio): Promise<IRecordatorio> {
    const { data, error } = await supabase
        .from("recordatorio")
        .insert(nuevoRecordatorio)
        .single();

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

export async function getAllRecordatorios(): Promise<IRecordatorio[]> {
    const { data, error } = await supabase
        .from("recordatorio")
        .select("*");

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

export async function getRecordatorioById(id: string): Promise<IRecordatorio> {
    const { data, error } = await supabase
        .from("recordatorio")
        .select("*")
        .eq("id_recordatorio", id)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateRecordatorio(id: string, recordatorio: UpdateIRecordatorio): Promise<void> {
    const { error } = await supabase
        .from("recordatorio")
        .update(recordatorio)
        .eq("id_recordatorio", id)
        .single();

    if (error) {
        throw new Error(error.message);
    }
}

export async function deleteRecordatorio(id: string): Promise<void> {
    const { error } = await supabase
        .from("recordatorio")
        .delete()
        .eq("id_recordatorio", id);

    if (error) {
        throw new Error(error.message);
    }
}

/**
 * Obtener todos los recordatorios de un usuario
 */
export async function getRecordatoriosByPerfil(idPerfil: string): Promise<IRecordatorio[]> {
    const { data, error } = await supabase
        .from("recordatorio")
        .select(`
            *,
            habito:id_habito (
                nombre_habito,
                descripcion
            )
        `)
        .eq("id_perfil", idPerfil)
        .order("intervalo_recordar", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }
    return data || [];
}

/**
 * Obtener recordatorios de un hábito específico
 */
export async function getRecordatoriosByHabito(idHabito: string): Promise<IRecordatorio[]> {
    const { data, error } = await supabase
        .from("recordatorio")
        .select("*")
        .eq("id_habito", idHabito)
        .order("intervalo_recordar", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }
    return data || [];
}

/**
 * Activar/desactivar un recordatorio
 */
export async function toggleRecordatorio(id: string, activo: boolean): Promise<void> {
    const { error } = await supabase
        .from("recordatorio")
        .update({ activo })
        .eq("id_recordatorio", id);

    if (error) {
        throw new Error(error.message);
    }
}

/**
 * Actualizar solo el mensaje de un recordatorio
 */
export async function updateMensajeRecordatorio(id: string, mensaje: string): Promise<void> {
    const { error } = await supabase
        .from("recordatorio")
        .update({ mensaje })
        .eq("id_recordatorio", id);

    if (error) {
        throw new Error(error.message);
    }
}

/**
 * Actualizar la hora de un recordatorio
 */
export async function updateHoraRecordatorio(id: string, intervalo_recordar: string): Promise<void> {
    const { error } = await supabase
        .from("recordatorio")
        .update({ intervalo_recordar })
        .eq("id_recordatorio", id);

    if (error) {
        throw new Error(error.message);
    }
}
