import { supabase } from "../../config/supabase";
import type { IHabito, CreateIHabito, UpdateIHabito } from "../../types/IHabito";

export async function createHabito(nuevoHabito: CreateIHabito): Promise<IHabito> {
    // Validar meta_repeticion
    if (nuevoHabito.meta_repeticion < 1 || nuevoHabito.meta_repeticion > 365) {
        throw new Error("La meta de repetición debe estar entre 1 y 365");
    }

    // Crear el hábito
    const { data: habitoCreado, error: errorHabito } = await supabase
        .from("habito")
        .insert(nuevoHabito)
        .select()
        .single();

    if (errorHabito) {
        throw new Error(errorHabito.message);
    }

    // Crear registro_intervalo inicial
    const hoy = new Date();
    hoy.setUTCHours(0, 0, 0, 0);
    
    const { data: registroInicial, error: errorRegistro } = await supabase
        .from("registro_intervalo")
        .insert({
            id_habito: habitoCreado.id_habito,
            fecha: hoy.toISOString().split('T')[0],
            cumplido: false,
            puntos: 0,
            progreso: 0,
        })
        .select()
        .single();

    if (errorRegistro) {
        console.error("Error creando registro inicial:", errorRegistro);
        // No lanzamos error para no bloquear la creación del hábito
        // El registro se puede crear después
    }

    // Crear racha inicial
    if (registroInicial) {
        const { error: errorRacha } = await supabase
            .from("racha")
            .insert({
                id_registro_intervalo: registroInicial.id_registro,
                inicio_racha: hoy.toISOString().split('T')[0],
                fin_racha: hoy.toISOString().split('T')[0],
                dias_consecutivos: 0,
                racha_activa: true,
                protectores_asignados: 0,
            });

        if (errorRacha) {
            console.error("Error creando racha inicial:", errorRacha);
            // No lanzamos error para no bloquear la creación del hábito
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

    const { error } = await supabase
        .from("habito")
        .update(habito)
        .eq("id_habito", id)
        .single();

    if (error) {
        throw new Error(error.message);
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
