import { supabase } from "../../config/supabase";
import type { IHabito, CreateIHabito, UpdateIHabito } from "../../types/IHabito";

export async function createHabito(nuevoHabito: CreateIHabito): Promise<IHabito> {
    const { data, error } = await supabase
        .from("habito")
        .insert(nuevoHabito)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
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
