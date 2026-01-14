import { supabase } from "../../config/supabase";
import type { IHabito, CreateIHabito, UpdateIHabito } from "../../types/IHabito";

import { toDateString, getPeriodDates } from "../../utils/dateUtils";

export async function createHabito(nuevoHabito: CreateIHabito): Promise<IHabito> {
    // Validar meta_repeticion
    if (nuevoHabito.meta_repeticion < 1 || nuevoHabito.meta_repeticion > 365) {
        throw new Error("La meta de repetición debe estar entre 1 y 365");
    }

    // Crear el hábito
    const { data: habitoCreado, error: errorHabito } = await supabase
        .from("habito")
        .insert({
            ...nuevoHabito,
            unidad_medida: nuevoHabito.unidad_medida
        })
        .select()
        .single();

    if (errorHabito) {
        throw new Error(errorHabito.message);
    }

    // Obtener fechas del período base para el registro único
    const periodoInfo = getPeriodDates(habitoCreado.intervalo_meta);
    const hoyStr = toDateString(new Date());

    // Crear el ÚNICO registro de intervalo para este hábito
    const { data: registroCreado, error: errorRegistro } = await supabase
        .from("registro_intervalo")
        .insert({
            id_habito: habitoCreado.id_habito,
            fecha: hoyStr,
            fecha_inicio_intervalo: periodoInfo ? toDateString(periodoInfo.inicio) : hoyStr,
            fecha_fin_intervalo: periodoInfo ? toDateString(periodoInfo.fin) : hoyStr,
            cumplido: false,
            puntos: 0,
            progreso: 0,
            cumplido_periodo_anterior: false,
        })
        .select()
        .single();

    if (errorRegistro) {
        console.error("Error creando el registro de intervalo único:", errorRegistro);
    }

    // Crear racha inicial asociada al registro único
    if (registroCreado) {
        const { error: errorRacha } = await supabase
            .from("racha")
            .insert({
                id_registro_intervalo: registroCreado.id_registro,
                inicio_racha: hoyStr,
                fin_racha: hoyStr,
                dias_consecutivos: 0,
                racha_activa: false,
                protectores_asignados: 0,
            });

        if (errorRacha) {
            console.error("Error creando racha inicial:", errorRacha);
        }
    }

    return habitoCreado;
}

export async function getAllHabitos(): Promise<IHabito[]> {
    const { data, error } = await supabase
        .from("habito")
        .select("*");

    if (error) {
        throw new Error(error.message);
    }
    return data;
}

export async function getHabitoById(id: string): Promise<IHabito> {
    const { data, error } = await supabase
        .from("habito")
        .select("*")
        .eq("id_habito", id)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateHabito(id: string, habito: UpdateIHabito): Promise<void> {
    // Validar meta_repeticion si está presente
    if (habito.meta_repeticion !== undefined) {
        if (habito.meta_repeticion < 1 || habito.meta_repeticion > 365) {
            throw new Error("La meta de repetición debe estar entre 1 y 365");
        }
    }

    // Obtener el hábito actual para comparar
    const { data: habitoActual, error: errorGet } = await supabase
        .from("habito")
        .select("intervalo_meta")
        .eq("id_habito", id)
        .single();

    if (errorGet) {
        throw new Error(errorGet.message);
    }

    // Actualizar el hábito
    const { error } = await supabase
        .from("habito")
        .update(habito)
        .eq("id_habito", id)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Si cambió el intervalo_meta, regenerar los intervalos
    if (habito.intervalo_meta && habito.intervalo_meta !== habitoActual.intervalo_meta) {
        await regenerarIntervalosHabito(id, habito.intervalo_meta);
    }
}

async function regenerarIntervalosHabito(idHabito: string, nuevoIntervalo: string): Promise<void> {
    try {
        const periodoInfo = getPeriodDates(nuevoIntervalo);
        const hoyStr = toDateString(new Date());

        const { error: updateError } = await supabase
            .from("registro_intervalo")
            .update({
                fecha_inicio_intervalo: periodoInfo ? toDateString(periodoInfo.inicio) : hoyStr,
                fecha_fin_intervalo: periodoInfo ? toDateString(periodoInfo.fin) : hoyStr,
                // Reiniciamos progreso si cambia el intervalo, ya que es un "nuevo ciclo"
                progreso: 0,
                cumplido: false,
                puntos: 0
            })
            .eq("id_habito", idHabito);

        if (updateError) {
            console.error("Error al actualizar el registro de intervalo para el nuevo intervalo:", updateError);
        } else {
            console.log(`Registro de intervalo actualizado para hábito ${idHabito} con nuevo intervalo ${nuevoIntervalo}`);
        }

    } catch (error) {
        console.error("Error en regenerarIntervalosHabito:", error);
    }
}

export async function deleteHabito(id: string): Promise<void> {
    const { error } = await supabase
        .from("habito")
        .delete()
        .eq("id_habito", id);

    if (error) {
        throw new Error(error.message);
    }
}