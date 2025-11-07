import { supabase } from "../../config/supabase";
import type { ILogro, CreateILogro, UpdateILogro } from "../../types/ILogro";

export async function createLogro(nuevologro: CreateILogro): Promise<ILogro>{
    const { data, error} = await supabase
    .from("logro")
    .insert(nuevologro)
    .single();

    if(error){
        throw new Error(error.message);
    }
    return data;
}

export async function getAllLogros(): Promise<ILogro[]>{
    const { data, error } = await supabase
    .from("logro")
    .select("*");

    if(error){
        throw new Error(error.message);
    }
    return data;
}

export async function getLogroById(id: string): Promise<ILogro>{
    const { data, error } =  await supabase
    .from("logro")
    .select("*")
    .eq("id", id)
    .single();

    if(error){
        throw new Error(error.message);
    }

    return data;
}

export async function updateLogro(id: string, logro: UpdateILogro): Promise<void>{
    const { error } = await supabase
    .from("logro")
    .update(logro)
    .eq("id", id)
    .single();

    if(error){
        throw new Error(error.message);
    }
}

export async function deleteLogro(id: string): Promise<void>{
    const { error } = await supabase
    .from("logro")
    .delete()
    .eq("id", id);

    if(error){
        throw new Error(error.message);
    }
}