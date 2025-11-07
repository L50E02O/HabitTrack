import { supabase } from "../../config/supabase";
import type { IRacha, CreateIRacha, UpdateIRacha } from "../../types/IRacha";

export async function createRacha(nuevaRacha: CreateIRacha): Promise<IRacha>{
    const { data, error} = await supabase
    .from("racha")
    .insert(nuevaRacha)
    .single();

    if(error){
        throw new Error(error.message);
    }
    return data;
}

export async function getAllRachas(): Promise<IRacha[]>{
    const { data, error } = await supabase
    .from("racha")
    .select("*");

    if(error){
        throw new Error(error.message);
    }
    return data;
}

export async function getRachaById(id: string): Promise<IRacha>{
    const { data, error } =  await supabase
    .from("racha")
    .select("*")
    .eq("id_racha", id)
    .single();

    if(error){
        throw new Error(error.message);
    }

    return data;
}

export async function updateRacha(id: string, racha: UpdateIRacha): Promise<void>{
    const { error } = await supabase
    .from("racha")
    .update(racha)
    .eq("id_racha", id)
    .single();

    if(error){
        throw new Error(error.message);
    }
}

export async function deleteRacha(id: string): Promise<void>{
    const { error } = await supabase
    .from("racha")
    .delete()
    .eq("id_racha", id);

    if(error){
        throw new Error(error.message);
    }
}
