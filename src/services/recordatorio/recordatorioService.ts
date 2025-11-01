import { supabase } from "../../config/supabase";
import type { IRecordatorio, CreateIRecordatorio, UpdateIRecordatorio } from "../../types/IRecordatorio";

export async function createRecordatorio(nuevoRecordatorio: CreateIRecordatorio): Promise<IRecordatorio>{
    const { data, error} = await supabase
    .from("recordatorio")
    .insert(nuevoRecordatorio)
    .single();

    if(error){
        throw new Error(error.message);
    }
    return data;
}

export async function getAllRecordatorios(): Promise<IRecordatorio[]>{
    const { data, error } = await supabase
    .from("recordatorio")
    .select("*");

    if(error){
        throw new Error(error.message);
    }
    return data;
}

export async function getRecordatorioById(id: string): Promise<IRecordatorio>{
    const { data, error } =  await supabase
    .from("recordatorio")
    .select("*")
    .eq("id_recordatorio", id)
    .single();

    if(error){
        throw new Error(error.message);
    }

    return data;
}

export async function updateRecordatorio(id: string, recordatorio: UpdateIRecordatorio): Promise<void>{
    const { error } = await supabase
    .from("recordatorio")
    .update(recordatorio)
    .eq("id_recordatorio", id)
    .single();

    if(error){
        throw new Error(error.message);
    }
}

export async function deleteRecordatorio(id: string): Promise<void>{
    const { error } = await supabase
    .from("recordatorio")
    .delete()
    .eq("id_recordatorio", id);

    if(error){
        throw new Error(error.message);
    }
}
